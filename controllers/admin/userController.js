const User = require('../../models/user');
const Token = require('../../models/token')
const Business = require('../../models/business');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')
const { body, validationResult } = require("express-validator");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require("fs");
const os = require("os");
const phoneHelper = require('../../utils/formatPhone')
const sendMail = require('../../utils/sendgrid');
const async = require('async')
const stripe = require('stripe')(process.env.STRIPE_TEST_SK);


// Create user get
exports.create_user_get = (req, res) => {
  const form = undefined;
  res.render('sign-up-form', { title: 'Sign Up', form })
};

// Create user get discount
exports.create_user_get_discount = (req, res) => {
  const form = undefined;
  res.render('sign-up-form-discount', { title: 'Sign Up', form })
};

// Create user post
exports.create_user_post = [

  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('email')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape()
    .withMessage('Email must be specified.')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (err) {
            reject(new Error('Server Error'))
          }
          if (Boolean(user)) {
            reject(new Error('E-mail already in use'))
          }
          resolve(true)
        });
      });
    }),
  body('password', 'Password must include 8 characters, 1 uppercase, 1 lowercase, 1 special character.')
    .trim()
    .isStrongPassword()
    .escape(),
  body('confirmPassword', 'Passwords must be the same.')
    .trim()
    .custom(async (confirmPassword, { req }) => {
      const password = req.body.password
      // If password and confirm password not same
      // don't allow to sign up and throw error
      if (password !== confirmPassword) {
        throw new Error('Passwords must be the same')
      }
    }),
  body('businessName', 'Business Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    const form = req.body
    if (!errors.isEmpty()) {
      res.render('sign-up-form', {
        title: 'Sign Up',
        errors: errors.array(),
        form
      })
      return;
    }
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        console.log('bcrypt errror')
        return next(err)
      }
      const createAccount = await stripe.accounts.create({ type: 'standard' });

      const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: 'ADMIN',
        password: hashedPassword
      });
      const business = new Business({
        name: req.body.businessName,
        stripeAcctID: createAccount.id,
        email: req.body.email,
        subscription: 'NONE',

      })
      user.business = business;
      // business.users.push(user);
      user.save()
      business.save()
      res.locals.signupType = 'trial';
      req.login(user, (err) => {
        if (!err) {
          res.redirect('/dashboard')
        } else {
          return next(err)
        }
      })

    })
  }
]

// Create user post
exports.create_user_post_discount = [

  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('email')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape()
    .withMessage('Email must be specified.')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (err) {
            reject(new Error('Server Error'))
          }
          if (Boolean(user)) {
            reject(new Error('E-mail already in use'))
          }
          resolve(true)
        });
      });
    }),
  body('password', 'Password must include 8 characters, 1 uppercase, 1 lowercase, 1 special character.')
    .trim()
    .isStrongPassword()
    .escape(),
  body('confirmPassword', 'Passwords must be the same.')
    .trim()
    .custom(async (confirmPassword, { req }) => {
      const password = req.body.password
      // If password and confirm password not same
      // don't allow to sign up and throw error
      if (password !== confirmPassword) {
        throw new Error('Passwords must be the same')
      }
    }),
  body('businessName', 'Business Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    const form = req.body
    if (!errors.isEmpty()) {
      res.render('sign-up-form', {
        title: 'Sign Up',
        errors: errors.array(),
        form
      })
      return;
    }
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        console.log('bcrypt errror')
        return next(err)
      }
      const createAccount = await stripe.accounts.create({ type: 'standard' });

      const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: 'ADMIN',
        password: hashedPassword
      });
      const business = new Business({
        name: req.body.businessName,
        stripeAcctID: createAccount.id,
        email: req.body.email,
        subscription: 'NONE',
        signupType: 'discount'

      })
      user.business = business;
      // business.users.push(user);
      user.save()
      business.save()

      req.login(user, (err) => {
        if (!err) {
          res.redirect('/dashboard')
        } else {
          return next(err)
        }
      })

    })
  }
]

////////// Dashboard Pages ///////////
exports.user_detail = (req, res, next) => {
  User.findById(req.params.id).exec(function (err, user) {
    if (err) {
      return next()
    }
    res.render('admin/user-detail', {
      title: 'User Detail',
      layout: './layouts/admin',
      user,
      phoneHelper
    })
  })
}

exports.user_list = (req, res, next) => {
  User.find()
    .sort({ lastName: 'desc' })
    .exec(function (err, list_users) {
      if (err) {
        return next(err);
      }
      console.log(err)
      res.render('admin/user-list', {
        title: 'Users',
        layout: './layouts/admin',
        user_list: list_users,
        phoneHelper
      })
    })
}

exports.user_create_get = (req, res) => {
  const user = undefined;
  res.render('admin/user-form-new', {
    title: 'New Administrator',
    layout: './layouts/admin',
    user
  })
};

exports.user_create_post = [
  body('businessName', 'Business name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('email')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape()
    .withMessage('Email must be specified.')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (err) {
            reject(new Error('Server Error'))
          }
          if (Boolean(user)) {
            reject(new Error('E-mail already in use'))
          }
          resolve(true)
        });
      });
    }),
  body('phone')
    .trim()
    .isLength({ min: 1 })
    .isMobilePhone()
    .escape()
    .withMessage('Phone number invalid.')
    .optional({ nullable: true, checkFalsy: true }),
  body('street', 'Street invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('city', 'City invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('province', 'Province invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('postal', 'Postal / Zip code invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('hst', 'HST / VAT invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('password', 'Password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);
    const userData = undefined;
    if (!errors.isEmpty()) {
      res.render('admin/user-form-new', {
        title: 'New User',
        layout: './layouts/admin',
        errors: errors.array(),
        user: userData
      })
      return;
    }
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) {
        console.log('bcrypt errror')
        return next(err)
      }
      const user = new User({
        businessName: req.body.businessName,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        street: req.body.street,
        city: req.body.city,
        province: req.body.province,
        postal: req.body.postal,
        hst: req.body.hst,
        password: hashedPassword,
        role: 'OWNER',
        subscription: 'NONE'
      }).save(err => {
        if (err) {
          console.log('user error')
          return next(err);
        }
        User.findOne({ email: req.body.email }, function (err, theuser) {
          res.redirect(theuser.url);
        })

      });
    })
  }
]

exports.user_delete_get = (req, res, next) => {
  User.findById(req.params.id).exec(function (err, user) {
    if (err) {
      return next(err);
    }
    if (user == null) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    res.render('admin/user-delete', {
      title: 'Delete User',
      layout: './layouts/admin',
      user
    });
  })
}

exports.user_delete_post = (req, res, next) => {
  User.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/admin/user-list');
  })
}

exports.user_update_get = (req, res, next) => {
  User.findById(req.params.id).exec(function (err, user) {
    if (err) {
      return next(err)
    }
    if (user == null) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    res.render('admin/user-form', {
      title: 'Update User',
      layout: './layouts/admin',
      user
    });
  });
}

exports.user_update_post = [
  body('businessName', 'Business name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('email', 'Email must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape(),
  body('phone')
    .trim()
    .isLength({ min: 1 })
    .isMobilePhone()
    .escape()
    .withMessage('Phone number invalid.')
    .optional({ nullable: true, checkFalsy: true }),
  body('street', 'Street invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('city', 'City invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('province', 'Province invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('postal', 'Postal / Zip code invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('hst', 'HST / VAT invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  (req, res, next) => {
    const errors = validationResult(req);

    const user = new User({
      businessName: req.body.businessName,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      province: req.body.province,
      postal: req.body.postal,
      hst: req.body.hst,
      _id: req.params.id
    })
    if (!errors.isEmpty()) {
      User.findById(req.params.id).exec(function (err, user) {
        if (err) {
          return next(err)
        }
        if (user == null) {
          const err = new Error('User not found');
          err.status = 404;
          return next(err);
        }
        res.render('admin/user-form', {
          title: 'Update User',
          layout: './layouts/admin',
          user,
          errors: errors.array()
        });
      });
      return;
    }
    User.findByIdAndUpdate(req.params.id, user, {}, (err, theuser) => {
      if (err) {
        return next(err);
      }
      res.redirect(theuser.url + '/update')
    });
  }
]

exports.user_change_password_get = (req, res, next) => {
  User.findById(req.params.id).exec(function (err, user) {
    if (err) {
      console.log('error in finding user')
      return next(err)
    }
    res.render('admin/change-password', {
      title: 'Change Password',
      layout: './layouts/admin'
    })
  })
}

exports.user_change_password_post = [
  body('oldPassword', 'Old password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('newPassword', 'New password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('confirmPassword', 'Passwords must be the same.')
    .trim()
    .custom(async (confirmPassword, { req }) => {
      const password = req.body.newPassword
      // If password and confirm password not same
      // don't allow to sign up and throw error
      if (password !== confirmPassword) {
        throw new Error('Passwords must be the same')
      }
    }),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('admin/change-password', {
        title: 'New User',
        layout: './layouts/admin',
        errors: errors.array()
      })
      return;
    } else {
      User.findById(req.params.id).exec(function (err, user) {
        if (err) {
          console.log('error in finding user')
          return next(err)
        }
        if (user == null) {
          const err = new Error('Client not found');
          err.status = 404;
          return next(err);
        }
        bcrypt.compare(req.body.oldPassword, user.password, function (err, matches) {
          if (err) {
            console.log('error while checking password')
            return next(err);
          } else if (matches) {
            bcrypt.hash(req.body.newPassword, 10, (err, hashedPassword) => {
              if (err) {
                return next(err)
              }
              user.password = hashedPassword;
              user.save();
              res.redirect(user.url)
            })
          } else {

            const error = [{ msg: 'Old password does not match' }]
            res.render('admin/change-password', {
              title: 'New User',
              layout: './layouts/admin',
              errors: error
            })
            return
          }
        })
      });
    }


  }
]

exports.reset_password_get = (req, res, next) => {
  // res.render
}

exports.reset_password_link = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
    }
    const link = `https://www.bearquotes.com/reset-password/${user._id}/${token.token}`;
    sendMail({
      from: {
        email: process.env.MAIL_USERNAME
      },
      to: user.email,
      subject: `Reset Password`,
      html: link,
    });
    // sendMail(user.email, "Password reset", link);
    res.redirect('/login')


  } catch (err) {
    // locals.errors = "Account doesn't exist."
    return next(err)
  }
}

exports.reset_password_post = [
  body('newPassword')
    .trim()
    .isStrongPassword(),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.userId);
      const token = await Token.findOne({ userId: user._id, token: req.params.token });
      if (!token || !user) {
        return next(err)
      }
      bcrypt.hash(req.body.newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return next(err)
        }
        user.password = hashedPassword;
        user.save();
        token.delete()
        res.redirect('/login')
      })
    } catch (err) {
      return next(err)
    }
  }
]

