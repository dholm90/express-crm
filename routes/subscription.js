var express = require('express');
const Business = require('../models/business');
var router = express.Router();

// Subcscribe Page
router.get('/', async function (req, res, next) {
  const business = await Business.findById(req.user.business);

  if (business.subscription == 'NONE') {
    res.render('subscribe', { title: 'Subscribe', parent_page: "Subscribe", layout: './layouts/dashboard' })
  }
  else {
    if (req.user.role == 'ADMIN') {
      res.redirect('/dashboard')
    } else {
      res.redirect('/employee')
    }
  }
});

router.get('/discount', async function (req, res, next) {
  const business = await Business.findById(req.user.business);

  if (business.subscription == 'NONE') {
    res.render('subscribe/discount', { title: 'Subscribe', parent_page: "Subscribe", layout: './layouts/dashboard' })
  }
  else {
    if (req.user.role == 'ADMIN') {
      res.redirect('/dashboard')
    } else {
      res.redirect('/employee')
    }
  }
});

module.exports = router;