const createError = require('http-errors');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
// const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { DateTime } = require('luxon');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const { body, validationResult } = require("express-validator");
const stripe = require('stripe')(process.env.STRIPE_TEST_SK);


const User = require('./models/user');
const Form = require('./models/formSubmission');
const Business = require('./models/business')

const indexRouter = require('./routes/index');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin');
const employeeRouter = require('./routes/employee');
const subscribeRouter = require('./routes/subscription');
const stripeRouter = require('./routes/stripe');

// Protected route function
checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  return res.redirect("/login")
}

// Authorization
checkAuthorized = (req, res, next) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.redirect('/dashboard')
  }
}

// Admin route function
checkSuperAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'SUPERADMIN') { return next() }
  return res.redirect('/login')
}

// Owner route function
checkAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'ADMIN') { return next() }
  return res.redirect('/login')
}

// Employee route function
checkEmployee = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'EMPLOYEE') { return next() }
  return res.redirect('/login')
}

// Check subrscription status
checkSubscriptionStatus = (req, res, next) => {
  Business.findOne({ _id: req.user.business }).exec((err, business) => {
    if (err) {
      return next(err)
    }
    if (business.subscription === 'BASIC' || business.subscription === 'PRO') { return next() }
    // res.locals.businessName = business.name;
    // console.log(business.name)
    if (business.signupType == 'discount') {
      return res.redirect('/subscribe/discount')
    } else {
      return res.redirect('/subscribe')
    }
    // if coming from /sign-up-discount
    // go to subscribe/discount
    // else go to subscribe

  })

}

// Count messages function
countMessages = (req, res, next) => {
  Form.countDocuments({ isRead: false }).exec(function (err, count) {
    if (err) {
      return next(err)
    }
    res.locals.count = count;
    next()
  })
}

// Database connection
// const mongoDb = process.env.DB_KEY;
const mongoDb = process.env.DB_KEY;
mongoose.set('strictQuery', false);
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));

// Passport local startegy
passport.use(
  new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, (username, password, done) => {
    User.findOne({ email: username }, (err, user) => {
      if (err) {
        console.log('local error')
        return done(err);
      }
      if (!user) {

        return done(null, false, { message: 'Incorrect email' });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          // Passwords match, log in user
          return done(null, user);
        } else {
          // passwords do not match
          return done(null, false, { message: 'Incorrect password' });
        }
      })
      // return done(null, user);
    });
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  })
});

const app = express();

// view engine setup
app.use(expressLayouts);
app.set('layout', './layouts/full-width');
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    "form-action": ["'self'", "https://billing.stripe.com", "https://buy.stripe.com", "https://connect.stripe.com", "https://checkout.stripe.com"],
    "img-src": ["'self'", "https: data: blob:", "https://*.google-analytics.com", "https://*.googletagmanager.com"],
    connectSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://checkout.stripe.com", "https://*.googletagmanager.com", "https://*.google-analytics.com"],

    scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://checkout.stripe.com", "https://*.googletagmanager.com", "https://*.google-analytics.com"],
    // "script-src-elem": ["self", "unsafe-eval"]
  }
}));
app.use(compression());
// app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(session({ secret: process.env.SECRET_KEY, store: MongoStore.create({ mongoUrl: mongoDb }), resave: false, saveUninitialized: true, cookie: { maxAge: 60 * 60 * 1000 } })); // 1 hour
app.use(passport.initialize());
app.use(passport.session());
app.use(logger('dev'));


app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public'), { index: false, extensions: ['html'] }));
app.use(express.static(path.join(__dirname, 'public')))

// Store user and business in local variables
app.use(async function (req, res, next) {
  if (req.user) {
    const business = await Business.findById(req.user.business);
    res.locals.currentUser = req.user;
    res.locals.business = business
  }
  next();
});

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

app.use('/', indexRouter);
app.use('/stripe', stripeRouter)
app.use('/dashboard', checkAdmin, checkSubscriptionStatus, dashboardRouter);
app.use('/admin', checkSuperAdmin, countMessages, adminRouter);
app.use('/employee', checkEmployee, checkSubscriptionStatus, employeeRouter);
app.use('/subscribe', checkAuthenticated, subscribeRouter);

// app.use('/dashboard', countMessages, dashboardRouter);

// Logout route
app.get('/log-out', async (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
})

// Login redirect
app.get('/redirectLogin', (req, res, next) => {
  if (req.user.role === 'SUPERADMIN') {
    return res.redirect('/admin');
  }
  if (req.user.role === 'ADMIN') {
    return res.redirect('/dashboard')
  }
  if (req.user.role === 'EMPLOYEE') {
    return res.redirect('/employee')
  }
  else {
    return next()
  }
})

// Login route
app.post(
  '/login', [
  body('email')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email must be specified.')
    .isEmail()
    .escape()
    .withMessage('Email is invalid.'),
  body('password', 'Password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
],
  (req, res, next) => {
    const errors = validationResult(req);
    const form = req.body;
    if (!errors.isEmpty()) {
      res.render('login', {
        title: 'Log In',
        errors: errors.array(),
        form
      })
      return
    }
    next();
  },
  passport.authenticate('local', {
    successRedirect: '/redirectLogin',
    failureRedirect: '/login'
  })

);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  if (!req.user) {
    res.render('error', { title: 'Page Not Found' });
  }
  if (req.user) {
    if (req.user.role === 'ADMIN') {
      res.render('error', { title: 'Page Not Found', parent_page: 'None', layout: 'layouts/dashboard' })

    }
    if (req.user.role === 'EMPLOYEE') {
      res.render('error', { title: 'Page Not Found', parent_page: 'None', layout: 'layouts/employee' })
    }
  }

});


/////// Uncomment to generate html files form ejs files

// var fs = require('fs'),
//   ejs = require("ejs");
// function ejs2html(pathFunc, information) {
//   let filename = path.parse(pathFunc).base;
//   fs.readFile(pathFunc, 'utf8', function (err, data) {
//     if (err) { console.log(err); return false; }
//     var ejs_string = data,
//       template = ejs.compile(ejs_string),
//       html = template(information);
//     fs.writeFile(__dirname + '/public/' + filename + '.html', html, function (err) {
//       if (err) { console.log(err); return false }
//       return true;
//     });
//   });
// }
// function renderPage() {
//   const locals = {
//     title: 'Index',
//     layout: './layouts/full-width',
//     errors: undefined
//   }
//   ejs2html(__dirname + "/views/index.ejs", locals)
// }
// renderPage();


module.exports = app;
