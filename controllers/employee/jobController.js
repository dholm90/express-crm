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
const Job = require('../../models/job');
const Image = require('../../models/image');
const HourLog = require('../../models/hourLog')
const phoneHelper = require('../../utils/formatPhone');
const sendMail = require('../../utils/sendgrid');
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../../utils/s3');
const { default: mongoose } = require("mongoose");


// Get Job List
exports.job_list = (req, res, next) => {
  Job.find({ business: req.user.business, employees: req.user._id })
    .populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'services.service', model: Service }, 'client', 'createdBy'])
    .sort({ createdAt: 'desc' })
    .exec(function (err, job_list) {
      if (err) {
        return next(err);
      }
      res.render('employee/job-list', {
        title: 'Jobs',
        parent_page: 'Jobs',
        layout: './layouts/employee',
        job_list,
        phoneHelper
      })
    })
};
//Get Job Detail
exports.job_detail = (req, res, next) => {
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
      job(callback) {
        Job.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'loggedHours', model: HourLog, populate: [{ path: 'employee', ref: 'User' }] }, { path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }, 'images']).exec(callback);
      }
    },
    async (err, results) => {
      if (err) {
        console.log(err)
        return next(err);
      }

      for (let image of results.job.images) {
        image.imageUrl = await getObjectSignedUrl(image.imageName);
      }
      // await results.job.images.forEach(async image => {
      //   image.imageUrl = await getObjectSignedUrl(image.imageName);
      // })

      // await results.job.save()
      // console.log(results.job.images)
      await res.render('employee/job-detail', {
        title: `Job: ${results.job.title}`,
        parent_page: 'Jobs',
        layout: './layouts/employee',
        job: results.job,
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
      const job = await Job.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material });

      await res.render('employee/job-detail', {
        title: `Job: ${job.title}`,
        parent_page: 'Jobs',
        layout: './layouts/employee',
        job,
        clients,
        employees,
        materials,
        services,
        errors
      })
      return
    }

    const material = await Material.findById(req.body.material)
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
    const update = { qty: req.body.materialQty, name: material.name, price: material.price, supplier: material.supplier };
    job.materials.push(update);
    await job.save();
    await res.redirect(job.url_employee);
  }
]

// Remove Material from list
exports.remove_material = async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
  await Job.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'materials': { _id: req.params.materialId }
    }
  });
  await res.redirect(job.url_employee);


}

// Create Job Get
exports.create_job_get = (req, res, next) => {
  Client.find({ business: req.user.business })
    .sort({ lastName: 'desc' })
    .exec(function (err, clients) {
      if (err) {
        return next(err)
      }
      const job = undefined;

      res.render('employee/job-form', {
        title: 'New Job',
        parent_page: 'Jobs',
        layout: './layouts/employee',
        clients,
        job
      })
    })
}

// Create Job Post
exports.create_job_post = [
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
      res.render('employee/job-form', {
        title: 'New Job',
        parent_page: 'Jobs',
        layout: './layouts/employee',
        errors: errors.array()
      })
      return
    }
    const jobData = new Job({
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
      res.redirect(`/employee/job-list`);
    })
  }
]

// Update Job
exports.update_job = [
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
          job(callback) {
            Job.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('employee/job-detail', {
            title: `Job: ${results.job.title}`,
            parent_page: 'Jobs',
            layout: './layouts/employee',
            job: results.job,
            clients: results.clients,
            employees: results.employees,
            materials: results.materials,
            services: results.services,
            errors: errors.array()
          })
        }
      )
    }
    Job.findOne({ _id: req.params.id, business: req.user.business }).exec(function (err, job) {
      job.title = req.body.title;
      job.client = req.body.client;
      job.jobStart = req.body.jobStart;
      job.jobEnd = req.body.jobEnd;
      job.tax = req.body.tax;
      job.markup = req.body.markup;

      job.save(err => {
        if (err) {
          console.log(err)
          return next(err)
        }

        res.redirect(job.url_employee)
      })
    })
  }
]


// Delete Job
exports.job_delete = async (req, res, next) => {
  const invoice = await Invoice.findOne({ jobId: req.params.id });
  if (invoice) {
    const msg = 'Delete associated invoice before deleting this job.'
    // render error if job with quote id exists
    res.render('employee/error', {
      title: 'Error',
      parent_page: 'Error',
      layout: './layouts/employee',
      msg
    })
  } else {
    const job = await Job.findOneAndDelete({ _id: req.params.id, business: req.user.business })
    job
    const images = await Image.find({ business: req.user.business, job: req.params.id });
    images.forEach(image => {
      image.job = null;
      image.save()
    });
    res.redirect(`/employee/job-list`);
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
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business });

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
          job(callback) {
            Job.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('employee/job-detail', {
            title: `Job: ${results.job.title}`,
            parent_page: 'Jobs',
            layout: './layouts/employee',
            job: results.job,
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
      res.redirect(job.url_employee);
    })
  }
]





// Add service to list
exports.add_service = async (req, res, next) => {

  const service = await Service.findById(req.body.service)
  const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
  const update = { title: service.title, description: service.description, price: service.price };
  job.services.push(update);
  await job.save();
  await res.redirect(job.url_employee);
}


// Remove service from list
exports.remove_service = async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
  await Job.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'services': { _id: req.params.serviceId }
    }
  });
  await res.redirect(job.url_employee);


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
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business });

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
          job(callback) {
            Job.findOne({ _id: req.params.id, business: req.user.business }).populate({ path: 'materials.material', model: Material }).exec(callback);
          }
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return next(err);
          }
          res.render('employee/job-detail', {
            title: `Job: ${results.job.title}`,
            parent_page: 'Jobs',
            layout: './layouts/employee',
            job: results.job,
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
      res.redirect(job.url_employee);
    })
  }
]

// Add Employee to list
exports.add_employee = async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
  const employee = await Job.find({ "employees": req.body.employee });
  if (!job.employees.includes(req.body.employee)) {
    console.log(job.employees, req.body.employee)
    const update = req.body.employee;
    job.employees.push(update);
    await job.save();
    await res.redirect(job.url_employee);
  } else {

    await res.redirect(job.url_employee)
  }
}

// Remove Employee from list
exports.remove_employee = async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
  await Job.updateOne({ _id: req.params.id, business: req.user.business }, {
    $pull: {
      'employees': req.params.employeeId
    }
  });
  await res.redirect(job.url_employee);
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
      job(callback) {
        Job.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.job == null) {
        const err = new Error("Invoice not found");
        err.status = 404;
        return next(err);
      }
      // const emailTemplate = path.join(__dirname, '..', 'views', 'emails', 'invoice.ejs');
      (async () => {
        const browser = await getBrowserInstance();
        const [page] = await browser.pages()

        const public = path.join(__dirname, '..', 'public')
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'job-render.ejs'), {
          title: `Job: ${results.job.title}`,
          parent_page: 'Jobs',
          layout: './layouts/employee',
          job: results.job,
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
          `attachment; filename=invoice-${results.job.title}-${Date.now()}.pdf`
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
      job(callback) {
        Job.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]).exec(callback);
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
        const html = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'pdf', 'job-email.ejs'), {
          title: `Job: ${results.job.title}`,
          parent_page: 'Jobs',
          layout: './layouts/employee',
          job: results.job,
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
          `attachment; filename=job-${results.job.title}-${Date.now()}.pdf`
        );
        const emailTemplate = path.join(__dirname, '..', '..', 'views', 'emails', 'job.ejs');
        const email = await ejs.renderFile(path.join(__dirname, '..', '..', 'views', 'emails', 'job.ejs'), {
          job: results.job,
          business: results.business,
        })
        sendMail({
          from: process.env.MAIL_USERNAME,
          to: 'devanholm@gmail.com',
          subject: `${results.business.name}: New Job`,
          html: email,
          attachments: [{
            filename: `job.pdf`,
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
  const invoice = await Invoice.findOne({ jobId: req.params.id });
  const job = await Job.findById(req.params.id);
  const images = await Image.find({ quote: req.params.id });
  const newId = mongoose.Types.ObjectId();
  if (invoice) {
    const msg = 'Delete associated invoice before archiving this job.'
    // send to redirect if job with quote id exists
    res.render('employee/error', {
      title: 'Error',
      parent_page: 'Error',
      layout: './layouts/employee',
      msg
    })
  } else {
    images.forEach(image => {
      image.invoice = newId;
      image.save();
    })


    job.isActive = false;
    job.save();

    const invoiceData = new Invoice({
      ...job.toObject(),
      isActive: true,
      jobId: job._id,
      _id: newId
    })
    invoiceData.save();

    await res.redirect('/employee/invoice-list');
  }
}

exports.reset_job = async (req, res, next) => {
  const invoice = await Invoice.findOne({ jobId: req.params.id })
  if (invoice) {
    const msg = 'Delete associated invoice before resetting this job.'
    // send to redirect if job with quote id exists
    res.render('employee/error', {
      title: 'Error',
      parent_page: 'Error',
      layout: './layouts/employee',
      msg
    })
  } else {
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
    job.isActive = true;
    job.save();
    res.redirect(job.url_employee);
  }
}

exports.log_hours = [
  body('hours')
    .trim()
    .isNumeric()
    .escape(),
  async (req, res, next) => {
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business })
    const update = { employee: req.body.employee, totalHours: req.body.hours, date: req.body.date };
    job.loggedHours.push(update)
    job.save()
    res.redirect(job.url_employee)
  }
]

exports.remove_log = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, business: req.user.business });
    await Job.updateOne({ _id: req.params.id, business: req.user.business }, {
      $pull: {
        'loggedHours': { _id: req.params.logId }
      }
    });
    await res.redirect(job.url_employee);
  } catch (err) {
    console.log(err)
    return next(err)
  }
}