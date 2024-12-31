const Invoice = require('../models/invoice');
const Client = require('../models/client');
const Service = require('../models/service');
const { getBrowserInstance } = require('../utils/instance')
const mailer = require('../utils/sendMail');
const ejs = require('ejs');
const path = require('path');
const async = require('async');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const stripe = require('stripe')(process.env.STRIPE_TEST_SK);
const { body, validationResult } = require("express-validator");
const fs = require('fs');
const User = require('../models/user');
const { writeFile } = require('fs');
const phoneHelper = require('../utils/formatPhone')

exports.pay_invoice_local = async (req, res, next) => {
  Invoice.findById(req.params.id).populate('client services').exec(async function (err, invoice) {
    if (err) {
      return next(err)
    }
    if (invoice == null) {
      const err = new Error("Invoice not found");
      err.status = 404;
      return next(err);
    }
    const price = await stripe.prices.create({
      currency: 'cad',
      unit_amount: invoice.total * 100,
      product: 'prod_MrnxVAC07hQAcz',
    });
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
    });
    const formattedLink = paymentLink.url + '?prefilled_email=' + invoice.client.email;
    invoice.paymentLink = formattedLink;
    invoice.save(err => {
      if (err) {
        return next(err)
      }
      res.redirect(invoice.paymentLink)
    })
  })
}

exports.pay_invoice = async (req, res, next) => {
  Invoice.findById(req.params.id).populate('client services').exec(async function (err, invoice) {
    if (err) {
      return next(err)
    }
    if (invoice == null) {
      const err = new Error("Invoice not found");
      err.status = 404;
      return next(err);
    }
    const price = await stripe.prices.create({
      currency: 'cad',
      unit_amount: invoice.total * 100,
      product: 'prod_MrnxVAC07hQAcz',
    });
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
    });
    const formattedLink = paymentLink.url + '?prefilled_email=' + invoice.client.email;
    invoice.paymentLink = formattedLink;
    invoice.save(err => {
      if (err) {
        return next(err)
      }
      return next()
    })
  })
}


// Display list of invoices
exports.invoice_list = async (req, res, next) => {
  async.parallel(
    {
      invoice_paid(callback) {
        Invoice.find({ isPaid: true })
          .sort({ createdAt: 'desc' })
          .populate('client services')
          .exec(callback);
      },
      invoice_not_paid(callback) {
        Invoice.find({ isPaid: false })
          .sort({ createdAt: 'desc' })
          .populate('client services')
          .exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('dashboard/invoice-list', {
        title: 'Dashboard | Invoices',
        layout: './layouts/dashboard',
        invoice_paid: results.invoice_paid,
        invoice_not_paid: results.invoice_not_paid,
        phoneHelper
      })
    }
  )
}

// Display one invoice
exports.invoice_detail = (req, res, next) => {
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
      res.render('dashboard/invoice-detail', {
        title: `Dashboard | Invoice: `,
        layout: './layouts/dashboard',
        invoice: results.invoice,
        invoice_services: results.invoice_services,
        phoneHelper
      })
    }
  )
}

// Create invoice get
exports.invoice_create_get = (req, res, next) => {
  const invoice = undefined;
  Client.findById(req.params.id).exec(function (err, client) {
    if (err) {
      return next(err);
    }
    res.render('dashboard/invoice-form', {
      title: 'Create Invoice',
      layout: './layouts/dashboard',
      client,
      invoice,
    })
  })
}

// Create invoice post
exports.invoice_create_post = [
  body('title', 'Title must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isAlphanumeric()
    .escape(),
  body('supplyDate', 'Supply date must be specified.')
    .isISO8601()
    .toDate(),
  body('due', 'Due date must be specified.')
    .isISO8601()
    .toDate(),
  body('tax', 'Tax must be specified.')
    .trim()
    .isNumeric(),
  (req, res, next) => {
    const invoice = undefined;

    Client.findById(req.body.client)
      .exec(function (err, client) {
        if (err) {
          return next(err);
        }
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          res.render('dashboard/invoice-form', {
            title: 'Create Invoice',
            layout: './layouts/dashboard',
            errors: errors.array(),
            client,
            invoice
          })
          return;
        }
        const invoiceData = new Invoice({
          title: req.body.title,
          supplyDate: req.body.supplyDate,
          due: req.body.due,
          client: req.body.client,
          tax: req.body.tax,
        }).save(err => {
          if (err) {
            res.redirect('/dashboard');
            return next(err);
          }
          res.redirect(client.url);
        })
      })
  }
]


// Delete invoice get
exports.invoice_delete_get = (req, res, next) => {
  Invoice.findById(req.params.id).exec(function (err, invoice) {
    if (err) {
      return next(err);
    }
    if (invoice == null) {
      const err = new Error('Invoice not found');
      err.status = 404;
      return next(err);
    }
    res.render('dashboard/invoice-delete', {
      title: 'Delete Invoice',
      layout: './layouts/dashboard',
      invoice
    });
  })
}

// Delete invoice post
exports.invoice_delete_post = (req, res, next) => {
  Invoice.findByIdAndRemove(req.body.invoiceid, (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/dashboard/invoice-list');
  })
}

// Delete client invoices
exports.client_delete_invoices = (req, res, next) => {
  Invoice.find({ client: req.params.id }).exec(function (err, invoices) {
    if (err) {
      return next(err);
    }
    invoices.forEach(invoice => {
      Service.deleteMany({ invoice: invoice.id }, (err) => {
        if (err) {
          return next(err)
        }
        Invoice.deleteMany({ client: req.params.id }, (err) => {
          if (err) {
            return next(err)
          }
          return next();
        })
      })
    })
  });

}

// Update invoice get
exports.invoice_update_get = (req, res, next) => {
  const errors = undefined;
  const client = undefined;

  async.parallel(
    {
      invoice(callback) {
        Invoice.findById(req.params.id).populate('client').exec(callback)
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      if (results.invoice == null) {
        const err = new Error("Invoice not found");
        err.status = 404;
        return next(err);
      }
      res.render('dashboard/invoice-form', {
        title: 'Update Invoice',
        layout: './layouts/dashboard',
        invoice: results.invoice,
        client,
        errors
      });
    }
  )
}

// Update invoice post
exports.invoice_update_post = [
  body('title', 'Title must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isAlphanumeric()
    .escape(),
  body('supplyDate', 'Supply date must be specified.')
    .trim(),
  body('due', 'Due date must be specified.')
    .toDate(),
  body('tax', 'Tax must be specified.')
    .trim()
    .isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);

    const invoiceData = new Invoice({
      title: req.body.title,
      supplyDate: req.body.supplyDate,
      due: req.body.due,
      tax: req.body.tax,
      client: req.body.client,
      _id: req.params.id
    })
    async.parallel(
      {
        invoice(callback) {
          Invoice.findById(req.params.id).populate('client').exec(callback)
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
          Invoice.findByIdAndUpdate(req.params.id, invoiceData, {}, (err, theinvoice) => {
            if (err) {
              return next(err);
            }
            res.redirect(theinvoice.url);
          });
        }

      })
  }
]



exports.invoice_toggle_paid = (req, res, next) => {
  Invoice.findOne({ _id: req.params.id }, function (err, invoice) {
    if (err) {
      return next(err);
    }
    invoice.isPaid = !invoice.isPaid;
    invoice.save(err => {
      if (err) {
        return next(err)
      }
      res.redirect(invoice.url);
    })

  })
}

exports.email_invoice = (req, res, next) => {
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
      const emailTemplate = path.join(__dirname, '..', 'views', 'emails', 'invoice2.ejs');
      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', 'views', 'pdf', 'invoice-pdf.ejs'), {
          title: `Dashboard | Invoice`,
          invoice: results.invoice,
          invoice_services: results.invoice_services,
          currentUser: res.locals.currentUser,
          public,
          phoneHelper
        })

        // await page.setRequestInterception(true)
        // page.on('request', request => {
        //   if (request.resourceType() === 'script')
        //     request.abort();
        //   else
        //     request.continue();
        // })
        await page.setContent(html);

        await page.emulateMediaType('print');

        const pdf = await page.pdf({
          printBackground: true,
          width: 1275,
          height: 1650,
          margin: { top: 0, bottom: 0, right: 0, left: 0 },
        })
        res.contentType('application/pdf');

        res.setHeader(
          "Content-Disposition",
          `attachment; filename=invoice-${results.invoice.title}-${Date.now()}.pdf`
        );

        ejs.renderFile(emailTemplate, {
          invoice: results.invoice,
          invoice_services: results.invoice_services,
        }, function (err, data) {
          if (err) {
            return next(err)
          }
          mailer({
            from: process.env.MAIL_USERNAME,
            to: results.invoice.client.email,
            subject: 'Invoice',
            html: data,
            attachments: [{
              filename: `invoice.pdf`,
              content: pdf
            }],
          });
        })
        res.redirect('/dashboard/email-success')
      })()
    }
  )
}

exports.download = (req, res, next) => {
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
      // const emailTemplate = path.join(__dirname, '..', 'views', 'emails', 'invoice.ejs');
      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', 'views', 'pdf', 'invoice-pdf.ejs'), {
          title: `Dashboard | Invoice`,
          invoice: results.invoice,
          invoice_services: results.invoice_services,
          currentUser: res.locals.currentUser,
          public,
          phoneHelper
        })

        // await page.setRequestInterception(true)
        // page.on('request', request => {
        //   if (request.resourceType() === 'script')
        //     request.abort();
        //   else
        //     request.continue();
        // })
        await page.setContent(html);

        await page.emulateMediaType('print');

        const pdf = await page.pdf({
          printBackground: true,
          width: 1275,
          height: 1650,
          margin: { top: 0, bottom: 0, right: 0, left: 0 },
        })
        res.contentType('application/pdf');

        res.setHeader(
          "Content-Disposition",
          `attachment; filename=invoice-${results.invoice.title}-${Date.now()}.pdf`
        );

        res.send(pdf);
      })()
    }
  )
}

