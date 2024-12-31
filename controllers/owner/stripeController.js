const Invoice = require('../../models/invoice');
const User = require('../../models/user');
const Business = require('../../models/business')
const Material = require('../../models/material');
const Service = require('../../models/service')
const Client = require('../../models/client');
const stripe = require('stripe')(process.env.STRIPE_TEST_SK);

exports.subscription_session = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE,
          // For metered billing, do not pass quantity
          quantity: 1,

        },
      ],
      mode: 'subscription',
      success_url: `https://bearquotes.com/dashboard`,
      cancel_url: `https://bearquotes.com/subscribe`,
      subscription_data: {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
        trial_period_days: 30,
      },
      payment_method_collection: 'if_required',
      allow_promotion_codes: true
    });

    business.sessionId = session.id;
    // business.subscription = 'BASIC';
    business.stripeCustomerId = session.customer;
    // console.log(business);
    // console.log(session)
    business.save()

    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(303, session.url);


  } catch (err) {
    return next(err)
  }
}
exports.subscription_session_annual = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ANNUAL,
          // For metered billing, do not pass quantity
          quantity: 1,

        },
      ],
      mode: 'subscription',
      success_url: `https://bearquotes.com/dashboard`,
      cancel_url: `https://bearquotes.com/subscribe`,
      subscription_data: {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
        trial_period_days: 30,
      },
      payment_method_collection: 'if_required',
      allow_promotion_codes: true
    });

    business.sessionId = session.id;
    // business.subscription = 'BASIC';
    business.stripeCustomerId = session.customer;
    // console.log(business);
    // console.log(session)
    business.save()

    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(303, session.url);


  } catch (err) {
    return next(err)
  }
}
exports.subscription_session_no_trial = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE,
          // For metered billing, do not pass quantity
          quantity: 1,

        },
      ],

      mode: 'subscription',
      success_url: `https://bearquotes.com/dashboard`,
      cancel_url: `https://bearquotes.com/subscribe`,
      allow_promotion_codes: true,
    });
    business.sessionId = session.id;
    business.stripeCustomerId = session.customer;
    // business.subscription = 'BASIC';
    business.save()
    // console.log(business);

    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(303, session.url);
  } catch (err) {
    return next(err)
  }
}
exports.subscription_session_no_trial_annual = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ANNUAL,
          // For metered billing, do not pass quantity
          quantity: 1,

        },
      ],

      mode: 'subscription',
      success_url: `https://bearquotes.com/dashboard`,
      cancel_url: `https://bearquotes.com/subscribe`,
      allow_promotion_codes: true,
    });
    business.sessionId = session.id;
    business.stripeCustomerId = session.customer;
    // business.subscription = 'BASIC';
    business.save()
    // console.log(business);

    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(303, session.url);
  } catch (err) {
    return next(err)
  }
}

exports.subscription_session_discount = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE,
          // For metered billing, do not pass quantity
          quantity: 1,

        },
      ],

      mode: 'subscription',
      discounts: [{
        coupon: process.env.STRIPE_50_OFF,
      }],
      success_url: `https://bearquotes.com/dashboard`,
      cancel_url: `https://bearquotes.com/subscribe`,
    });
    business.sessionId = session.id;
    business.stripeCustomerId = session.customer;
    // business.subscription = 'BASIC';
    business.save()
    // console.log(business);

    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(303, session.url);
  } catch (err) {
    return next(err)
  }
}
exports.subscription_session_annual_discount = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ANNUAL,
          // For metered billing, do not pass quantity
          quantity: 1,

        },
      ],
      discounts: [{
        coupon: process.env.STRIPE_45_OFF,
      }],
      mode: 'subscription',
      success_url: `https://bearquotes.com/dashboard`,
      cancel_url: `https://bearquotes.com/subscribe`,
    });
    business.sessionId = session.id;
    business.stripeCustomerId = session.customer;
    // business.subscription = 'BASIC';
    business.save()
    // console.log(business);

    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(303, session.url);
  } catch (err) {
    return next(err)
  }
}

exports.create_portal_session = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);

    // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
    // Typically this is stored alongside the authenticated user in your database.
    // const session_id = business.sessionId;
    // console.log(session_id)
    // const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
    // console.log(checkoutSession.customer)
    // business.stripeCustomerId = checkoutSession.customer;
    // business.save();
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = 'https://bearquotes.com/dashboard/business-detail';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: returnUrl,
    });
    // console.log(portalSession.url)
    await res.redirect(303, portalSession.url);
  } catch (err) {
    return next(err)
  }
}

exports.create_account = async (req, res, next) => {
  try {
    const createAccount = await stripe.accounts.create({ type: 'standard' });
    const business = await Business.findById(req.user.business);

    if (business.stripeAcctID === null) {
      business.stripeAcctID = await createAccount.id;
      business.save();
    }

    const accountLink = await stripe.accountLinks.create({
      account: business.stripeAcctID,
      return_url: `https://bearquotes.com/dashboard`,
      refresh_url: `https://bearquotes.com/dashboard/business-detail`,
      type: 'account_onboarding',
    });
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(accountLink.url)
  } catch (err) {
    return next(err)
  }
}

exports.create_account_link = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business)
    const accountLink = await stripe.accountLinks.create({
      account: business.stripeAcctID,
      return_url: `https://bearquotes.com/dashboard`,
      refresh_url: `https://bearquotes.com/dashboard/business-detail`,
      type: 'account_onboarding',
    });
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.redirect(accountLink.url)
  } catch (err) {
    return next(err)
  }

}

exports.payment_link = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]);
    const total = Math.round(invoice.total * 100)
    let product = '';
    if (invoice.stripeProduct == null) {
      product = await stripe.products.create(
        {
          name: invoice.title,
        }, { stripeAccount: business.stripeAcctID }
      );
      invoice.stripeProduct = product.id
      invoice.save()
    }
    product = invoice.stripeProduct;

    const price = await stripe.prices.create({
      currency: 'cad',
      unit_amount: total,
      product: product
    }, { stripeAccount: business.stripeAcctID }
    )
    const paymentLink = await stripe.paymentLinks.create(
      {
        currency: 'cad',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        application_fee_amount: 70,
      },
      { stripeAccount: business.stripeAcctID }
    );
    invoice.paymentLink = paymentLink.url;
    invoice.save()
    res.redirect(paymentLink.url)
  } catch (err) {
    return next(err)
  }

}

exports.payment_link_email = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]);
    const total = Math.round(invoice.total * 100)
    let product = '';
    if (invoice.stripeProduct == null) {
      product = await stripe.products.create(
        {
          name: invoice.title,
        }, { stripeAccount: business.stripeAcctID }
      );
      invoice.stripeProduct = product.id
      invoice.save()
    }
    product = invoice.stripeProduct;

    const price = await stripe.prices.create({
      currency: 'cad',
      unit_amount: total,
      product: product
    }, { stripeAccount: business.stripeAcctID }
    )
    const paymentLink = await stripe.paymentLinks.create(
      {
        currency: 'cad',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        application_fee_amount: 70,
      },
      { stripeAccount: business.stripeAcctID }
    );
    invoice.paymentLink = paymentLink.url;
    invoice.save()
    next()
  } catch (err) {
    return next(err)
  }

}

exports.session = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.business);
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.user.business }).populate([{ path: 'materials.material', model: Material }, { path: 'employees', model: User }, { path: 'client', model: Client }, { path: 'services.service', model: Service }]);
    const total = Math.round(invoice.total * 100)
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              unit_amount: total,
              currency: 'cad',
              product_data: {
                name: `Invoice: ${invoice.title}`
              },

            },
            quantity: 1,
          },
        ],
        payment_intent_data: { application_fee_amount: 70 },
        success_url: 'https://bearquotes.com/dashboard',
        cancel_url: 'https://bearquotes.com/dashboard',
      },
      { stripeAccount: business.stripeAcctID }
    );
    invoice.sessionUrl = session.url;
    invoice.save()
    // console.log(invoice)
    await res.redirect(session.url)
  } catch (err) {
    return next(err)
  }
}

exports.webhook = (req, res, next) => {
  const endpointSecret = process.env.STRIPE_CONNECT_KEY;
  let event = req.body;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      // console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }

  const handleSessionPaid = async (session) => {
    const paymentStatus = session.payment_status;
    const invoice = await Invoice.findOne({ sessionUrl: session.url })
    if (paymentStatus == 'paid') {
      invoice.isActive = false;
      await invoice.save()
    }
    return
  }

  const handleAccountUpdated = async (account) => {
    const chargesEnabled = account.charges_enabled;
    const detailsSubmitted = account.details_submitted;
    const business = await Business.findOne({ stripeAcctID: account.id });

    account

    if (detailsSubmitted === true) {
      business.detailsSubmitted = true;
      await business.save()
    }
    // check if the account has charges enabled
    if (chargesEnabled === true) {
      // if so, update busienss model.chargesEnabled
      business.chargesEnabled = true;
      await business.save()
    }
    return
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // console.log(session)
      handleSessionPaid(session)
      // console.log(session)
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      break;
    case 'account.updated':
      const account = event.data.object;
      handleAccountUpdated(account);
      break;
    default:
    // Unexpected event type
    // console.log(`Unhandled event type ${event.type}.`);
  }
  res.send()
}

exports.my_webhook = (req, res, next) => {
  const endpointSecret = process.env.STRIPE_ACCOUNT_KEY;
  let event = req.body;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }
  }

  const handleSessionCompleted = async (session) => {
    const paymentStatus = session.payment_status;
    // let business = {
    //   subscription: null
    // }
    session;
    // console.log(paymentStatus, session.id)
    const business = await Business.findOne({ sessionId: session.id })
    // business.hasTrialed = true;
    if (paymentStatus == 'paid') {
      business.subscription = 'BASIC';
      await business.save()
      business.stripeCustomerId = session.customer
      await business.save()
      business.hasTrialed = true;
      await business.save()
    }


    return
  }
  const handleSubscriptionDeleted = async (data) => {
    const business = await Business.findOne({ stripeCustomerId: data.customer });
    if (business) {
      business.subscription = 'NONE'
      await business.save();
      // console.log(data)
    }
    return

  }

  const dataObject = event.data.object;
  switch (event.type) {

    case 'checkout.session.completed':
      const session = event.data.object;
      // console.log(session)
      handleSessionCompleted(session)
      // console.log(session)
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      break;
    case 'customer.subscription.deleted':
      // data = event.data.object;
      handleSubscriptionDeleted(dataObject)
      break;
    case 'customer.subscription.created':
      // console.log(dataObject)
      break;
    case 'invoice.paid':
      // mark business as hasTrialed
      // handleInvoicePaid(dataObject);
      // console.log(dataObject)
      break;
    case 'customer.subscription.updated':
      // data = event.data.object;
      // handleSubscriptionDeleted(dataObject)
      break;
    case 'account.updated':
      const account = event.data.object;
      // handleAccountUpdated(account);
      break;
    default:
    // Unexpected event type
    // console.log(`Unhandled event type ${event.type}.`);
  }
  res.send()
}