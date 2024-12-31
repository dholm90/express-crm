const Client = require('../../models/client');
const Invoice = require('../../models/invoice');
const Job = require('../../models/job')
const Service = require('../../models/service');
const Material = require('../../models/material')
const User = require('../../models/user')
const Quote = require('../../models/quote');
const phoneHelper = require('../../utils/formatPhone')
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');
const async = require('async');

// Display list of clients
exports.client_list = (req, res, next) => {
  Client.find({ business: req.user.business })
    .sort({ lastName: 'desc' })
    .exec(function (err, list_clients) {
      if (err) {
        return next(err);
      }
      // if (req.user._id.toString() !== req.params.id) {
      //   res.redirect('/dashboard')
      // }
      res.render('dashboard/client-list', {
        title: 'Clients',
        parent_page: 'Clients',
        layout: './layouts/dashboard',
        client_list: list_clients,
        phoneHelper
      })
    })
};
// Display one client
exports.client_detail = (req, res, next) => {
  async.parallel(
    {
      client(callback) {
        Client.findById(req.params.id).exec(callback);
      },
      quote_list(callback) {
        Quote.find({ business: req.user.business, client: req.params.id })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      job_list(callback) {
        Job.find({ business: req.user.business, client: req.params.id })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      invoice_list(callback) {
        Invoice.find({ business: req.user.business, client: req.params.id })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.client == null) {
        const err = new Error("Invoice not found");
        err.status = 404;
        return next(err);
      }
      if (!results.client.business.equals(req.user.business)) {
        return next()
      }
      res.render('dashboard/client-detail', {
        title: `Client: ${results.client.name}`,
        parent_page: 'Clients',
        layout: './layouts/dashboard',
        client: results.client,
        client_invoices_paid: results.client_invoices_paid,
        client_invoices_unpaid: results.client_invoices_unpaid,
        quote_list: results.quote_list,
        job_list: results.job_list,
        invoice_list: results.invoice_list,
        phoneHelper
      })


    }
  )
}

// Create Client GET
exports.create_client_get = (req, res, next) => {
  const client = undefined;
  res.render('dashboard/client-form-new', {
    title: 'New Client',
    parent_page: 'Clients',
    layout: './layouts/dashboard',
    client
  })
};

// Create Client POST
exports.create_client_post = [
  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isAlpha()
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isAlpha()
    .escape(),
  body('email')
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .escape()
    .withMessage('Email must be specified.'),
  // .custom((value, { req }) => {
  //   return new Promise((resolve, reject) => {
  //     Client.findOne({ email: req.body.email }, function (err, user) {
  //       if (err) {
  //         reject(new Error('Server Error'))
  //       }
  //       if (Boolean(user)) {
  //         reject(new Error('E-mail already in use'))
  //       }
  //       resolve(true)
  //     });
  //   });
  // }),
  body('phone', 'Phone number must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isMobilePhone()
    .escape(),
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
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const client = req.body;
      res.render('dashboard/client-form-new', {
        title: 'New Client',
        parent_page: 'Clients',
        layout: './layouts/dashboard',
        client,
        errors: errors.array()
      })
      return
    }
    const clientData = new Client({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      province: req.body.province,
      postal: req.body.postal,
      business: req.user.business,
      createdBy: req.user._id
    }).save(err => {
      if (err) {
        // res.redirect('/dash
        console.log(err);
        return next(err);
      }
      res.redirect(`/dashboard/client-list`)
    })
  }
]



// Delete Client POST
exports.client_delete_post = (req, res, next) => {
  async.parallel(
    {
      client(callback) {
        const quote = Quote.find({ client: req.params.id, business: req.user.business })
        if (!quote) {
          Client.findOneAndRemove({ _id: req.params.id, business: req.user.business }).exec(callback)
        } else {
          res.redirect('/dashboard/client-list')
        }

      },
      // quotes(callback) {
      //   Quote.updateMany({ client: req.params.id }, { $unset: { client: 1 } }).exec(callback)
      // }
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      console.log(results)
      res.redirect('/dashboard/client-list')
    }
  )
}

// Update client get
exports.client_update_get = (req, res, next) => {
  Client.findById(req.params.id).exec(function (err, client) {
    if (err) {
      return next(err)
    }
    if (client == null) {
      const err = new Error('Client not found');
      err.status = 404;
      return next(err);
    }
    if (!client.business.equals(req.user.business)) {
      return next()
    }
    res.render('dashboard/client-detail', {
      title: `Client: ${client.name}`,
      parent_page: 'Clients',
      layout: './layouts/dashboard',
      client: client
    });
  });
}

// Update client POST
exports.client_update_post = [
  body('firstName', 'First name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name must be specified.')
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
  body('phone', 'Phone number must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isMobilePhone()
    .escape(),
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
  (req, res, next) => {
    const errors = validationResult(req);
    Client.findById(req.params.id).exec(function (err, result) {
      if (err) {
        return next()
      }
      if (!result.business.equals(req.user.business)) {
        return next()
      }
    });

    const client = new Client({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      province: req.body.province,
      postal: req.body.postal,
      business: req.user.business,
      createdBy: req.user._id,
      _id: req.params.id
    })
    if (!errors.isEmpty()) {
      console.log(errors)
      Client.findById(req.params.id).exec(function (err, client) {
        if (err) {
          return next(err)
        }
        if (!client.business.equals(req.user.business)) {
          return next()
        }
        if (client == null) {
          const err = new Error('Client not found');
          err.status = 404;
          return next(err);
        }

        return res.render('dashboard/client-detail', {
          title: `Client: ${client.name}`,
          parent_page: 'Clients',
          layout: './layouts/dashboard',
          client,
          errors: errors.array()
        });
      });
      return;
    }
    Client.findByIdAndUpdate(req.params.id, client, {}, (err, theclient) => {
      if (err) {
        return next(err);
      }
      // res.redirect('/')
      res.redirect(theclient.url);
    });
  }
]




