const Service = require('../../models/service');
const Quote = require("../../models/quote");
const Job = require('../../models/job');
const Invoice = require('../../models/invoice')
const { body, validationResult } = require("express-validator");
const async = require('async');

// Display list of services
exports.service_list = async (req, res, next) => {
  const service_list = await Service.find({ business: req.user.business }).sort({ createdAt: 'desc' });
  await res.render('employee/service-list', {
    title: 'Services',
    parent_page: 'Services',
    layout: './layouts/employee',
    service_list
  })
}

// Display one service
exports.service_detail = async (req, res, next) => {
  async.parallel(
    {
      service(callback) {
        Service.findOne({ _id: req.params.id, business: req.user.business }).exec(callback)
      },
    }, (err, results) => {
      if (err) {
        return next(err)
      }
      res.render('employee/service-detail', {
        title: `Service: ${results.service.title}`,
        parent_page: 'Services',
        layout: './layouts/employee',
        service: results.service,
        results
      }
      )


    })
}

// Create service get
exports.service_create_get = (req, res, next) => {
  const form = undefined;
  res.render('employee/service-form', {
    title: 'New Service',
    parent_page: 'Services',
    layout: './layouts/employee',
    form
  })
}

// Create service post
exports.service_create_post = [
  body('title', 'Title is required.')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Description is required.')
    .trim()
    .isLength({ min: 1 }),
  body('price', 'Price is required.')
    .trim()
    .isNumeric()
    .isLength({ min: 1 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    const form = req.body;

    if (!errors.isEmpty()) {
      res.render('employee/service-form', {
        title: 'New Service',
        parent_page: 'Services',
        layout: './layouts/employee',
        errors: errors.array(),
        form
      })
    }
    const serviceData = new Service({
      ...req.body,
      business: req.user.business,
      createdBy: req.user._id
    })
    serviceData.save(err => {
      if (err) {
        return next(err)
      }
      res.redirect('/employee/service-list')
    })
  }
]

// Delete service post
exports.service_delete = (req, res, next) => {
  async.parallel(
    {
      service(callback) {
        Service.findOneAndDelete({ _id: req.params.id, business: req.user.business }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      res.redirect(`/employee/service-list`);
    }
  )
}


// Update service post
exports.service_update_post = [
  body('title', 'Title is required.')
    .trim()
    .isLength({ min: 1 }),
  body('description', 'Description is required.')
    .trim()
    .isLength({ min: 1 }),
  body('price', 'Price is required.')
    .trim()
    .isNumeric()
    .isLength({ min: 1 }),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const service = await Service.findOne({ _id: req.params.id, business: req.user.business });
      await res.render('employee/service-detail', {
        title: `Service: ${service.title}`,
        parent_page: 'Services',
        layout: './layouts/employee',
        service,
        errors
      })
    }
    Service.findOne({ _id: req.params.id }).exec(function (err, service) {
      service.title = req.body.title;
      service.description = req.body.description;
      service.price = req.body.price;
      service.save(err => {
        if (err) {
          return next(err)
        }
        res.redirect('/employee/service-list')
      })
    })
  }
]