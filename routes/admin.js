var express = require('express');
var router = express.Router();

const user_controller = require('../controllers/admin/userController');
const form_controller = require('../controllers/admin/formController');
const post_controller = require('../controllers/admin/postController');
const doc_controller = require('../controllers/admin/docsController')
const optin_controller = require('../controllers/admin/optinController');
const lead_controller = require('../controllers/leadController');
const checkUpload = require('../utils/upload')

const multer = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage: storage })

// Admin home page
router.get('/', function (req, res, next) {
  res.render('admin', { title: 'Admin', layout: './layouts/admin' })
});

//////////////// FORM ROUTES //////////////////////

// Delete Form GET
router.get('/form/:id/delete', form_controller.form_delete_get);

// Delete Form POST
router.post('/form/:id/delete', form_controller.form_delete_post);

// Get one form
router.get('/form/:id', form_controller.form_toggle_read, form_controller.form_detail);

// Toggle form read
router.post('/form/:id/mark-read', form_controller.form_toggle_read);

// Display form list
router.get('/form-list', form_controller.form_list)

/////////// User Routes ////////////////

// Create user get
router.get('/user-form', user_controller.user_create_get);

// Create user post
router.post('/user-form', user_controller.user_create_post);

// Delete user get
router.get('/user/:id/delete', user_controller.user_delete_get);

// Delete user post
router.post('/user/:id/delete', user_controller.user_delete_post);

// Update user get
router.get('/user/:id/update', user_controller.user_update_get);

// Update user post
router.post('/user/:id/update', user_controller.user_update_post);

// Change Password get
router.get('/user/:id/change-password', user_controller.user_change_password_get);

// Change Password post
router.post('/user/:id/change-password', user_controller.user_change_password_post);

// Get one user
router.get('/user/:id', user_controller.user_detail);

// Get list of all users
router.get('/user-list', user_controller.user_list);

//////////////// Blog Routes ///////////////////

// Create Blog Post GET
router.get('/post-form', post_controller.post_create_get);
// Create Blog post POST
router.post('/post-form', upload.single('image'), post_controller.post_create_post)

// Delete Blog Post POST
router.post('/post/:id/delete', post_controller.post_delete_post)

// Update Blog Post POST
router.post('/post/:id/update', checkUpload.upload.single('image'), post_controller.post_update_post)

// Blog Post List
router.get('/post-list', post_controller.post_list_dashboard);

// Single Blog Post
router.get('/post/:id', post_controller.post_detail_dashboard);


///////////////// Documentation Routes /////////////////////

// Create Doc GET
router.get('/doc-form', doc_controller.doc_create_get);

// Create Doc POST
router.post('/doc-form', doc_controller.doc_create_post);

// Delete Doc post
router.post('/doc/:id/delete', doc_controller.doc_delete_post)

// Update Doc
router.post('/doc/:id', doc_controller.doc_update_post)

// Unpublish all docs
router.post('/doc-list/unpublish-all', doc_controller.unpublish_all);

// Publish all docs
router.post('/doc-list/publish-all', doc_controller.publish_all);

// Doc list
router.get('/doc-list', doc_controller.doc_list_dashboard)

// Single doc
router.get('/doc/:id', doc_controller.doc_detail_dashboard)


////////////////// Opt In Routes //////////////////
router.get('/optin-list', optin_controller.optin_list);

/////////////////// Lead Routes //////////////////
router.get('/lead-list', lead_controller.lead_list);
router.get('/lead/:id', lead_controller.lead_detail);
router.get('/lead-form', lead_controller.lead_create_get);
router.post('/lead-form', lead_controller.lead_create);
router.post('/lead/:id/delete', lead_controller.lead_delete);
router.post('/lead/:id/update', lead_controller.lead_update);

module.exports = router