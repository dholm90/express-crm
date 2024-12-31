const stripe = require('stripe')(process.env.STRIPE_TEST_SK);


exports.account = await stripe.accounts.create({ type: 'standard' });


exports.accountLink = async (accountId) => {
  await stripe.accountLinks.create({
    account: '{{CONNECTED_ACCOUNT_ID}}',
    refresh_url: '/',
    return_url: '/',
    type: 'account_onboarding',
  });
}

exports.session = async () => {

  await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [{ price: '{{PRICE_ID}}', quantity: 1 }],
      payment_intent_data: { application_fee_amount: 30 },
      success_url: '/',
      cancel_url: '/',
    },
    { stripeAccount: '{{CONNECTED_ACCOUNT_ID}}' }
  );
}

exports.paymentIntent = async (amt) => {
  await stripe.paymentIntents.create({
    amount: amt,
    currency: 'cad',
    automatic_payment_methods: { enabled: true },
    application_fee_amount: 30
  }, {
    stripeAccount: '{{CONNECTED_STRIPE_ACCOUNT_ID}}',
  });
}
