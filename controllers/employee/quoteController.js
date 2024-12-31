const { body, validationResult } = require("express-validator");
const { getBrowserInstance } = require('../../utils/instance');
const crypto = require('crypto');
const sharp = require('sharp');
const ejs = require('ejs');
const path = require('path');
const async = require('async');
const User = require('../../models/user');
const Client = require('../../models/client')
const Quote = require('../../models/quote');
const Material = require('../../models/material')
const Service = require('../../models/service');
const Business = require('../../models/business');
const Job = require('../../models/job');
const Image = require('../../models/image');
const phoneHelper = require('../../utils/formatPhone');
const sendMail = require('../../utils/sendgrid');
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../../utils/s3');
const { default: mongoose } = require("mongoose");


// Get Quote List
exports.quote_list = (req, res, next) => {
  Quote.find({ business: req.user.business, employees: req.user._id })
    .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
    .sort({ createdAt: 'desc' })
    .exec(function (err, quote_list) {
      if (err) {
        return next(err);
      }
      res.render('employee/quote-list', {
        title: 'Quotes',
        parent_page: 'Quotes',
        layout: './layouts/employee',
        quote_list,
        phoneHelper
      })
    })
};
//Get Quote Detail
exports.quote_detail = (req, res, next) => {
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
      quote(callback) {
        Quote.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }, 'images']).exec(callback);
      }
    },
    async (err, results) => {
      if (err) {
        console.log(err)
        return next(err);
      }

      for (let image of results.quote.images) {
        image.imageUrl = await getObjectSignedUrl(image.imageName);
      }
      let signatureURL;
      if (results.quote.signatureName) {
        signatureURL = await getObjectSignedUrl(results.quote.signatureName)
      }
      // await results.quote.images.forEach(async image => {
      //   image.imageUrl = await getObjectSignedUrl(image.imageName);
      // })

      // await results.quote.save()
      // console.log(results.quote.images)
      await res.render('employee/quote-detail', {
        title: `Quote: ${results.quote.title}`,
        parent_page: 'Quotes',
        layout: './layouts/employee',
        quote: results.quote,
        clients: results.clients,
        employees: results.employees,
        materials: results.materials,
        services: results.services,
        business: results.business,
        phoneHelper,
        signatureURL
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
      const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material });

      await res.render('employee/quote-detail', {
        title: `Quote: ${quote.title}`,
        parent_page: 'Quotes',
        layout: './layouts/employee',
        quote,
        clients,
        employees,
        materials,
        services,
        errors
      })
      return
    }

    const material = await Material.findById(req.body.material)
    const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
    const update = { qty: req.body.materialQty, name: material.name, price: material.price, supplier: material.supplier };
    quote.materials.push(update);
    await quote.save();
    await res.redirect(quote.url_employee);
  }
]

// Remove Material from list
exports.remove_material = async (req, res, next) => {
  const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
  await Quote.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'materials': { _id: req.params.materialId }
    }
  });
  await res.redirect(quote.url_employee);


}

// Create Quote Get
exports.create_quote_get = (req, res, next) => {
  Client.find({ business: req.user.business })
    .sort({ lastName: 'desc' })
    .exec(function (err, clients) {
      if (err) {
        return next(err)
      }
      const form = undefined;

      res.render('employee/quote-form', {
        title: 'New Quote',
        parent_page: 'Quotes',
        layout: './layouts/employee',
        clients,
        form
      })
    })
}

// Create Quote Post
exports.create_quote_post = [
  body('title', 'Title must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('jobStart', 'Job start date must be specified.')
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
    const form = req.body;
    if (!errors.isEmpty()) {
      res.render('employee/quote-form', {
        title: 'New Quote',
        parent_page: 'Quotes',
        layout: './layouts/employee',
        errors: errors.array(),
        form
      })
      return
    }
    const quoteData = new Quote({
      title: req.body.title,
      client: req.body.client,
      jobStart: req.body.jobStart,
      jobEnd: req.body.jobEnd,
      tax: req.body.tax,
      markup: req.body.markup,
      business: req.user.business,
      employees: req.user._id,
      createdBy: req.user._id
    }).save(err => {
      if (err) {
        console.log(err)
        res.redirect('/employee')
        return next(err)
      }
      res.redirect(`/employee/quote-list`);
    })
  }
]

// Update Quote
exports.update_quote = [
  body('title', 'Title must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('jobStart', 'Job start date must be specified.')
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
          quote(callback) {
            Quote.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('employee/quote-detail', {
            title: `Quote: ${results.quote.title}`,
            parent_page: 'Quotes',
            layout: './layouts/employee',
            quote: results.quote,
            clients: results.clients,
            employees: results.employees,
            materials: results.materials,
            services: results.services,
            errors: errors.array()
          })
        }
      )
    }
    Quote.findOne({ _id: req.params.id, business: req.user.business }).exec(function (err, quote) {
      quote.title = req.body.title;
      quote.client = req.body.client;
      quote.jobStart = req.body.jobStart;
      quote.jobEnd = req.body.jobEnd;
      quote.tax = req.body.tax;
      quote.markup = req.body.markup;

      quote.save(err => {
        if (err) {
          console.log(err)
          return next(err)
        }

        res.redirect(quote.url_employee)
      })
    })
  }
]


// Delete Quote
exports.quote_delete = async (req, res, next) => {
  const job = await Job.findOne({ quoteId: req.params.id })
  if (job) {
    const msg = 'Delete associated job and invoice before deleting this quote.'
    // render error if job with quote id exists
    res.render('employee/error', {
      title: 'Error',
      parent_page: 'Error',
      layout: './layouts/employee',
      msg
    })
  } else {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, business: req.user.business })
    quote
    const images = await Image.find({ business: req.user.business, quote: req.params.id });
    images.forEach(image => {
      image.quote = null;
      image.save()
    });
    res.redirect(`/employee/quote-list`);
  }

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
    const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });

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
          quote(callback) {
            Quote.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('employee/quote-detail', {
            title: `Quote: ${results.quote.title}`,
            parent_page: 'Quotes',
            layout: './layouts/employee',
            quote: results.quote,
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
        res.redirect('/employee')
        return next(err)
      }
      res.redirect(quote.url_employee);
    })
  }
]





// Add service to list
exports.add_service = async (req, res, next) => {
  const service = await Service.findById(req.body.service)
  const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
  const update = { title: service.title, description: service.description, price: service.price };
  quote.services.push(update);
  await quote.save();
  await res.redirect(quote.url_employee);
}


// Remove service from list
exports.remove_service = async (req, res, next) => {
  const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
  await Quote.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'services': { _id: req.params.serviceId }
    }
  });
  await res.redirect(quote.url);


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
    const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });

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
          quote(callback) {
            Quote.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('employee/quote-detail', {
            title: `Quote: ${results.quote.title}`,
            parent_page: 'Quotes',
            layout: './layouts/employee',
            quote: results.quote,
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
        res.redirect('/employee')
        return next(err)
      }
      res.redirect(quote.url);
    })
  }
]

// Add Employee to list
exports.add_employee = async (req, res, next) => {
  const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
  const employee = await Quote.find({ "employees": req.body.employee });
  if (!quote.employees.includes(req.body.employee)) {
    console.log(quote.employees, req.body.employee)
    const update = req.body.employee;
    quote.employees.push(update);
    await quote.save();
    await res.redirect(quote.url_employee);
  } else {

    await res.redirect(quote.url_employee)
  }
}

// Remove Employee from list
exports.remove_employee = async (req, res, next) => {
  const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
  await Quote.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'employees': req.params.employeeId
    }
  });
  await res.redirect(quote.url_employee);
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
      quote(callback) {
        Quote.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.quote == null) {
        const err = new Error("Invoice not found");
        err.status = 404;
        return next(err);
      }
      // const emailTemplate = path.join(__dirname, '..', 'views', 'emails', 'invoice.ejs');
      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'quote-render.ejs'), {
          title: `Quote: ${results.quote.title}`,
          parent_page: 'Quotes',
          layout: './layouts/employee',
          quote: results.quote,
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
          `attachment; filename=invoice-${results.quote.title}-${Date.now()}.pdf`
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
        // res.redirect('/employee/email-success')
      })()
    }
  )
}

exports.upload_images = (req, res, next) => {

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
      quote(callback) {
        Quote.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
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
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'quote-email.ejs'), {
          title: `Quote: ${results.quote.title}`,
          parent_page: 'Quotes',
          layout: './layouts/employee',
          quote: results.quote,
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
          `attachment; filename=quote-${results.quote.title}-${Date.now()}.pdf`
        );
        const emailTemplate = path.join(__dirname, '..', '..', 'views', 'emails', 'quote.ejs');
        const email = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'emails', 'quote.ejs'), {
          quote: results.quote,
          business: results.business,
        })
        sendMail({
          from: {
            name: results.business.name,
            email: process.env.MAIL_QUOTE
          },
          to: results.quote.client.email,
          replyTo: results.business.email,
          subject: `${results.business.name}: New Quote`,
          html: email,
          attachments: [{
            filename: `quote.pdf`,
            content: pdf.toString('base64'),
            // type: "application/pdf",
            // disposition: "attatchment"
          }],
        });
        res.redirect('/employee/email-success')
      })()
    }
  )

}

exports.sign_off = async (req, res, next) => {
  const job = await Job.findOne({ quoteId: req.params.id });
  const quote = await Quote.findById(req.params.id);
  const images = await Image.find({ quote: req.params.id });
  const newId = mongoose.Types.ObjectId();
  if (job) {
    const msg = 'Delete associated job and invoice before archiving this quote.'
    // send to redirect if job with quote id exists
    res.render('employee/error', {
      title: 'Error',
      parent_page: 'Error',
      layout: './layouts/employee',
      msg
    })
  } else {
    images.forEach(image => {
      image.job = newId;
      image.save();
    })
    quote.isActive = false;
    quote.save();

    const jobData = new Job({
      ...quote.toObject(),
      isActive: true,
      quoteId: quote._id,
      _id: newId
    })
    jobData.save();

    await res.redirect('/employee/job-list');
  }

}

exports.reset_quote = async (req, res, next) => {
  const job = await Job.findOne({ quoteId: req.params.id })
  const quote = await Quote.findOne({ _id: req.params.id, business: req.user.business });
  if (job) {
    const msg = 'Delete associated job and invoice before resetting this quote.'
    // send to redirect if job with quote id exists
    res.render('employee/error', {
      title: 'Error',
      parent_page: 'Error',
      layout: './layouts/employee',
      msg
    })
  } else {
    quote.isActive = true;
    quote.save();
    res.redirect(quote.url_employee);
  }

}

exports.upload_signature = async (req, res, next) => {
  const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

  Quote.findOne({ _id: req.params.id, business: req.user.business }).exec(async (err, quote) => {

    if (quote.signatureName !== null) {
      deleteFile(quote.signatureName)
    }
    // console.log(req.file)
    const file = req.body.base64Data;
    const buffer = Buffer.from(file, 'base64')
    // console.log(file)
    // console.log(buffer)
    const imgName = generateFileName();
    // console.log(imgName)
    const fileBuffer = await sharp(buffer)
      .flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } })
      .resize({ width: 1080, fit: "contain" })
      .toFormat("jpeg", { mozjpeg: true })
      .toBuffer();
    fileBuffer;
    uploadFile(fileBuffer, imgName, 'image/jpeg')

    quote.signatureName = imgName;

    quote.save()
    res.redirect(quote.url_employee)
  })
}

exports.upload_signature_email = async (req, res, next) => {
  const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

  Quote.findOne({ _id: req.params.id }).exec(async (err, quote) => {
    if (err) {
      return next(err)
    }
    if (quote.signatureName !== null) {
      res.redirect('/signature/error')
    } else {
      // console.log(req.file)
      const file = req.body.base64Data;
      const buffer = Buffer.from(file, 'base64')
      // console.log(file)
      // console.log(buffer)
      const imgName = generateFileName();
      // console.log(imgName)
      const fileBuffer = await sharp(buffer)
        .flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } })
        .resize({ width: 1080, fit: "contain" })
        .toFormat("jpeg", { mozjpeg: true })
        .toBuffer();
      console.log(fileBuffer)
      uploadFile(fileBuffer, imgName, 'image/jpeg')

      quote.signatureName = imgName;

      quote.save()
      res.redirect('/signature/success')
    }

  })
}

exports.delete_signature = async (req, res, next) => {
  Quote.findOne({ _id: req.params.id, business: req.user.business }).exec(async (err, quote) => {
    if (err) {
      return next(err)
    }
    deleteFile(quote.signatureName)
    quote.signatureName = null;
    quote.save()
    res.redirect(quote.url_employee)
  })
}