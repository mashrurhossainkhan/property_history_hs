// stripeWebhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
/* 
stripe listen --forward-to localhost:3003/stripe/webhook
 */
let STRIPE_DATA_DB = {};
let payment_DATA_DB = {};
const logger = require('../../utils/logger');
let { charge, update_Payment_Info } = require('../paymentController');
const { updateUserInfoAfterPayment } = require('../usercontroller');

const endpointSecret = process.env.webhookEndpoint;

let stripeWebhook = async (request, response) => {
//   console.log("logging at webhook");
    const sig = request.headers[ 'stripe-signature' ];
    let event;
    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);

            // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const checkout_session_completed_data = event.data.object;
        // console.log("\t logging checkout.session.completed ");
        //console.log(checkout_session_completed_data);
        let custom_fields_array = checkout_session_completed_data.custom_fields;
        //console.log(custom_fields_array);
        STRIPE_DATA_DB.name = custom_fields_array[ 0 ].text.value;
        STRIPE_DATA_DB.companyName = custom_fields_array[ 1 ].text.value;
        STRIPE_DATA_DB.phoneNumber = custom_fields_array[ 2 ].text.value ? custom_fields_array[ 2 ].text.value : "";
        STRIPE_DATA_DB.email = checkout_session_completed_data.customer_details.email;
        STRIPE_DATA_DB.countryCode = checkout_session_completed_data.customer_details?.address?.country || '';
         
        const sessionsCompleted = await stripe.checkout.sessions.retrieve(
          checkout_session_completed_data.id
        );
        STRIPE_DATA_DB.portalId = sessionsCompleted.metadata.portalID;
        STRIPE_DATA_DB.packageId = sessionsCompleted.metadata.packageId;

        if(checkout_session_completed_data.amount_total == 0){
            // console.log();
            await updateUserInfoAfterPayment(STRIPE_DATA_DB.portalId, STRIPE_DATA_DB);
        }

        break;
      case 'payment_intent.succeeded':
          const paymentIntentSucceeded = event.data.object;
         /*  console.log("\t logging payment_intent.succeeded");
          console.log(paymentIntentSucceeded); */
          break;
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        payment_DATA_DB.email = chargeSucceeded.billing_details.email;
        payment_DATA_DB.name = chargeSucceeded.billing_details.name;
        payment_DATA_DB.phoneNumber = chargeSucceeded.billing_details.phoneNumber;
        payment_DATA_DB.chargeId = chargeSucceeded.id;
        payment_DATA_DB.amount = Number(chargeSucceeded.amount / 100); // Convert from cents
        payment_DATA_DB.currency = chargeSucceeded.currency;
        payment_DATA_DB.customer_id = chargeSucceeded.customer;
        payment_DATA_DB.invoice_id = chargeSucceeded.invoice;
        payment_DATA_DB.payment_method_details = chargeSucceeded.payment_method_details;
        payment_DATA_DB.receipt_url = chargeSucceeded.receipt_url;
        payment_DATA_DB.status = chargeSucceeded.status;
        payment_DATA_DB.payment_intent_id = chargeSucceeded.payment_intent;
        payment_DATA_DB.payment_method_id = chargeSucceeded.payment_method;
    
        // Retrieve session data using payment_intent to get the metadata
        const paymentIntent = chargeSucceeded.payment_intent;
        if (paymentIntent) {
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: paymentIntent,
            });
            
        if (sessions.data.length > 0) {
            const session = sessions.data[0];
            STRIPE_DATA_DB.portalId = session.metadata.portalID;
            STRIPE_DATA_DB.packageId = session.metadata.packageId;
            STRIPE_DATA_DB.StripePriceId = session.metadata.StripePriceId;
            // After fetching the data, proceed with updating

   
            if (STRIPE_DATA_DB.portalId && STRIPE_DATA_DB.packageId) {
              if (process.env.NODE_ENV == "DEV") {
                  const devIds = [
                      process.env.STRIPE_PRICE_ID_FREE_M_DEV,
                      process.env.STRIPE_PRICE_ID_STARTER_M_DEV,
                      process.env.STRIPE_PRICE_ID_STARTER_Y_DEV,
                      process.env.STRIPE_PRICE_ID_PRO_M_DEV,
                      process.env.STRIPE_PRICE_ID_PRO_Y_DEV,
                      process.env.STRIPE_PRICE_ID_PROPLUS_M_DEV,
                      process.env.STRIPE_PRICE_ID_PROPLUS_Y_DEV,
                      process.env.STRIPE_PRICE_ID_ENTERPRISE_M_DEV,
                      process.env.STRIPE_PRICE_ID_ENTERPRISE_Y_DEV
                  ];

                  // Check if STRIPE_DATA_DB.StripePriceId matches any of the DEV IDs
                  if (devIds.includes(STRIPE_DATA_DB.StripePriceId)) {
                      await updateUserInfoAfterPayment(STRIPE_DATA_DB.portalId, STRIPE_DATA_DB);
                      await update_Payment_Info(payment_DATA_DB, STRIPE_DATA_DB, STRIPE_DATA_DB.packageId,STRIPE_DATA_DB.portalId);
                  }
              }else if (process.env.NODE_ENV == "PROD") {
                  const prodIds = [
                    process.env.STRIPE_PRICE_ID_FREE_M_PROD,
                    process.env.STRIPE_PRICE_ID_STARTER_M_PROD,
                    process.env.STRIPE_PRICE_ID_STARTER_Y_PROD,
                    process.env.STRIPE_PRICE_ID_PRO_M_PROD,
                    process.env.STRIPE_PRICE_ID_PRO_Y_PROD,
                    process.env.STRIPE_PRICE_ID_PROPLUS_M_PROD,
                    process.env.STRIPE_PRICE_ID_PROPLUS_Y_PROD,
                    process.env.STRIPE_PRICE_ID_ENTERPRISE_M_PROD,
                    process.env.STRIPE_PRICE_ID_ENTERPRISE_Y_PROD
                ];
            
                // Check if STRIPE_DATA_DB.StripePriceId matches any of the DEV IDs
                if (prodIds.includes(STRIPE_DATA_DB.StripePriceId)) {
                    // Further work here
                    await updateUserInfoAfterPayment(STRIPE_DATA_DB.portalId, STRIPE_DATA_DB);
                    await update_Payment_Info(payment_DATA_DB, STRIPE_DATA_DB, STRIPE_DATA_DB.packageId,STRIPE_DATA_DB.portalId);
                }
              }
            } else {
                logger.info('Package ID or Portal ID was not found: webhook.');
            }
        } else {
            logger.error('No session found for the payment intent: webhook.');
        }
    } else {
        logger.error('No payment intent found for the charge: webhook.');
    }
    break;
   // ... handle other event types
      default:
        //   console.log(`Unhandled event type ${event.type}`);
  }
// Return a 200 response to acknowledge receipt of the event
  response.send();
    } catch (err) {
        console.log(err.raw);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
};

module.exports = {
    stripeWebhook,
    STRIPE_DATA_DB
};