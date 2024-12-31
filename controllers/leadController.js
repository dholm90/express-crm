const Lead = require('../models/lead');
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require('sanitize-html');
const phoneHelper = require('../utils/formatPhone');

// Get All categories
exports.lead_list = async (req, res, next) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: 'desc' }).exec();
    await res.render('admin/lead-list', {
      title: 'Leads',
      layout: './layouts/admin',
      leads,
      phoneHelper
    })
  } catch (err) {
    return next(err)
  }
}

// Get lead detail
exports.lead_detail = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).exec();
    await res.render('admin/lead-detail', {
      title: `Lead: ${lead.name}`,
      layout: './layouts/admin',
      lead
    })
  } catch (err) {
    return next(err)
  }
}

// Create Lead get
exports.lead_create_get = async (req, res, next) => {
  const lead = undefined;
  res.render('admin/lead-form', {
    title: 'New Lead',
    layout: './layouts/admin',
    lead
  })
}

// Create lead post
exports.lead_create = [
  body('firstName', 'First name is required.')
    .trim()
    .isLength({ min: 1 }),
  body('lastName', 'Last name is required.')
    .trim()
    .isLength({ min: 1 }),
  body('businessName', 'Business name is invalid.')
    .trim()
    .isLength({ min: 1 }),
  body('email', 'Email is required.')
    .trim()
    .isEmail(),
  body('phone', 'Phone is invalid.')
    .trim()
    .isLength({ max: 11 })
    .isMobilePhone(),
  body('tinymce_content', 'Content must be specifed')
    .trim()
    .isLength({ min: 1 })
    .customSanitizer(value => {
      return sanitizeHtml(value)
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('admin/lead-form', {
        title: 'New Lead',
        layout: './layouts/admin',
        lead: req.body,
        errors: errors.array()
      })
      return
    }
    const leadData = new Lead({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      businessName: req.body.businessName,
      email: req.body.email,
      phone: req.body.phone,
      notes: req.body.tinymce_content,
      isContacted: req.body.isContacted ? true : false
    }).save(err => {
      if (err) {
        return next(err);
      }
      res.redirect('/admin/lead-list')
    })
  }
]

// Delete lead
exports.lead_delete = async (req, res, next) => {
  Lead.findByIdAndRemove(req.params.id, (err, lead) => {
    if (err) {
      return next(err)
    }
    res.redirect('/admin/lead-list')
  })
}

// Update lead
exports.lead_update = [
  body('firstName', 'First name is required.')
    .trim()
    .isLength({ min: 1 }),
  body('lastName', 'Last name is required.')
    .trim()
    .isLength({ min: 1 }),
  body('businessName', 'Business name is invalid.')
    .trim()
    .isLength({ min: 1 }),
  body('email', 'Email is required.')
    .trim()
    .isEmail(),
  body('phone', 'Phone is invalid.')
    .trim()
    .isLength({ max: 11 })
    .isMobilePhone(),
  body('tinymce_content', 'Content must be specifed')
    .trim()
    .isLength({ min: 1 })
    .customSanitizer(value => {
      return sanitizeHtml(value)
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    const lead = await Lead.findById(req.params.id).exec()
    if (!errors.isEmpty()) {
      res.render('admin/lead-detail', {
        title: `Lead: ${lead.name}`,
        layout: './layouts/admin',
        lead,
        errors: errors.array()
      })
      return
    }
    const leadData = new Lead({
      _id: req.params.id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      businessName: req.body.businessName,
      email: req.body.email,
      phone: req.body.phone,
      notes: req.body.tinymce_content,
      isContacted: req.body.isContacted ? true : false
    })
    Lead.findByIdAndUpdate(req.params.id, leadData, {}, (err, thelead) => {
      if (err) {
        return next(err)
      }
      res.redirect('/admin/lead-list')
    })

  }
]
