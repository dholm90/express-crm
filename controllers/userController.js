const User = require('../models/user');
const Business = require('../models/business');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require("express-validator");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require("fs");
const os = require("os");
const phoneHelper = require('../utils/formatPhone')

// Create user get
exports.create_user_get = (req, res) => {
  res.render('sign-up-form', { title: 'Sign Up' })
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
  body('password', 'Password must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('businessName', 'Business Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
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
        role: 'ADMIN',
        password: hashedPassword,
        business: business
      });
      const business = new Business({
        name: req.body.businessName,
        subscription: 'NONE',
        users: [{ user }]
      })
      async.parallel({
        saveUser() {
          user.save()
        },
        saveBusiness() {
          business.save()
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
    if (!user.isAdmin) {
      res.render('dashboard/user-detail', {
        title: 'User Detail',
        layout: './layouts/dashboard',
        user,
        phoneHelper
      })
    } else {
      res.render('admin/user-detail', {
        title: 'User Detail',
        layout: './layouts/admin',
        user,
        phoneHelper
      })
    }

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
        title: 'Admin | Users',
        layout: './layouts/admin',
        user_list: list_users
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
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: 'ADMIN',
        password: hashedPassword,
        business: business
      });
      const business = new Business({
        name: req.body.businessName,
        subscription: 'NONE',
        users: [{ user }]
      })
      async.parallel({
        saveUser() {
          user.save()
        },
        saveBusiness() {
          business.save()
        }
      })
      User.findOne({ email: req.body.email }, function (err, theuser) {
        res.redirect(theuser.url);
      })
      // const user = new User({
      //   businessName: req.body.businessName,
      //   firstName: req.body.firstName,
      //   lastName: req.body.lastName,
      //   email: req.body.email,
      //   phone: req.body.phone,
      //   street: req.body.street,
      //   city: req.body.city,
      //   province: req.body.province,
      //   postal: req.body.postal,
      //   hst: req.body.hst,
      //   password: hashedPassword,
      //   role: 'OWNER',
      //   subscription: 'NONE'
      // }).save(err => {
      //   if (err) {
      //     console.log('user error')
      //     return next(err);
      //   }
      //   User.findOne({ email: req.body.email }, function (err, theuser) {
      //     res.redirect(theuser.url);
      //   })

      // });
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
    if (res.locals.currentUser.role === 'OWNER') {
      res.render('dashboard/user-form', {
        title: 'Update User',
        layout: './layouts/dashboard',
        user
      });
    }
    if (res.locals.currentUser.role === 'ADMIN') {
      res.render('admin/user-form', {
        title: 'Update User',
        layout: './layouts/admin',
        user
      });
    } else {
      res.render('employee/user-form', {
        title: 'Update User',
        layout: './layouts/dashboard',
        user
      });
    }

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
      role: res.locals.currentUser.role,
      subscription: res.locals.currentUser.subscription,
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
        if (res.locals.currentUser.role === 'OWNER') {
          res.render('dashboard/user-form', {
            title: 'Update User',
            layout: './layouts/dashboard',
            user,
            errors: errors.array()
          });
          return;
        }
        if (res.locals.currentUser.role === 'ADMIN') {
          res.render('admin/user-form', {
            title: 'Update User',
            layout: './layouts/admin',
            user,
            errors: errors.array()
          });
          return;
        } else {
          res.render('employee/user-form', {
            title: 'Update User',
            layout: './layouts/admin',
            user,
            errors: errors.array()
          });
        }

      });
      return;
    }
    User.findByIdAndUpdate(req.params.id, user, {}, (err, theuser) => {
      if (err) {
        return next(err);
      }
      if (res.locals.currentUser.role === 'OWNER') {
        res.redirect(theuser.url_dashboard + '/update');
      }
      if (res.locals.currentUser.role === 'ADMIN') {
        res.redirect(theuser.url + '/update')
      } else {
        res.redirect(theuser.url_employee + '/update')
      }


    });
  }
]

exports.user_change_password_get = (req, res, next) => {
  User.findById(req.params.id).exec(function (err, user) {
    if (err) {
      console.log('error in finding user')
      return next(err)
    }
    if (res.locals.currentUser.role === 'OWNER') {
      res.render('dashboard/change-password', {
        title: 'Change Password',
        layout: './layouts/dashboard'
      })
    } if (res.locals.currentUser.role === 'ADMIN') {
      res.render('admin/change-password', {
        title: 'Change Password',
        layout: './layouts/admin'
      })
    } else {
      res.render('employee/change-password', {
        title: 'Change Password',
        layout: './layouts/employee'
      })
    }
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
