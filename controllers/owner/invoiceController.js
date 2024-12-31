const { body, validationResult } = require("express-validator");
const { getBrowserInstance } = require('../../utils/instance');
const ejs = require('ejs');
const path = require('path');
const async = require('async');
const User = require('../../models/user');
const Client = require('../../models/client')
const Material = require('../../models/material')
const Service = require('../../models/service');
const Business = require('../../models/business');
const Invoice = require('../../models/invoice');
const Expense = require('../../models/expense')
const Image = require('../../models/image');
const HourLog = require('../../models/hourLog')
const phoneHelper = require('../../utils/formatPhone');
const sendMail = require('../../utils/sendgrid');
const { DateTime } = require('luxon');
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../../utils/s3');
const { default: mongoose } = require("mongoose");
const invoice = require("../../models/invoice");


// Get Invoice List
exports.invoice_list = (req, res, next) => {
  async.parallel(
    {
      invoice_list(callback) {
        Invoice.find({ business: req.user.business })
          .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy', 'expenses', 'loggedHours'])
          .sort({ createdAt: 'desc' })
          .exec(callback)
      },
      // async totals() {
      //   const invoices = await Invoice.find({ business: req.user.business })
      //     .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy', 'expenses', 'loggedHours'])
      //     .sort({ createdAt: 'desc' });
      //   invoices.forEach(async invoice => {
      //     invoice.totalHours = 0;
      //     for (let log of invoice.loggedHours) {
      //       const employee = await User.findById(log.employee).exec()
      //       const rate = parseFloat(employee.hourlyRate);
      //       const totalHours = parseFloat(log.totalHours)
      //       let calc = rate * totalHours
      //       invoice.totalHours += parseFloat(calc)
      //       // console.log(calc)
      //     }
      //     console.log(invoice.totalHours)
      //   })

      //   return

      // }
    },
    async (err, results) => {
      if (err) {
        return next(err);
      }

      for (let invoice of results.invoice_list) {
        invoice.asyncProfit = await invoice.profit
        invoice.asyncHours = await invoice.totalLoggedHours
        // if (invoice.asyncProfit < 0) {
        //   invoice.asyncProfit *= -1
        //   invoice.asyncProfit = `-$${invoice.asyncProfit}`
        // }
        // else {
        //   invoice.asyncProfit = `$${invoice.asyncProfit}`
        // }
      }


      res.render('dashboard/invoice-list', {
        title: 'Invoices',
        parent_page: 'Invoices',
        layout: './layouts/dashboard',
        invoice_list: results.invoice_list,
        phoneHelper
      })
    }
  )

};
//Get Invoice Detail
exports.invoice_detail = (req, res, next) => {
  async.parallel(
    {
      clients(callback) {
        Client.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      materials(callback) {
        Material.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      services(callback) {
        Service.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      employees(callback) {
        User.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      business(callback) {
        Business.findById(req.user.business).exec(callback)
      },
      invoice(callback) {
        Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'expenses', model: Expense, populate: [{ path: 'createdBy', ref: 'User' }] }, { path: 'loggedHours', model: HourLog, populate: [{ path: 'employee', ref: 'User' }] }, { path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }, 'images']).exec(callback);
      }
    },
    async (err, results) => {
      if (err) {
        console.log(err)
        return next(err);
      }

      for (let image of results.invoice.images) {
        image.imageUrl = await getObjectSignedUrl(image.imageName);
      }
      for (let expense of results.invoice.expenses) {
        if (expense.imageName) {
          expense.imageUrl = await getObjectSignedUrl(expense.imageName);
        }

      }
      // await results.invoice.images.forEach(async image => {
      //   image.imageUrl = await getObjectSignedUrl(image.imageName);
      // })

      // await results.invoice.save()
      // console.log(results.invoice.images)
      await res.render('dashboard/invoice-detail', {
        title: `Invoice: ${results.invoice.title}`,
        parent_page: 'Invoices',
        layout: './layouts/dashboard',
        invoice: results.invoice,
        clients: results.clients,
        employees: results.employees,
        materials: results.materials,
        services: results.services,
        business: results.business,
        phoneHelper,
      })
    }
  )
}

// Add material to list
exports.add_material = [
  body('materialQty')
    .trim()
    .isNumeric()
    .escape(),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const clients = await Client.find({ business: req.user.business }).sort('desc');
      const materials = await Material.find({ business: req.user.business }).sort('desc');
      const employees = await User.find({ business: req.user.business }).sort('desc');
      const services = await Service.find({ business: req.user.business }).sort('desc');
      const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material });

      await res.render('dashboard/invoice-detail', {
        title: `Invoice: ${invoice.title}`,
        parent_page: 'Invoices',
        layout: './layouts/dashboard',
        invoice,
        clients,
        employees,
        materials,
        services,
        errors
      })
      return
    }
    const material = await Material.findById(req.body.material);
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
    const update = { name: material.name, qty: req.body.materialQty, price: material.price, supplier: material.supplier };
    invoice.materials.push(update);
    await invoice.save();
    await res.redirect(invoice.url);
  }
]

// Remove Material from list
exports.remove_material = async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
  await Invoice.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'materials': { _id: req.params.materialId }
    }
  });
  await res.redirect(invoice.url);


}

// Create Invoice Get
exports.create_invoice_get = (req, res, next) => {
  Client.find({ business: req.user.business })
    .sort({ lastName: 'desc' })
    .exec(function (err, clients) {
      if (err) {
        return next(err)
      }
      const invoice = undefined;

      res.render('dashboard/invoice-form', {
        title: 'New Invoice',
        parent_page: 'Invoices',
        layout: './layouts/dashboard',
        clients,
        invoice
      })
    })
}

// Create Invoice Post
exports.create_invoice_post = [
  body('title', 'Title must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('jobStart', 'Invoice start date must be specified.')
    .isISO8601()
    .toDate(),
  body('jobEnd', 'Compelted by date must be specified.')
    .isISO8601()
    .toDate(),
  body('tax', 'Tax is required')
    .trim()
    .isNumeric(),
  body('markup', 'Markup is required')
    .trim()
    .isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('dashboard/invoice-form', {
        title: 'New Invoice',
        parent_page: 'Invoices',
        layout: './layouts/dashboard',
        errors: errors.array()
      })
      return
    }
    const invoiceData = new Invoice({
      title: req.body.title,
      client: req.body.client,
      jobStart: req.body.jobStart,
      jobEnd: req.body.jobEnd,
      tax: req.body.tax,
      markup: req.body.markup,
      business: req.user.business,
      createdBy: req.user._id
    }).save(err => {
      if (err) {
        console.log(err)
        res.redirect('/dashboard')
        return next(err)
      }
      res.redirect(`/dashboard/invoice-list`);
    })
  }
]

// Update Invoice
exports.update_invoice = [
  body('title', 'Title must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('jobStart', 'Invoice start date must be specified.')
    .isISO8601()
    .toDate(),
  body('jobEnd', 'Compelted by date must be specified.')
    .isISO8601()
    .toDate(),
  body('tax', 'Tax is required')
    .trim()
    .isNumeric(),
  body('markup', 'Markup is required')
    .trim()
    .isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      async.parallel(
        {
          clients(callback) {
            Client.find({ business: req.user.business }).sort('desc').exec(callback);
          },
          employees(callback) {
            User.find({ business: req.user.business }).sort('desc').exec(callback)
          },
          materials(callback) {
            Material.find({ business: req.user.business }).sort('desc').exec(callback);
          },
          services(callback) {
            Service.find({ business: req.user.business }).sort('desc').exec(callback)
          },
          invoice(callback) {
            Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('dashboard/invoice-detail', {
            title: `Invoice: ${results.invoice.title}`,
            parent_page: 'Invoices',
            layout: './layouts/dashboard',
            invoice: results.invoice,
            clients: results.clients,
            employees: results.employees,
            materials: results.materials,
            services: results.services,
            errors: errors.array()
          })
        }
      )
    }
    Invoice.findOne({ _id: req.params.id, business: req.user.business }).exec(function (err, invoice) {
      invoice.title = req.body.title;
      invoice.client = req.body.client;
      invoice.jobStart = req.body.jobStart;
      invoice.jobEnd = req.body.jobEnd;
      invoice.tax = req.body.tax;
      invoice.markup = req.body.markup;

      invoice.save(err => {
        if (err) {
          console.log(err)
          return next(err)
        }

        res.redirect(invoice.url)
      })
    })
  }
]


// Delete Invoice
exports.invoice_delete = async (req, res, next) => {
  const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, business: req.user.business })
  invoice
  const images = await Image.find({ business: req.user.business, invoice: req.params.id });
  images.forEach(image => {
    image.invoice = null;
    image.save()
  });
  res.redirect(`/dashboard/invoice-list`);
}

// Create New Material 
exports.new_material = [
  body('name', 'Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
  body('price', 'Price must be specifed.')
    .trim()
    .isLength({ min: 1 })
    .isNumeric(),
  body('supplier', 'Supplier is invalid')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  async (req, res, next) => {
    const errors = validationResult(req);
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          clients(callback) {
            Client.find({ business: req.user.business }).sort('desc').exec(callback);
          },
          materials(callback) {
            Material.find({ business: req.user.business }).sort('desc').exec(callback);
          },
          employees(callback) {
            User.find({ business: req.user.business }).sort('desc').exec(callback)
          },
          services(callback) {
            Service.find({ business: req.user.business }).sort('desc').exec(callback)
          },
          invoice(callback) {
            Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('dashboard/invoice-detail', {
            title: `Invoice: ${results.invoice.title}`,
            parent_page: 'Invoices',
            layout: './layouts/dashboard',
            invoice: results.invoice,
            clients: results.clients,
            employees: results.employees,
            materials: results.materials,
            services: results.services,
            errors: errors.array()
          })
        }
      )
    }
    const materialData = new Material({
      name: req.body.name,
      price: req.body.price,
      supplier: req.body.supplier,
      business: req.user.business,
      createdBy: req.user._id
    }).save(err => {
      if (err) {
        console.log(err)
        res.redirect('/dashboard')
        return next(err)
      }
      res.redirect(invoice.url);
    })
  }
]





// Add service to list
exports.add_service = async (req, res, next) => {
  const service = await Service.findById(req.body.service)
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
  const update = { title: service.title, description: service.description, price: service.price };
  invoice.services.push(update);
  await invoice.save();
  await res.redirect(invoice.url);
}


// Remove service from list
exports.remove_service = async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
  await Invoice.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'services': { _id: req.params.serviceId }
    }
  });
  await res.redirect(invoice.url);


}

// Create New Service 
exports.new_service = [
  body('title', 'Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Price must be specifed.')
    .trim()
    .isLength({ min: 1 }),
  body('price', 'Supplier is invalid')
    .trim()
    .isLength({ min: 1 })
    .isNumeric(),
  async (req, res, next) => {
    const errors = validationResult(req);
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });

    if (!errors.isEmpty()) {

      async.parallel(
        {
          clients(callback) {
            Client.find({ business: req.user.business }).sort('desc').exec(callback);
          },
          materials(callback) {
            Material.find({ business: req.user.business }).sort('desc').exec(callback);
          },
          employees(callback) {
            User.find({ business: req.user.business }).sort('desc').exec(callback)
          },
          services(callback) {
            Service.find({ business: req.user.business }).sort('desc').exec(callback)
          },
          invoice(callback) {
            Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('dashboard/invoice-detail', {
            title: `Invoice: ${results.invoice.title}`,
            parent_page: 'Invoices',
            layout: './layouts/dashboard',
            invoice: results.invoice,
            employees: results.employees,
            clients: results.clients,
            materials: results.materials,
            services: results.services,
            errors: errors.array()
          })
        }
      )
    }
    const serviceData = new Service({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      business: req.user.business,
      createdBy: req.user._id
    }).save(err => {
      if (err) {
        console.log(err)
        res.redirect('/dashboard')
        return next(err)
      }
      res.redirect(invoice.url);
    })
  }
]

// Add Employee to list
exports.add_employee = async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
  const employee = await Invoice.find({ "employees": req.body.employee });
  if (!invoice.employees.includes(req.body.employee)) {
    console.log(invoice.employees, req.body.employee)
    const update = req.body.employee;
    invoice.employees.push(update);
    await invoice.save();
    await res.redirect(invoice.url);
  } else {

    await res.redirect(invoice.url)
  }
}

// Remove Employee from list
exports.remove_employee = async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
  await Invoice.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'employees': req.params.employeeId
    }
  });
  await res.redirect(invoice.url);
}


// Download PDF
exports.download = (req, res, next) => {
  async.parallel(
    {
      clients(callback) {
        Client.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      materials(callback) {
        Material.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      services(callback) {
        Service.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      employees(callback) {
        User.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      business(callback) {
        Business.findById(req.user.business).exec(callback)
      },
      invoice(callback) {
        Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
      }
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
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'invoice-render.ejs'), {
          title: `Invoice: ${results.invoice.title}`,
          parent_page: 'Invoices',
          layout: './layouts/dashboard',
          invoice: results.invoice,
          clients: results.clients,
          employees: results.employees,
          materials: results.materials,
          services: results.services,
          business: results.business,
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

        // return next()
        // ejs.renderFile(emailTemplate, {
        //   invoice: results.invoice,
        //   invoice_services: results.invoice_services,
        // }, function (err, data) {
        //   if (err) {
        //     return next(err)
        //   }
        //   mailer({
        //     from: process.env.MAIL_USERNAME,
        //     to: results.invoice.client.email,
        //     subject: 'Invoice',
        //     html: data,
        //     attachments: [{
        //       filename: `invoice.pdf`,
        //       content: pdf
        //     }],
        //   });
        // })
        // res.redirect('/dashboard/email-success')
      })()
    }
  )
}

exports.upload_images = (req, res, next) => {

}

exports.send_email_payment = (req, res, next) => {
  async.parallel(
    {
      clients(callback) {
        Client.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      materials(callback) {
        Material.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      services(callback) {
        Service.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      employees(callback) {
        User.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      business(callback) {
        Business.findById(req.user.business).exec(callback)
      },
      invoice(callback) {
        Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'invoice-email.ejs'), {
          title: `Invoice: ${results.invoice.title}`,
          parent_page: 'Invoices',
          layout: './layouts/dashboard',
          invoice: results.invoice,
          clients: results.clients,
          employees: results.employees,
          materials: results.materials,
          services: results.services,
          business: results.business,
          currentUser: res.locals.currentUser,
          public,
          phoneHelper
        })

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
        const emailTemplate = path.join(__dirname, '..', '..', 'views', 'emails', 'invoice.ejs');
        const email = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'emails', 'invoice-payment.ejs'), {
          invoice: results.invoice,
          business: results.business,
        })
        sendMail({
          from: {
            name: results.business.name,
            email: process.env.MAIL_INVOICE
          },
          to: results.invoice.client.email,
          replyTo: results.business.email,
          subject: `${results.business.name}: New Invoice`,
          html: email,
          attachments: [{
            filename: `invoice.pdf`,
            content: pdf.toString('base64'),
            // type: "application/pdf",
            // disposition: "attatchment"
          }],
        });
        res.redirect('/dashboard/email-success')
      })()
    }
  )
}

exports.send_email = (req, res, next) => {
  async.parallel(
    {
      clients(callback) {
        Client.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      materials(callback) {
        Material.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      services(callback) {
        Service.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      employees(callback) {
        User.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      business(callback) {
        Business.findById(req.user.business).exec(callback)
      },
      invoice(callback) {
        Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'invoice-email.ejs'), {
          title: `Invoice: ${results.invoice.title}`,
          parent_page: 'Invoices',
          layout: './layouts/dashboard',
          invoice: results.invoice,
          clients: results.clients,
          employees: results.employees,
          materials: results.materials,
          services: results.services,
          business: results.business,
          currentUser: res.locals.currentUser,
          public,
          phoneHelper
        })

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
        const emailTemplate = path.join(__dirname, '..', '..', 'views', 'emails', 'invoice.ejs');
        const email = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'emails', 'invoice.ejs'), {
          invoice: results.invoice,
          business: results.business,
        })
        sendMail({
          from: {
            name: results.business.name,
            email: process.env.MAIL_INVOICE
          },
          to: results.invoice.client.email,
          replyTo: results.business.email,
          subject: `${results.business.name}: New Invoice`,
          html: email,
          attachments: [{
            filename: `invoice.pdf`,
            content: pdf.toString('base64'),
            // type: "application/pdf",
            // disposition: "attatchment"
          }],
        });
        res.redirect('/dashboard/email-success')
      })()
    }
  )
}

exports.send_email_receipt = (req, res, next) => {
  async.parallel(
    {
      clients(callback) {
        Client.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      materials(callback) {
        Material.find({ business: req.user.business }).sort('desc').exec(callback);
      },
      services(callback) {
        Service.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      employees(callback) {
        User.find({ business: req.user.business }).sort('desc').exec(callback)
      },
      business(callback) {
        Business.findById(req.user.business).exec(callback)
      },
      invoice(callback) {
        Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'receipt-email.ejs'), {
          title: `Receipt: ${results.invoice.title}`,
          parent_page: 'Invoices',
          layout: './layouts/dashboard',
          invoice: results.invoice,
          clients: results.clients,
          employees: results.employees,
          materials: results.materials,
          services: results.services,
          business: results.business,
          currentUser: res.locals.currentUser,
          public,
          phoneHelper
        })

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
          `attachment; filename=receipt-${results.invoice.title}-${Date.now()}.pdf`
        );
        const emailTemplate = path.join(__dirname, '..', '..', 'views', 'emails', 'invoice.ejs');
        const email = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'emails', 'receipt.ejs'), {
          invoice: results.invoice,
          business: results.business,
        })
        sendMail({
          from: {
            name: results.business.name,
            email: process.env.MAIL_RECEIPT
          },
          to: results.invoice.client.email,
          replyTo: results.business.email,
          subject: `${results.business.name}: New Receipt`,
          html: email,
          attachments: [{
            filename: `receipt.pdf`,
            content: pdf.toString('base64'),
            // type: "application/pdf",
            // disposition: "attatchment"
          }],
        });
        res.redirect('/dashboard/email-success')
      })()
    }
  )
}

exports.sign_off = async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  invoice.isActive = false;
  invoice.completedOn = invoice.jobEnd;
  invoice.save();
  await res.redirect('/dashboard/invoice-list');
}

exports.reset_invoice = async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
  invoice.isActive = true;
  invoice.completedOn = null;
  invoice.save();
  res.redirect(invoice.url);
}

exports.log_hours = [
  body('hours')
    .trim()
    .isNumeric()
    .escape(),
  async (req, res, next) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business })
    const update = { employee: req.body.employee, totalHours: req.body.hours, date: req.body.date };
    invoice.loggedHours.push(update)
    invoice.save()
    res.redirect(invoice.url)
  }
]

exports.remove_log = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business });
    await Invoice.updateOne({ _id: req.params.id, business: req.user.business }, {
      $pull: {
        'loggedHours': { _id: req.params.logId }
      }
    });
    await res.redirect(invoice.url);
  } catch (err) {
    console.log(err)
    return next(err)
  }
}