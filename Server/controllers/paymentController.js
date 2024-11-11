const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('../model/payment.model');
const logger = require('../utils/logger'); // Add logger
const axios = require('axios');
const packagesModel = require('../model/packages.model');
const userModel = require('../model/user.model');
const subscriptionModel = require('../model/subscription.model');
const { insertIntoSubscriptionAfterPayment } = require('./subscriptionController');
const { updateUserInfoAfterPayment } = require('./usercontroller');


exports.createCheckoutSession = async (req, res) => {
  // logger.info("logging at /package/createCheckoutSession ");
  const packageId = req.params.id;
  const portalID = req.params.portalID;
  const selectedPackage = await packagesModel.findOne({_id: req.params.id}); //getting information from mongodb packageModel
  /*
  const stripePrices = await stripe.prices.list(); //getting all price information from stripe
  console.log("stripePricesstripePricesstripePricesstripePrices== "+ JSON.stringify(stripePrices));
  const filteredStripePrice = stripePrices.data.filter(priceObj =>parseInt(priceObj.unit_amount) === parseInt((selectedPackage.price) * 100));;//filtering from stripe data with price of packageModel findOne
  */
  var StripePriceId;
    if(selectedPackage.packageName == "Free" && selectedPackage.duration == '30'){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId = process.env.STRIPE_PRICE_ID_FREE_M_DEV;
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_FREE_M_PROD; 
    }
    else if(selectedPackage.packageName == "Starter" && selectedPackage.duration == '30'){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId = process.env.STRIPE_PRICE_ID_STARTER_M_DEV;
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_STARTER_M_PROD; 
    }
    else if(selectedPackage.packageName == "Starter" && selectedPackage.duration == '365'){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId = process.env.STRIPE_PRICE_ID_STARTER_Y_DEV;
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_STARTER_Y_PROD; 
    }
    else if(selectedPackage.packageName == "Pro" && selectedPackage.duration == '30' ){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId = process.env.STRIPE_PRICE_ID_PRO_M_DEV; //price_1Pt3xCDHdwuTmpiw8530r5z2
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_PRO_M_PROD; 
    }
    else if(selectedPackage.packageName == "Pro" && selectedPackage.duration == '365' ){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId =  process.env.STRIPE_PRICE_ID_PRO_Y_DEV;
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_PRO_Y_PROD;
  }
    else if(selectedPackage.packageName == "Pro Plus" && selectedPackage.duration == '30'){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId = process.env.STRIPE_PRICE_ID_PROPLUS_M_DEV;
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_PROPLUS_M_PROD;
    }
    else if(selectedPackage.packageName == "Pro Plus" && selectedPackage.duration == '365'){
      if(process.env.NODE_ENV == "DEV")
        StripePriceId = process.env.STRIPE_PRICE_ID_PROPLUS_Y_DEV;
      else if(process.env.NODE_ENV == "PROD")
        StripePriceId = process.env.STRIPE_PRICE_ID_PROPLUS_Y_PROD;
  }
  else if(selectedPackage.packageName == "Enterprise" && selectedPackage.duration == '30'){
    if(process.env.NODE_ENV == "DEV")  
      StripePriceId = process.env.STRIPE_PRICE_ID_ENTERPRISE_M_DEV;
    else if(process.env.NODE_ENV == "PROD")
      StripePriceId = process.env.STRIPE_PRICE_ID_ENTERPRISE_M_PROD;
  }
  else if(selectedPackage.packageName == "Enterprise" && selectedPackage.duration == '365'){
    if(process.env.NODE_ENV == "DEV")
      StripePriceId = process.env.STRIPE_PRICE_ID_ENTERPRISE_Y_DEV;
    else if(process.env.NODE_ENV == "PROD")
      StripePriceId = process.env.STRIPE_PRICE_ID_ENTERPRISE_Y_PROD;
  }else{
    const stripePrices = await stripe.prices.list(); //getting all price information from stripe
    const filteredStripePrice = stripePrices.data.filter(priceObj =>parseInt(priceObj.unit_amount) === parseInt((selectedPackage.price) * 100));
    StripePriceId = filteredStripePrice[0].id;
  }

  try {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: StripePriceId,
            quantity: 1,
          },
        ],
        custom_fields: [
          {
            key: 'name',
            label: {
              type: 'custom',
              custom: 'Full Name',
            },
            type: 'text',
          },
          {
            key: 'company',
            label: {
              type: 'custom',
              custom: 'Company Name',
            },
            type: 'text',
          },
          {
            key: 'phone',
            label: {
              type: 'custom',
              custom: 'Phone Number',
            },
            type: 'text',
            optional: true,
          },
        ],
        mode: (selectedPackage.packageName == "Free") ? 'payment' : 'subscription',
        success_url: `${process.env.SUCCESS_URL_STRIPE}`,
        cancel_url: `${process.env.CANCEL_URL_STRIPE}`,
        metadata: {
          StripePriceId: StripePriceId,
          portalID: portalID, 
          packageId: packageId  // Store the session ID in the metadata
        },
      });

    if(selectedPackage.packageName == "Free"){
      await zeroDollarInfo(session,portalID,packageId);
    }

    // logger.info("-------Session whole -----------" + JSON.stringify(session));
    
    res.redirect(303, session.url);
  } catch (error) {
    console.log(error);
  }
}


exports.insertIntoPayment = async (user_data) => {
  try{
    // logger.info("insert into payment----insertIntoPayment: " + JSON.stringify(user_data));
    
    const existingPayment = await PaymentModel.findOne({
      user: user_data._id,
      portalID: user_data.portalID
    });

    if (existingPayment) {
      // logger.info("Payment record already Created for user: " + user_data._id);
      return; // Exit the function without creating a new record
    }

    const transaction = new PaymentModel({
      user : user_data._id,
      status: "due",
      portalID :  user_data.portalID
    });
      await transaction.save();
      
  }catch (error){
    logger.info("Something went wrong in insertIntoPayment: " + error);
  }
}

//code stripe main ends
exports.charge = async (charge_data) => {
try{
  // logger.info("--------getting information from stripe---------" + charge_data);
  /*
  usa case: logged out user changing pro to enterprise
    1. find all payments history from mongoDB of email ID
    2. if found, set status to cancelled
    3. cancel stripe subscription as well using the email address
  */
  const paymentInfoByEmail = await PaymentModel.findOne({email: charge_data.email}).sort({ createdAt: -1 });
  // logger.info("---paymentInfoByEmail in charge function---" + paymentInfoByEmail);
  // logger.info("----Information in Charge (stripe information)----" + charge_data)
  if(paymentInfoByEmail){
    
    const paymentInfoUpdate = await PaymentModel.findOneAndUpdate(
      { email: charge_data.email},
      { $set:
          {
            status: "cancelled", 
          },
          
      },
      { new: true } 
    );
    
    // logger.info("All previous Subscriptions has been cancelled for user: "+ charge_data.email+ "paymentInfoUpdate: "+ paymentInfoUpdate);
    // logger.info("Calling ${BACKEND_URL}/charge/cancel/${charge_data.email} in charge function");
    //next subscription cancel in stripe
    await axios.get(`${process.env.BACKEND_URL}/charge/cancel/${charge_data.email}`);
  }
  
  global.stripeEmail = charge_data.email;
  
  const transaction = new PaymentModel(
    charge_data
  );
    await transaction.save();
    // logger.info("---insertion in payment Model: "+ transaction);
    // logger.info("Payment info saved with global.stripeEmail (stripe information)===== " + global.stripeEmail)
  } catch (error) {
    logger.info("error in Charge function in paymentController: " + error)
  }
};

exports.cancel_subscription = async(req,res) =>{
  try{
    //should get the invoice number
    const paymentInfo = await PaymentModel.findOne({ portalID: req.params.portalID }).sort({ createdAt: -1 })
    if(!paymentInfo){
      res.send("Payment information not found!");
    }
    const chargeInfo = await stripe.invoices.retrieve(paymentInfo.invoice_id);
    const subscriptionCancel = await stripe.subscriptions.cancel(chargeInfo.subscription);
    // logger.info("------------cancel_subscription paymentInfo-----------"+paymentInfo);
    // logger.info("------------cancel_subscription subscriptionCancel-----------"+subscriptionCancel);
    // logger.info("------------cancel_subscription chargeInfo-----------"+chargeInfo);
    await updatePaymentSuccessCancel(req,res,paymentInfo._id, req.params.portalID);
    res.send(subscriptionCancel);
  }catch(error){
    logger.info("----------error in cancelling subscription------------"+ error)
    res.send("Something went wrong!")
  }
}


exports.update_Payment_Info = async (chargeData, extraChargeData, packageID, portalID) => {
  try {
    // logger.info("Information in update_Payment_Info=====:::" + JSON.stringify(chargeData));
    // logger.info("Information in update_Payment_Info=====:::extraChargeDataextraChargeData" + JSON.stringify(extraChargeData));
    // logger.info("Information in update_Payment_Info=====:::" + portalID);
    
    const payment_Info = await PaymentModel.findOne({portalID: portalID});
    if (!payment_Info) {
      return { error: 'Payment Info not found' };
    }

    const currentTransactionDetails = {
      email: payment_Info.email,
      chargeId: payment_Info.chargeId,
      amount: payment_Info.amount,
      totalAmount: payment_Info.totalAmount,
      currency: payment_Info.currency,
      customer_id: payment_Info.customer_id,
      invoice_id: payment_Info.invoice_id,
      payment_method_details: payment_Info.payment_method_details,
      receipt_url: payment_Info.receipt_url,
      status: payment_Info.status,
      updatedAt: payment_Info.updatedAt  // Capture the last update time
    };

    // Use spread operator to append the current transaction to the previous_payment_details array
    const updatedPreviousPaymentDetails = [
      ...payment_Info.previous_payment_details,  // Spread the existing array
      currentTransactionDetails                  // Add the new transaction details
    ];

  const paymentUpdate = await PaymentModel.findOneAndUpdate(
      { portalID: portalID },
      {
        $set: {
          email: chargeData.email,
          chargeId: chargeData.chargeId,
          amount: chargeData.amount,
          previous_payment_details: updatedPreviousPaymentDetails,
          currency: chargeData.currency,
          customer_id: chargeData.customer_id,
          invoice_id: chargeData.invoice_id,
          payment_method_details: chargeData.payment_method_details,
          receipt_url: chargeData.receipt_url,
          status: "successed",
        },
        $inc: { totalAmount:chargeData.amount },
    },
    { new: true, upsert: false }
    );
    await insertIntoSubscriptionAfterPayment(packageID,paymentUpdate.user);
    //await updateUserInfoAfterPayment(portalID, extraChargeData);
    // console.log(paymentUpdate);
    return paymentUpdate;
    
  } catch (error) {
    console.error('Error in update_Payment_Info:', error);
    return  error ;
  }
};


const zeroDollarInfo = async(session, portalID,packageId) =>{
  try{
    const paymentInfoUpdate = await PaymentModel.findOneAndUpdate(
      { portalID: portalID},
      {
        $set: {
          "chargeId": session.id,
          "amount": 0,
          "currency" :"usd",
          "customer_id": "Update Your Plan",
          "invoice_id": "Update Your Plan",
          "payment_method_details": {"details": "update your plan"},
          "receipt_url": "update your plan",
          "status": "Free package"
        },
    },
    { new: true, upsert: false }
    );
    const user = await userModel.findOne({portalID: portalID});
    //inserting into subscription mongodb
    await insertIntoSubscriptionAfterPayment( packageId, user._id);
     return paymentInfoUpdate;
  }catch (error){
    console.log(error);
  }
}

exports.get_payment_info_user = async (req,res) => {
  // logger.info("Logging at /get_payment_info_user" + JSON.stringify(req.params.portalID));
  try{
    const payment_Info = await PaymentModel.findOne({ portalID:req.params.portalID }).sort({ createdAt: -1 });
    // console.log("Logging at /get_payment_info_user: "+ JSON.stringify(payment_Info));
    res.json((payment_Info));
  }catch (error){
    res.send(error);
  }
}

const updatePaymentSuccessCancel = async (req,res, id, portalID) => {
  // logger.info("Logging at /updatePaymentSuccess");
  try {
    const payment_Info = await PaymentModel.findOne({ _id: id });
    if (!payment_Info) {
      return { error: 'Payment Info not found' };
    }
  const paymentUpdateCancel = await PaymentModel.findOneAndUpdate(
      { _id: id},
      {
        $set: {
          status: "cancelled",
        },
    },
    { new: true, upsert: false }
    );

    const userInfo = await userModel.findOne({portalID:portalID });
    const subscription_to_free1 = await subscriptionModel.findOne({user: userInfo._id})

    const subscription_to_free = await subscriptionModel.findOneAndUpdate({user: userInfo._id},
          {
        $set: {
          package: "66ba2cf16343bea38ef334ba",
          apiCallCount: 0,
          checkPhoneNumberApiCallCount: 0
        },
    })

    // logger.info("----------paymentUpdateCancel-----------"+ paymentUpdateCancel);
    return paymentUpdateCancel;
  } catch (error) {
    console.error('Error in update_Payment_Info:', error);
    return  error ;
  }
}

//charging free user if remained
/*
exports.chargeRemainedFree = async (req, res) =>{
  try{
    const apiCallCount = req.params.apiCallCount;
    const portalID = req.params.portalID;

    const userInfo = await userModel.findOne({portalID:portalID});
    const findFreePackage = await packagesModel.findOne({packageName: "Free"});
  
    await subscriptionModel.findOneAndUpdate(
      { user: userInfo._id},
      { $set:
          {
              apiCallCount: 0,
              package: findFreePackage._id,

          },
          
      },
      { new: true } 
    );
    res.redirect (`${process.env.FRONTEND_URL}/profile`)
  }catch (error){
    res.send("Error in chargeRemainedFree: " + error)
  }
}
  */