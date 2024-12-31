var express = require('express');
var router = express.Router();

const stripe_controller = require('../controllers/owner/stripeController');

// Session 
router.post('/:id/session', stripe_controller.session);

// Payment Link
router.get('/:id/payment', stripe_controller.payment_link);
router.post('/:id/payment', stripe_controller.payment_link);

// WebHook (connect)
router.post('/webhook', express.raw({ type: 'application/json' }), stripe_controller.webhook)

//Webhook (mine)
router.post('/app/webhook', express.raw({ type: 'application/json' }), stripe_controller.my_webhook)


// subscription session checkout
router.post('/subscription-checkout', stripe_controller.subscription_session);

// subscription session checkout
router.post('/subscription-checkout-discount', stripe_controller.subscription_session_discount);

// subscription session checkout
router.post('/subscription-checkout-no-trial', stripe_controller.subscription_session_no_trial);

// subscription session checkout
router.post('/subscription-checkout-annual', stripe_controller.subscription_session_annual);

// subscription session checkout
router.post('/subscription-checkout-annual-discount', stripe_controller.subscription_session_annual_discount);


// subscription session checkout
router.post('/subscription-checkout-no-trial-annual', stripe_controller.subscription_session_no_trial_annual);


// customer portal
router.post('/customer-portal', stripe_controller.create_portal_session);


module.exports = router;