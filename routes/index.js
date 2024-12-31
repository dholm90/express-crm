var express = require('express');
var router = express.Router();
const path = require('path');

const form_controller = require('../controllers/admin/formController');
const user_controller = require('../controllers/admin/userController');
const post_controller = require('../controllers/admin/postController');
const docs_controller = require('../controllers/admin/docsController');
const quote_controller = require('../controllers/owner/quoteController')

const { upload } = require('../utils/client-upload');
const { index_post_limiter } = require('../utils/rateLimiter');

// Get Home Page
router.get('/', function (req, res, next) {
  const errors = undefined;
  res.render('index', {
    title: 'Bear Quotes - Streamlined Business Management for Contractors',
    // layout: './layouts/home',
    errors
  });
})

// Login page GET
router.get('/login', function (req, res, next) {
  const form = undefined;
  res.render('login', { title: 'Log In', form })
})

// Reset Password form
router.get('/reset-password', function (req, res, next) {
  res.render('reset-password', {
    title: 'Bear Quotes - Streamlined Business Management for Contractors',

  })
})

// Reset PAssword change
router.get('/reset-password/:userId/:token', function (req, res, next) {
  res.render('reset-password-form', {
    title: 'Bear Quotes - Streamlined Business Management for Contractors',
  })
})

// Reset Password Link
router.post('/reset-password', user_controller.reset_password_link);


// Reset Password post
router.post('/reset-password/:userId/:token', user_controller.reset_password_post)


// Contact form POST
router.post('/contact-form', index_post_limiter, form_controller.form_create_post);

// Opt in form post
router.post('/opt-in', index_post_limiter, form_controller.optin_create_post);

// Contact form success
router.get('/form-success', function (req, res, next) {
  res.render('form-success', { title: 'Thank you!' })
});

///////// Uncomment for sign up page
router.get('/sign-up', user_controller.create_user_get);

/////////// Uncomment for sign up page post
router.post('/sign-up', index_post_limiter, user_controller.create_user_post);

///////// Uncomment for sign up page
router.get('/sign-up-discount', user_controller.create_user_get_discount);

/////////// Uncomment for sign up page post
router.post('/sign-up-discount', index_post_limiter, user_controller.create_user_post_discount);

// Privacy Policy
router.get('/privacy-policy', function (req, res, next) {
  res.render('privacy-policy', {
    title: 'Privacy Policy',
    layout: './layouts/full-width'
  })
})

// Terms and conditions
router.get('/terms-and-conditions', function (req, res, next) {
  res.render('terms-and-conditions', {
    title: 'Terms & Conditions',
    layout: './layouts/full-width'
  })
})

// Refund Policy
router.get('/refund-policy', function (req, res, next) {
  res.render('refund-policy', {
    title: 'Refund Policy',
    layout: './layouts/full-width'
  })
})

// Doc List
router.get('/docs', docs_controller.doc_list_client);

// Single Doc
router.get('/docs/:parent/:slug', docs_controller.doc_detail_client)
// Blog Post List
router.get('/blog', post_controller.post_list_client);

// Single Blog Post
router.get('/blog/:slug', post_controller.post_detail_client);

// Quote Signature Get
router.get('/quote/:id/signature', (req, res, next) => {
  res.render('signature/index', {
    title: 'Sign Here',
    layout: './layouts/full-width',
    quoteId: req.params.id
  })
})

// Quote signature Post
router.post('/quote/:id/signature', upload.single('base64Data'), quote_controller.upload_signature_email);

// signature failure
router.get('/signature/error', (req, res, next) => {
  res.render('signature/error', {
    title: "Opps! Something went wrong!",
    layout: './layouts/full-width'
  })
})

// signature success
router.get('/signature/success', (req, res, next) => {
  res.render('signature/success', {
    title: "Signature Complete!",
    layout: './layouts/full-width'
  })
})

module.exports = router;