const Form = require('../../models/formSubmission');
const OptIn = require('../../models/optIn')
const async = require('async');
const mailer = require('../../utils/sendgrid');
const { body, validationResult } = require("express-validator");
const phoneHelper = require('../../utils/formatPhone');
const ejs = require('ejs');
const path = require('path');

// Form List GET route
exports.form_list = (req, res, next) => {
  async.parallel(
    {
      isRead(callback) {
        Form.find({ isRead: true }).sort({ createdAt: 'desc' }).exec(callback)
      },
      notRead(callback) {
        Form.find({ isRead: false }).sort({ createdAt: 'desc' }).exec(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('admin/form-list', {
        title: 'Admin | Form Submissions',
        layout: './layouts/admin',
        form_list: results,
        phoneHelper
      })
    }
  )
}

// Display detail page for one form
exports.form_detail = (req, res, next) => {
  Form.findById(req.params.id).exec(function (err, form) {
    if (err) {
      return next(err);
    }
    if (form == null) {
      const err = new Error('Form not found');
      err.status = 404;
      return next(err);
    }
    res.render('admin/form-detail', {
      title: 'Form Detail',
      layout: './layouts/admin',
      form: form
    });
  });
}

// Contact form create on post
exports.form_create_post = [
  body('name', 'Name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('email', 'Email is invalid')
    .isEmail()
    .normalizeEmail(),
  body('phone', 'Phone number is invalid.')
    .optional({ checkFalsey: true })
    .isMobilePhone(),
  body('message', 'Message must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('index', {
        title: 'Page',
        errors: errors.array()
      })
      return;
    }
    const emailTemplate = path.join(__dirname, '..', '..', 'views', 'emails', 'form.ejs');
    const formData = new Form({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message
    }).save(err => {
      if (err) {
        console.log(err)
        return next(err);
      }
      ejs.renderFile(emailTemplate, {
        form: req.body,
        phoneHelper
      }, function (err, data) {
        if (err) {
          console.log(err)
          return next(err)
        }
        mailer({
          from: process.env.MAIL_USERNAME,
          to: process.env.MAIL_USERNAME,
          subject: 'New contact form message',
          html: data
        });
        res.redirect('/form-success')
      })

    })
  }
]

// Display form delete post on get
exports.form_delete_get = (req, res, next) => {
  Form.findById(req.params.id).exec(function (err, form) {
    if (err) {
      return next(err);
    }
    if (form == null) {
      const err = new Error('Form not found');
      err.status = 404;
      return next(err);
    }
    res.render('admin/form-delete', {
      title: 'Delete Form',
      layout: './layouts/admin',
      form: form
    });
  })
}

// Handle form delete on post
exports.form_delete_post = (req, res, next) => {
  // Todo -- implement alert check
  Form.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/admin/form-list');
  })
};

// Toggle form isRead
exports.form_toggle_read = (req, res, next) => {
  Form.findByIdAndUpdate(req.params.id, { isRead: true }, function (err, form) {
    if (err) {
      return next(err);
    }
    async.parallel(
      {
        isRead(callback) {
          Form.find({ isRead: true }).sort({ createdAt: 'desc' }).exec(callback)
        },
        notRead(callback) {
          Form.find({ isRead: false }).sort({ createdAt: 'desc' }).exec(callback)
        },
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        res.render('admin/form-list', {
          title: 'Admin| Form Submissions',
          layout: './layouts/admin',
          form_list: results,
          phoneHelper
        })
      }
    )
  })
}

// OptIn form create on post
exports.optin_create_post = [
  body('email', 'Email is invalid')
    .isEmail()
    .normalizeEmail(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('index', {
        title: 'Page',
        errors: errors.array()
      })
      return;
    }
    const emailTemplate = path.join(__dirname, '..', 'views', 'emails', 'optIn.ejs');
    const email = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'emails', 'optIn.ejs'), {
      optIn: req.body,
      phoneHelper
    })
    const optInData = new OptIn({
      email: req.body.email,
    }).save(err => {
      if (err) {
        // res.redirect('/');
        return next(err);
      }

      mailer({
        from: process.env.MAIL_USERNAME,
        to: process.env.MAIL_USERNAME,
        subject: 'New contact form message',
        html: email
      });
      res.redirect('/form-success')
    })


  }
]
