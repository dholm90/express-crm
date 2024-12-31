var express = require('express');
var router = express.Router();

const user_controller = require('../controllers/employee/userController');
const client_controller = require('../controllers/employee/clientController');
const material_controller = require('../controllers/employee/materialController');
const invoice_controller = require('../controllers/employee/invoiceController');
const service_controller = require('../controllers/employee/serviceController');
const quote_controller = require('../controllers/employee/quoteController');
const job_controller = require('../controllers/employee/jobController');
const image_controller = require('../controllers/employee/imageController');
const dashboard_controller = require('../controllers/employee/dashboardController');
const stripe_controller = require('../controllers/employee/stripeController');
const expense_controller = require('../controllers/employee/expenseController');
const hours_controller = require('../controllers/employee/hoursController')
const owner_quote_controller = require('../controllers/owner/quoteController');
const { upload } = require('../utils/client-upload');

// Dashboard home page
// Employee home page
router.get('/', function (req, res, next) {
  res.render('employee', { title: 'Employee', layout: './layouts/employee', parent_page: 'Home' })
});

// Email success Page
router.get('/email-success', function (req, res, next) {
  res.render('employee/email-success', {
    title: 'Email Sent!',
    parent_page: 'None',
    layout: './layouts/employee'
  })
})


//// CLIENT ROUTES ////

// Create Client Get
router.get('/create-client', client_controller.create_client_get);

// Create Client Post
router.post('/create-client', client_controller.create_client_post);

// Delete Client Post
// router.post('/client/:id/delete', client_controller.client_delete_post);

// Update client Get
router.get('/client/:id/update', client_controller.client_update_get);

// Update Client Post
router.post('/client/:id/update', client_controller.client_update_post);

// Get one client
router.get('/client/:id', client_controller.client_detail);

// Get client list
router.get('/client-list', client_controller.client_list);

///////////////////// Job Routes //////////////

// Create job get
router.get('/create-job', job_controller.create_job_get);

// Create job post
router.post('/create-job', job_controller.create_job_post);

// Update job post
router.post('/job/:id/update', job_controller.update_job);

// Delete job post
router.post('/job/:id/delete', job_controller.job_delete);

// Get one job
router.get('/job/:id', job_controller.job_detail);

// Get all jobs
router.get('/job-list', job_controller.job_list);

// Add Material to list
router.post('/job/:id/add-material', job_controller.add_material);

// Remove MAterial from list
router.post('/job/:id/remove-material/:materialId', job_controller.remove_material);

// New Material
router.post('/job/:id/new-material', job_controller.new_material);

// Add service to list
router.post('/job/:id/add-service', job_controller.add_service);

// Remove service from list
router.post('/job/:id/remove-service/:serviceId', job_controller.remove_service);

// New Service
router.post('/job/:id/new-service', job_controller.new_service);

// Add employee to list
router.post('/job/:id/add-employee', job_controller.add_employee);

// Remove employee from list
router.post('/job/:id/remove-employee/:employeeId', job_controller.remove_employee);

// Download PDF
router.get('/job/:id/download', job_controller.download);

// Sign Off job
router.post('/job/:id/sign-off', job_controller.sign_off);

// Log Hours
router.post('/job/:id/log-hours', hours_controller.log_hours);

// Remove Hour Log
router.post('/job/:id/remove-log/:logId', hours_controller.remove_log);

// Reset job
// router.post('/job/:id/reset-job', job_controller.reset_job);



// Email Invoice
// router.post('/invoice/:id/send-invoice', invoice_controller.pay_invoice, invoice_controller.email_invoice);

// Pay Invoice
// router.get('/invoice/:id/pay-invoice-local', invoice_controller.pay_invoice_local);



// //// SERVICE ROUTES ////

// Create Service Get
router.get('/create-service', service_controller.service_create_get);

// Create service Post
router.post('/create-service', service_controller.service_create_post);

// Delete service Post
router.post('/service/:id/delete', service_controller.service_delete);

// Update service Post
router.post('/service/:id/update', service_controller.service_update_post);

// Get one service
router.get('/service/:id', service_controller.service_detail);

// Get service list
router.get('/service-list', service_controller.service_list);

/////////// User Routes ////////////////

// Create user get
// router.get('/user-form', user_controller.user_create_get);

// Create user post
// router.post('/user-form', user_controller.user_create_post);

// Delete user post
// router.post('/user/:id/delete', user_controller.user_delete_post);

// Account info get
router.get('/update', user_controller.user_update_get);

// Update user post
router.post('/update', user_controller.user_update_post);

// Update employee post
router.post('/user/:id/update-employee', user_controller.employee_update_post);

// Change Password get
router.get('/change-password', user_controller.user_change_password_get);

// Change Password post
router.post('/change-password', user_controller.user_change_password_post);

// Business detail get
// router.get('/business-detail', user_controller.update_business_get)

// Busienss detail post
// router.post('/business-detail', user_controller.update_business_post)

// Get one user
router.get('/user/:id', user_controller.user_detail);

// Get list of all users
// router.get('/user-list', user_controller.user_list);


///////////////////// Material Routes //////////////

// Create material get
router.get('/create-material', material_controller.create_material_get)

// Create material post
router.post('/create-material', material_controller.create_material_post)

// Update material post
router.post('/material/:id/update', material_controller.update_material)

// Delete material post
router.post('/material/:id/delete', material_controller.material_delete)

// Get one Material
router.get('/material/:id', material_controller.material_detail);

// Get all materials
router.get('/material-list', material_controller.material_list);

///////////////////// Quote Routes //////////////

// Create quote get
router.get('/create-quote', quote_controller.create_quote_get);

// Create quote post
router.post('/create-quote', quote_controller.create_quote_post);

// Update quote post
router.post('/quote/:id/update', quote_controller.update_quote);

// Delete quote post
router.post('/quote/:id/delete', quote_controller.quote_delete);

// Get one quote
router.get('/quote/:id', quote_controller.quote_detail);

// Get all quotes
router.get('/quote-list', quote_controller.quote_list);

// Add Material to list
router.post('/quote/:id/add-material', quote_controller.add_material);

// Remove MAterial from list
router.post('/quote/:id/remove-material/:materialId', quote_controller.remove_material);

// New Material
router.post('/quote/:id/new-material', quote_controller.new_material);

// Add service to list
router.post('/quote/:id/add-service', quote_controller.add_service);

// Remove service from list
router.post('/quote/:id/remove-service/:serviceId', quote_controller.remove_service);

// New Service
router.post('/quote/:id/new-service', quote_controller.new_service);

// Add employee to list
router.post('/quote/:id/add-employee', quote_controller.add_employee);

// Remove employee from list
router.post('/quote/:id/remove-employee/:employeeId', quote_controller.remove_employee);

// Download PDF
router.get('/quote/:id/download', quote_controller.download);

// Send Email (sendgrid)
router.post('/quote/:id/send-email', quote_controller.send_email);

// Sign Off Quote
router.post('/quote/:id/sign-off', quote_controller.sign_off);

// Upload signature
router.post('/quote/:id/upload-signature', upload.single('base64Data'), quote_controller.upload_signature)

// Delete Signature
router.post('/quote/:id/delete-signature', quote_controller.delete_signature);

// Reset quote
// router.post('/quote/:id/reset-quote', quote_controller.reset_quote);


///////////////////// Invoice Routes //////////////

// Create invoice get
router.get('/create-invoice', invoice_controller.create_invoice_get);

// Create invoice post
router.post('/create-invoice', invoice_controller.create_invoice_post);

// Update invoice post
router.post('/invoice/:id/update', invoice_controller.update_invoice);

// Delete invoice post
router.post('/invoice/:id/delete', invoice_controller.invoice_delete);

// Get one invoice
router.get('/invoice/:id', invoice_controller.invoice_detail);

// Get all invoices
router.get('/invoice-list', invoice_controller.invoice_list);

// Add Material to list
router.post('/invoice/:id/add-material', invoice_controller.add_material);

// Remove Material from list
router.post('/invoice/:id/remove-material/:materialId', invoice_controller.remove_material);

// New Material
router.post('/invoice/:id/new-material', invoice_controller.new_material);

// Add service to list
router.post('/invoice/:id/add-service', invoice_controller.add_service);

// Remove service from list
router.post('/invoice/:id/remove-service/:serviceId', invoice_controller.remove_service);

// New Service
router.post('/invoice/:id/new-service', invoice_controller.new_service);

// Add employee to list
router.post('/invoice/:id/add-employee', invoice_controller.add_employee);

// Remove employee from list
router.post('/invoice/:id/remove-employee/:employeeId', invoice_controller.remove_employee);

// Download PDF
router.get('/invoice/:id/download', invoice_controller.download);

// Send Email (sendgrid)
router.post('/invoice/:id/send-email', invoice_controller.send_email);

// Send Email With Payment (sendgrid)
router.post('/invoice/:id/send-email-payment', stripe_controller.payment_link_email, invoice_controller.send_email_payment);

// Send Email Receipt (sendgrid)
router.post('/invoice/:id/send-email-receipt', invoice_controller.send_email_receipt);

// Sign Off invoice
router.post('/invoice/:id/sign-off', invoice_controller.sign_off);


// Log Hours
router.post('/invoice/:id/log-hours', invoice_controller.log_hours);

// Remove Hour Log
router.post('/invoice/:id/remove-log/:logId', invoice_controller.remove_log);

// Reset invoice
// router.post('/invoice/:id/reset-invoice', invoice_controller.reset_invoice);

//////////////// Image Routes ////////////////

// Get image list
// router.get('/image-list', image_controller.image_list);

// Get image detail
// router.get('/image/:id', image_controller.image_detail);

// Permanently delete
// router.post('/image/:id/delete', image_controller.permanently_delete);

// Upload Images
router.post('/quote/:id/upload-images', upload.array('images', 12), image_controller.upload_images);

// Delete Image
router.post('/quote/:quoteid/image/:imageid/delete', image_controller.delete_image);

// Upload Images (job)
router.post('/job/:id/upload-images', upload.array('images', 12), image_controller.upload_images_job);

// Delete Image (job)
router.post('/job/:jobid/image/:imageid/delete', image_controller.delete_image_job);

// Upload Images (invoice)
router.post('/invoice/:id/upload-images', upload.array('images', 12), image_controller.upload_images_invoice);

// Delete Image (invoice)
router.post('/invoice/:invoiceid/image/:imageid/delete', image_controller.delete_image_invoice);

// Upload Expense
router.post('/invoice/:id/upload-expense', upload.single('expense'), expense_controller.upload_expense);

// Delete Expense
router.post('/invoice/:invoiceid/expense/:expenseid/delete', expense_controller.delete_expense);

///////// Stripe Routes

// Create account
// router.post('/stripe/create-account', stripe_controller.create_account)

// Create Account Link
// router.post('/stripe/create-account-link', stripe_controller.create_account_link);

// Payment
// router.post('/invoice/:id/stripe/payment', stripe_controller.payment_link);

// Session 
// router.post('/invoice/:id/stripe/session', stripe_controller.session)
module.exports = router;