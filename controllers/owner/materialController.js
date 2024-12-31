const { body, validationResult } = require("express-validator");
const async = require('async');
const User = require('../../models/user');
const Material = require('../../models/material');
const phoneHelper = require('../../utils/formatPhone');
const Quote = require("../../models/quote");
const Job = require('../../models/job');
const Invoice = require('../../models/invoice')

// Get Material List
exports.material_list = (req, res, next) => {
  Material.find({ business: req.user.business })
    .sort({ createdAt: 'desc' })
    .exec(function (err, material_list) {
      if (err) {
        return next(err);
      }
      res.render('dashboard/material-list', {
        title: 'Materials',
        parent_page: 'Materials',
        layout: './layouts/dashboard',
        material_list,
        phoneHelper
      })
    })
};
// Get Material Detail
exports.material_detail = (req, res, next) => {
  async.parallel(
    {
      material(callback) {
        Material.findOne({ _id: req.params.id, business: req.user.business }).exec(callback)
      },
      // quotes(callback) {
      //   Quote.countDocuments({ business: req.user.business, 'materials.material': req.params.id }).exec(callback)
      // },
      // jobs(callback) {
      //   Job.countDocuments({ business: req.user.business, 'materials.material': req.params.id }).exec(callback)
      // },
      // invoices(callback) {
      //   Invoice.countDocuments({ business: req.user.business, 'materials.material': req.params.id }).exec(callback)
      // }

    }, (err, results) => {
      if (err) {
        return next(err)
      }
      res.render('dashboard/material-detail', {
        title: `Material: ${results.material.name}`,
        parent_page: 'Materials',
        layout: './layouts/dashboard',
        material: results.material,
        results
      }
      )


    })
}

// Create Material Get
exports.create_material_get = (req, res, next) => {
  const form = undefined;
  res.render('dashboard/material-form', {
    title: 'New Material',
    parent_page: 'Materials',
    layout: './layouts/dashboard',
    form
  })
}

// Create Material Post
exports.create_material_post = [
  body('name', 'Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
  body('price', 'Price must be specifed.')
    .trim()
    .isLength({ min: 1 })
    .isNumeric(),
  body('inStock', 'Stock is invalid')
    .trim()
    .isNumeric()
    .optional({ nullable: true, checkFalsy: true }),
  body('supplier', 'Supplier is invalid')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  (req, res, next) => {
    const errors = validationResult(req);
    const form = req.body
    if (!errors.isEmpty()) {
      res.render('dashboard/material-form', {
        title: 'New Material',
        parent_page: 'Materials',
        layout: './layouts/dashboard',
        form,
        errors: errors.array()
      })
      return
    }
    const materialData = new Material({
      name: req.body.name,
      price: req.body.price,
      supplier: req.body.supplier,
      inStock: req.body.inStock,
      business: req.user.business,
      createdBy: req.user._id
    }).save(err => {
      if (err) {
        console.log(err)
        res.redirect('/dashboard')
        return next(err)
      }
      res.redirect(`/dashboard/material-list`);
    })
  }
]

// Update Material
exports.update_material = [
  body('name', 'Name must be specified.')
    .trim()
    .isLength({ min: 1 }),
  body('price', 'Price must be specifed.')
    .trim()
    .isLength({ min: 1 })
    .isNumeric()
    .escape(),
  body('inStock', 'In stock must be specified.')
    .trim()
    .isLength({ min: 1 })
    .isNumeric()
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  body('supplier', 'Supplier is invalid')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .optional({ nullable: true, checkFalsy: true }),
  (req, res, next) => {
    const errors = validationResult(req);
    console.log(errors)

    if (!errors.isEmpty()) {
      Material.findOne({ _id: req.params.id, business: req.user.business }).exec(function (err, material) {
        if (err) {
          return next(err)
        }
        if (material == null) {
          const err = new Error('Material not found');
          err.status = 404;
          return next(err);
        }
        res.render('dashboard/material-detail', {
          title: `Material: ${material.name}`,
          parent_page: 'Materials',
          layout: './layouts/dashboard',
          material,
          errors: errors.array()
        });

        return next();
      });
    } else {
      Material.findOne({ _id: req.params.id }).exec(function (err, material) {
        if (err) {
          return next(err)
        }
        material.name = req.body.name;
        material.price = req.body.price;
        material.supplier = req.body.supplier;
        // material.inStock = req.body.inStock;
        material.save(err => {
          if (err) {
            console.log(err)
            return next(err)
          }

          res.redirect(`/dashboard/material-list`)
        })
      })
    }
  }
]


// Delete Material
exports.material_delete = (req, res, next) => {
  async.parallel(
    {
      material(callback) {
        Material.findOneAndDelete({ _id: req.params.id, business: req.user.business }).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      res.redirect(`/dashboard/material-list`);
    }
  )
}