

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const logger = require('../../utils/logger'); // Add logger
const packagesModel = require('../../model/packages.model');
const { isAuthorized } = require('../../auth/hubspotAuth');
const userModel = require('../../model/user.model');
const subscriptionModel = require('../../model/subscription.model');
const paymentModel = require('../../model/payment.model');


exports.customUserCreatePrice = async (req,res) => {
    /*
        setup custom user:
        1. Get the custom request
        2. create a stripe product manually named 'custom_{price}'
        3. send the stripe payment link to the user (Subscription type)
        4. after payment, find the 1. customer_id  2. invoice_id  3.receipt_url 4.chargeid; in transaction of stripe dashboard (find using email)
        5. after subscription: insert the informations in mongodb using the following
            1.set the sessions
                post request : http://localhost:3003/charge/custom/create
                in req.body:
                1. price  2.portalID  3. email 4.name  5. companyName  6. phoneNumber 7.countryCode 
                8.accountType 9.timeZone 10. dataHostingLocation 11. chargeId  
                12. customer_id  13. invoice_id  14.receipt_url 15. Limit
    */
    try{

        //create user for custom
          //create package for custom
          const findPackageInfo = await packagesModel.findOne({packageName: `custom_${req.body.uiDomain}`});
          const userInfofound = await userModel.findOne({portalID: req.body.portalID});

       if(!findPackageInfo){
        const package_modelInsertion = new packagesModel({
          packageName: `custom_${req.body.uiDomain}`,
          price: req.body.price,
          duration: req.body.duration,
          Limit: req.body.Limit,
          subscription: "custom"
        })
        await package_modelInsertion.save();
 
       }
 

        if(!userInfofound){
          const user_Insertion = new userModel({
            email: req.body.email,
            name: req.body.name,
            companyName: req.body.companyName || "",
            phoneNumber: req.body.phoneNumber || "",
            countryCode: req.body.countryCode || "",
            portalID: req.body.portalID,
            accountType: req.body.accountType || "",
            timeZone: req.body.timeZone || "",
            companyCurrency: "usd",
            uiDomain: "app.hubspot.com",
            dataHostingLocation: req.body.dataHostingLocation || ""
          })
          await user_Insertion.save();
        }else{
          // logger.info(`User information already in mongoDB for custom user ${req.body.portalID} and price: ${req.body.price}`);
        }

        //create subscription in custom
        const findUser = await userModel.findOne({portalID: req.body.portalID}); //getting this after user insertion if not found
        const findPackage = await packagesModel.findOne({packageName: `custom_${req.body.uiDomain}`}); //getting this for same
        let startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        if(!userInfofound){
            const subscription_modelInsertion = new subscriptionModel({
                user: findUser._id,
                package: findPackage._id,
                apiCallCount: 0,
                totalApiCallCount: 0,
                joiningDate: startDate.toISOString().split('T')[0],
                packageStartDate: startDate.toISOString().split('T')[0],
                packageEndDate: endDate.toISOString().split('T')[0],
          })
          await subscription_modelInsertion.save();
        }else{
          // logger.info(`Custom price ${req.body.price } found in user Model, updating subsctiption data`);
          await subscriptionModel.findOneAndUpdate(
            { user: findUser._id},
            { $set:
                {
                    apiCallCount: 0,
                    package: findPackage._id,
                    packageStartDate: startDate.toISOString().split('T')[0],
                    packageEndDate: endDate.toISOString().split('T')[0],  
                },
                
            },
            { new: true } 
          );
          // logger.info("Subscription information updated for user: "+ req.body.portalID);
        }
        const payment_Info = await paymentModel.findOne({portalID: req.body.portalID});

        if(!payment_Info){
          const payment_insertion = new paymentModel({
            email: findUser.email,
            chargeId: req.body.chargeId,
            amount: req.body.price,
            totalAmount: req.body.price,
            portalID: req.body.portalID,
            currency: "usd",
            customer_id: req.body.customer_id,
            invoice_id: req.body.invoice_id,
            receipt_url: req.body.receipt_url,
            payment_method_details: req.body.payment_method_details,
            status: "success"
          })
          await payment_insertion.save();
        }else{
          const currentTransactionDetails = {
            email: payment_Info.email,
            chargeId: payment_Info.chargeId,
            amount: payment_Info.amount,
            totalAmount: (payment_Info.totalAmount) || "",
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
      
        const paymentUpdate = await paymentModel.findOneAndUpdate(
            { portalID: req.body.portalID },
            {
              $set: {
                email: req.body.email,
                chargeId: req.body.chargeId,
                amount: req.body.price,
                previous_payment_details: updatedPreviousPaymentDetails,
                currency: req.body.currency,
                customer_id: req.body.customer_id,
                invoice_id: req.body.invoice_id,
                payment_method_details: req.body.payment_method_details,
                receipt_url: req.body.receipt_url,
                status: "successed",
              },
              $inc: { totalAmount:req.body.price },
          },
          { new: true, upsert: false }
          );
        }
        
         //create payment information for custom
        // logger.info("Insert data in package_model and stripe_insertion for custom user price: "+ req.body.price);
        res.send("custom user created");
    }catch (err){
      res.status(400).send({ error: err.message });
    }
  }
  