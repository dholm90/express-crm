const Client = require('../models/client');
const Invoice = require('../models/invoice');
const Service = require('../models/service');
const phoneHelper = require('../utils/formatPhone')
const { body, validationResult } = require("express-validator");
const async = require('async');

// Display list of clients
exports.client_list = (req, res, next) => {
  Client.find()
    .sort({ lastName: 'desc' })
    .exec(function (err, list_clients) {
      if (err) {
        return next(err);
      }
      res.render('dashboard/client-list', {
        title: 'Dashboard | Clients',
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
      client_invoices_paid(callback) {
        Invoice.find({ client: req.params.id, isPaid: true }).populate('client services').exec(callback);
      },
      client_invoices_unpaid(callback) {
        Invoice.find({ client: req.params.id, isPaid: false }).populate('client services').exec(callback);
      }
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
      res.render('dashboard/client-detail', {
        title: 'Client Detail',
        layout: './layouts/dashboard',
        client: results.client,
        client_invoices_paid: results.client_invoices_paid,
        client_invoices_unpaid: results.client_invoices_unpaid,
        phoneHelper
      })
    }
  )
}

// Create Client GET
exports.create_client_get = (req, res, next) => {
  const client = undefined;
  res.render('dashboard/create-client', {
    title: 'Create Client',
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
    .withMessage('Email must be specified.')
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
        Client.findOne({ email: req.body.email }, function (err, user) {
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
      const client = undefined;
      res.render('dashboard/create-client', {
        title: 'Create Client',
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
    }).save(err => {
      if (err) {
        res.redirect('/dashboard');
        return next(err);
      }
      res.redirect('/dashboard/client-list')
    })
  }
]

// Delete client Get
exports.client_delete_get = (req, res, next) => {
  Client.findById(req.params.id).exec(function (err, client) {
    if (err) {
      return next(err);
    }
    if (client == null) {
      const err = new Error('Client not found');
      err.status = 404;
      return next(err);
    }
    res.render('dashboard/client-delete', {
      title: 'Delete Client',
      layout: './layouts/dashboard',
      client: client
    });
  })
}

// Delete Client POST
exports.client_delete_post = (req, res, next) => {
  Invoice.find({ client: req.params.id }).exec(function (err, invoices) {
    if (err) {
      return next(err);
    }
    invoices.forEach(invoice => {
      Service.deleteMany({ invoice: invoice._id }, (err) => {
        if (err) {
          return next(err)
        }
        Invoice.deleteMany({ client: req.params.id }, (err) => {
          if (err) {
            return next(err)
          }
        })
      })
    })
    Client.findByIdAndRemove(req.params.id, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/dashboard/client-list');
    })
  });
};

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
    res.render('dashboard/create-client', {
      title: 'Update Client',
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
    .isAlpha()
    .escape(),
  body('lastName', 'Last name must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isAlpha()
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

    const client = new Client({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      province: req.body.province,
      postal: req.body.postal,
      _id: req.params.id
    })
    if (!errors.isEmpty()) {
      Client.findById(req.params.id).exec(function (err, client) {
        if (err) {
          return next(err)
        }
        if (client == null) {
          const err = new Error('Client not found');
          err.status = 404;
          return next(err);
        }
        res.render('dashboard/create-client', {
          title: 'Update Client',
          layout: './layouts/dashboard',
          client: client,
          errors: errors.array()
        });
        return;
      });
      return;
    }
    Client.findByIdAndUpdate(req.params.id, client, {}, (err, theclient) => {
      if (err) {
        return next(err);
      }
      res.redirect(theclient.url);
    });
  }
]




