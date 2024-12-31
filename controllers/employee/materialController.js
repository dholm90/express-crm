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
      res.render('employee/material-list', {
        title: 'Materials',
        parent_page: 'Materials',
        layout: './layouts/employee',
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


    }, (err, results) => {
      if (err) {
        return next(err)
      }
      res.render('employee/material-detail', {
        title: `Material: ${results.material.name}`,
        parent_page: 'Materials',
        layout: './layouts/employee',
        material: results.material,
        results
      }
      )


    })
}

// Create Material Get
exports.create_material_get = (req, res, next) => {
  const form = undefined;
  res.render('employee/material-form', {
    title: 'New Material',
    parent_page: 'Materials',
    layout: './layouts/employee',
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
    const form = req.body;

    if (!errors.isEmpty()) {
      res.render('employee/material-form', {
        title: 'New Material',
        parent_page: 'Materials',
        layout: './layouts/employee',
        errors: errors.array(),
        form
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
        res.redirect('/employee')
        return next(err)
      }
      res.redirect(`/employee/material-list`);
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
        res.render('employee/material-detail', {
          title: `Material: ${material.name}`,
          parent_page: 'Materials',
          layout: './layouts/employee',
          material,
          errors: errors.array()
        });

        return;
      });
    }
    Material.findOne({ _id: req.params.id }).exec(function (err, material) {
      material.name = req.body.name;
      material.price = req.body.price;
      material.supplier = req.body.supplier;
      // material.inStock = req.body.inStock;
      material.save(err => {
        if (err) {

          res.redirect(material.url)
        }

        res.redirect(`/employee/material-list`)
      })
    })
  }
]


// Delete Material
exports.material_delete = (req, res, next) => {
  async.parallel(
    {
      material(callback) {
        Material.findOneAndDelete({ _id: req.params.id, business: req.user.business }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err)
      }
      res.redirect(`/employee/material-list`);
    }
  )
}