const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require("express-validator");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require("fs");
const os = require("os");
const phoneHelper = require('../../utils/formatPhone');
const Business = require('../../models/business');
const Quote = require('../../models/quote');
const Job = require('../../models/job');
const Invoice = require('../../models/invoice');
const Material = require('../../models/material')
const Service = require('../../models/service');
const HourLog = require('../../models/hourLog')
const Expense = require('../../models/expense')
const Client = require('../../models/client')
const async = require('async');

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
  body('password', 'Password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('sign-up-form', {
        title: 'Sign Up',
        errors: errors.array()
      })
      return;
    }
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) {
        console.log('bcrypt errror')
        return next(err)
      }
      const user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword
      }).save(err => {
        if (err) {
          console.log('user error')
          return next(err);
        }
        res.redirect('/login');
      });
    })
  }
]

////////// Dashboard Pages ///////////
exports.user_detail = (req, res, next) => {
  async.parallel(
    {
      user(callback) {
        User.findOne({ _id: req.params.id }).exec(callback)
      },
      quote_list(callback) {
        Quote.find({ business: req.user.business, 'employees': req.params.id })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      job_list(callback) {
        Job.find({ business: req.user.business, 'employees': req.params.id })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      invoice_list(callback) {
        Invoice.find({ business: req.user.business, 'employees': req.params.id })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      hours_list(callback) {
        HourLog.find({ business: req.user.business, employee: req.params.id }).populate([{ path: 'employee', model: User }]).sort({ createdAt: 'desc' }).exec(callback)

      },
      expense_list(callback) {
        Expense.find({ business: req.user.business, createdBy: req.params.id }).populate([{ path: 'createdBy', model: User }]).sort({ createdAt: 'desc' }).exec(callback)

      },
      async close_ratio() {
        const quoteCount = await Quote.countDocuments({ business: req.user.business, 'employees': req.params.id }).exec()
        const invoiceCount = await Invoice.countDocuments({ business: req.user.business, 'employees': req.params.id, isActive: false }).exec()

        if (quoteCount == 0) return 0
        const ratio = (invoiceCount / quoteCount) * 100;
        return ratio.toFixed(2)
      },
      async monthly_revenue() {
        const thisMonth = new Date().getMonth() + 1;
        const invoices = await Invoice.find({
          'employees': req.params.id, business: req.user.business, isActive: false,
          "$expr": { "$eq": [{ "$month": "$completedOn" }, thisMonth] }
        }).populate([
          { path: 'materials.material', model: Material },
          { path: 'services.service', model: Service },
          { path: 'employees', model: User },

        ]).exec();

        let total = 0;

        for (let invoice of invoices) {
          total += parseFloat(invoice.total);
        }
        return total
      },
      async monthly_profit() {
        const thisMonth = new Date().getMonth() + 1;
        const invoices = await Invoice.find({
          'employees': req.params.id, business: req.user.business, isActive: false,
          "$expr": { "$eq": [{ "$month": "$completedOn" }, thisMonth] }
        }).populate([
          { path: 'materials.material', model: Material },
          { path: 'services.service', model: Service },
          { path: 'employees', model: User }, 'expenses', 'loggedHours'
        ]).exec();

        let total = 0;

        for (let invoice of invoices) {
          total += await invoice.profit;
        }
        return total.toFixed(2)
      }
      // async hours() {
      //   const jobs = await Job.find({ business: req.user.business, 'employees': req.params.id }).populate('loggedHours')
      //   // Job.find({ business: req.user.business, 'employees': req.params.id }).populate('loggedHours').exec((err, jobs) => {
      //   // console.log(jobs)
      //   let total = 0;
      //   for (let job of jobs) {

      //     for (let log of job.loggedHours) {
      //       // console.log(log)
      //       total += log.totalHours;
      //     }

      //   }
      //   console.log(total)
      //   return total;
      //   // })


      // },
      // expenses(callback) {

      // }
    },
    (err, results) => {
      if (err) {
        console.log(err)
        return next(err)
      }
      res.render('dashboard/user-detail', {
        title: `Employee: ${results.user.name}`,
        parent_page: 'Employees',
        layout: './layouts/dashboard',
        user: results.user,
        quote_list: results.quote_list,
        job_list: results.job_list,
        invoice_list: results.invoice_list,
        // hours: results.hours,
        expense_list: results.expense_list,
        hours_list: results.hours_list,
        currentUser: req.user,
        phoneHelper,
        close_ratio: results.close_ratio,
        monthly_revenue: results.monthly_revenue,
        monthly_profit: results.monthly_profit
      })
    }
  )

}

exports.user_list = (req, res, next) => {
  User.find({ business: req.user.business })
    .sort({ lastName: 'desc' })
    .exec(function (err, list_users) {
      if (err) {
        return next(err);
      }
      console.log(err)
      res.render('dashboard/user-list', {
        title: 'Employees',
        parent_page: 'Employees',
        layout: './layouts/dashboard',
        user_list: list_users,
        phoneHelper
      })
    })
}

exports.user_create_get = (req, res) => {
  const user = undefined;
  res.render('dashboard/user-form-new', {
    title: 'New Employee',
    parent_page: 'Employees',
    layout: './layouts/dashboard',
    user
  })
};

exports.user_create_post = [
  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('hourlyRate', 'Hourly rate must be specifed')
    .trim()
    .isNumeric()
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
  async (req, res, next) => {
    const errors = validationResult(req);
    const userData = undefined;
    if (!errors.isEmpty()) {
      res.render('dashboard/user-form-new', {
        title: 'New Employee',
        parent_page: 'Employees',
        layout: './layouts/dashboard',
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
        hourlyRate: req.body.hourlyRate,
        password: hashedPassword,
        business: req.user.business,
        role: req.body.role ? 'ADMIN' : 'EMPLOYEE',
      }).save(err => {
        if (err) {
          console.log('user error')
          return next(err);
        }
        res.redirect('/dashboard/user-list');

      });
    })
  }
]

exports.user_delete_post = async (req, res, next) => {
  async.parallel(
    {
      employee(callback) {
        User.findOneAndDelete({ _id: req.params.id, business: req.user.business }).exec(callback);
      },
      quote(callback) {
        Quote.updateMany({ business: req.user.business }, { $pull: { 'employees': req.params.id } }).exec(callback);
      },
      job(callback) {
        Job.updateMany({ business: req.user.business }, { $pull: { 'employees': req.params.id } }).exec(callback);

      },
      invoice(callback) {
        Invoice.updateMany({ business: req.user.business }, { $pull: { 'employees': req.params.id } }).exec(callback);
      }

    }, (err, results) => {
      if (err) {
        return next(err)
      }
      res.redirect('/dashboard/user-list')
    }
  )

}


exports.employee_update_post = [
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
  body('hourlyRate', 'Hourly rate must be specified')
    .trim()
    .isNumeric()
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      province: req.body.province,
      postal: req.body.postal,
      hst: req.body.hst,
      hourlyRate: req.body.hourlyRate,
      business: req.user.business,
      role: req.body.role ? 'ADMIN' : 'EMPLOYEE',
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
        // const currentUser = res.locals.currentUser;
        res.render('dashboard/user-detail', {
          title: `Employee: ${user.name}`,
          parent_page: 'Employees',
          layout: './layouts/dashboard',
          user,
          currentUser: res.locals.currentUser,
          errors: errors.array()
        });
        return;
      });
      return;
    }
    User.findById(req.params.id).exec((err, result) => {
      if (err) {
        return next()
      }
      if (!result.business.equals(req.user.business)) {
        return next()
      }
      User.findByIdAndUpdate(req.params.id, user, {}, (err, theuser) => {
        if (err) {
          return next(err);
        }
        res.redirect('/dashboard/user-list');
      });
    })

  }
]

exports.user_update_get = (req, res, next) => {
  User.findById(req.user._id).exec(function (err, user) {
    if (err) {
      return next(err)
    }
    if (user == null) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    if (!user._id.equals(req.user._id)) {
      return next()
    }
    // const currentUser = res.locals.currentUser
    res.render('dashboard/user-active-detail', {
      title: 'Account Information',
      layout: './layouts/dashboard',
      parent_page: 'None',
      user,
      currentUser: res.locals.currentUser
    });
  });
}

exports.user_update_post = [
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
  body('hourlyRate', 'Hourly rate must be specified')
    .trim()
    .isNumeric()
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    const user = new User({
      business: req.user.business,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      province: req.body.province,
      postal: req.body.postal,
      hst: req.body.hst,
      hourlyRate: req.body.hourlyRate,
      _id: req.user._id
    })
    if (!errors.isEmpty()) {
      User.findById(req.user._id).exec(function (err, user) {
        if (err) {
          return next(err)
        }
        if (user == null) {
          const err = new Error('User not found');
          err.status = 404;
          return next(err);
        }
        // const currentUser = res.locals.currentUser;
        res.render('dashboard/user-detail', {
          title: 'Update User',
          layout: './layouts/dashboard',
          parent_page: 'None',
          user,
          currentUser: res.locals.currentUser,
          errors: errors.array()
        });
        return;
      });
      return;
    }
    User.findByIdAndUpdate(req.user._id, user, {}, (err, theuser) => {
      if (err) {
        return next(err);
      }
      res.redirect('/dashboard');
    });
  }
]

exports.update_business_get = (req, res, next) => {
  Business.findById(req.user.business).exec((err, business) => {
    if (err) {
      return next(err)
    }
    res.render('dashboard/business-detail', {
      title: 'Business Details',
      parent_page: 'None',
      layout: './layouts/dashboard',
      business
    })
  })
}
exports.update_business_post = [
  body('name', 'Business name required')
    .trim()
    .isLength({ min: 1 }),
  body('email', 'Email is required.')
    .trim()
    .isLength({ min: 1 })
    .isEmail(),
  body('phone', 'Phone is invalid.')
    .trim()
    .isMobilePhone(),
  body('street', 'Street is invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('city', 'Street is invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('province', 'Province is invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('postal', 'Postal code is invalid.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('hst', 'HST number is invalid.')
    .trim()
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      Business.findById(req.user.business).exec((err, business) => {
        if (err) {
          console.log(err)
          return next(err)
        }
        res.render('dashboard/business-detail', {
          title: 'Business Details',
          parent_page: 'None',
          layout: './layouts/dashboard',
          business,
          errors: errors.array()
        })
      })
    }
    Business.findById(req.user.business).exec((err, business) => {
      business.name = req.body.name;
      business.email = req.body.email;
      business.phone = req.body.phone;
      business.street = req.body.street;
      business.city = req.body.city;
      business.province = req.body.province;
      business.postal = req.body.postal;
      business.hst = req.body.hst;
      business.save()
      res.redirect('/dashboard')
    });

  }
]


exports.user_change_password_get = (req, res, next) => {
  res.render('dashboard/change-password', {
    title: 'Change Password',
    parent_page: 'None',
    layout: './layouts/dashboard'
  })
}

exports.user_change_password_post = [
  body('oldPassword', 'Old password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('newPassword', 'Password must include 8 characters, 1 uppercase, 1 lowercase, 1 special character.')
    .trim()
    .isLength({ min: 1 })
    .isStrongPassword()
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
      res.render('dashboard/change-password', {
        title: 'Change Password',
        parent_page: 'None',
        layout: './layouts/dashboard',
        errors: errors.array()
      })
      return;
    } else {
      User.findById(req.user._id).exec(function (err, user) {
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
              res.redirect('/dashboard/update')
            })
          } else {

            const error = [{ msg: 'Old password does not match' }]
            res.render('dashboard/change-password', {
              title: 'Change Password',
              parent_page: 'None',
              layout: './layouts/dashboard',
              errors: error
            })
            return
          }
        })
      });
    }


  }
]
