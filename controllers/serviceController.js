const Service = require('../models/service');
const Invoice = require('../models/invoice');
const { body, validationResult } = require("express-validator");
const async = require('async');

// Display list of services
exports.service_list = (req, res, next) => {
  res.send('not yet implemented: service list');
}

// Display one service
exports.service_detail = (req, res, next) => {
  res.send('not yet implemented: service detail');
}

// Create service get
exports.service_create_get = (req, res, next) => {
}

// Create service post
exports.service_create_post = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Title is required.')
    .isAlphanumeric()
    .escape()
    .withMessage('Title is invalid.'),
  body('desc', 'Description is required.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('price', 'Price is required.')
    .trim()
    .isNumeric()
    .isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);

    const serviceData = new Service({
      title: req.body.title,
      description: req.body.desc,
      price: req.body.price,
      invoice: req.body.invoiceId
    })

    async.parallel(
      {
        invoice(callback) {
          Invoice.findById(req.params.id).populate('client services').exec(callback)
        },
        invoice_services(callback) {
          Service.find({ invoice: req.params.id }).exec(callback)
        },
      },
      (err, results) => {
        if (err) {
          return next(err);
        }
        if (results.invoice == null) {
          const err = new Error("Invoice not found");
          err.status = 404;
          return next(err);
        }
        if (!errors.isEmpty()) {
          res.render('dashboard/invoice-detail', {
            title: `Dashboard | Invoice`,
            layout: './layouts/dashboard',
            invoice: results.invoice,
            invoice_services: results.invoice_services,
            errors: errors.array(),
          })
        } else {
          serviceData.save(err => {
            if (err) {
              res.redirect('/dashboard')
              return next(err)
            }
            res.redirect(`/dashboard/invoice/${req.body.invoiceId}`)
          })
        }

      })
  }
]

// Delete service get
exports.service_delete_get = (req, res, next) => {
}

// Delete service post
exports.service_delete_post = (req, res, next) => {
  Service.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect(req.body.invoiceurl);
  })
}

// Delete invoices services
exports.invoice_delete_services = (req, res, next) => {
  Service.deleteMany({ invoice: req.params.id }, (err) => {
    if (err) {
      return next(err)
    }
    return next();
  })
}

// Update service get
exports.service_update_get = (req, res, next) => {
  res.send('not yet implemented: service update get');
}

// Update service post
exports.service_update_post = (req, res, next) => {
  res.send('not yet implemented: service update post');
}