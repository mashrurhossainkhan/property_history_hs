const User = require('../model/user.model');
const Subscription = require('../model/subscription.model');
const { getAccessToken, isAuthorized, getContact, getAccountInfo } = require('../auth/hubspotAuth');
const packagesModel = require('../model/packages.model');
const logger = require('../utils/logger');
const ModelPayment = require('../model/payment.model');
const userModel = require('../model/user.model');
const { syncDeal } = require('./dataSyncController');

exports.insertIntoSubscriptionAfterPayment = async (packageID, userID) => {
    try{
         const startDate = new Date();
         const endDate = new Date();
         
 
         const userInfo = await User.findOne( {_id: userID});
         const packageInfo = await packagesModel.findOne( {_id: packageID});
         const subscriptionInfo = await Subscription.findOne( {user: userInfo._id});

         if(packageInfo.subscription == 'monthly'){
            endDate.setDate(startDate.getDate() + 30);
         }
         else if(packageInfo.subscription == 'yearly'){
            endDate.setDate(startDate.getDate() + 365);
         }
         
         if (!userInfo) {
             logger.error("User not found");
             return ({ error: 'User not found' });
         }
         else if (!packageInfo) {
             logger.error("Package information not found");
             return ({ error: 'Package information not found' });
         }
         if(subscriptionInfo){
            this.updateSubscriptionInfo(userInfo._id,packageID);
         }

         console.log("issue in free =======>"+ endDate.toISOString().split('T')[0]);
         if (userInfo && !subscriptionInfo) {
             //insert into Subscription model
             const subscribe = new Subscription({  
                 user: userInfo._id,
                 package: packageID,
                 //adding total API call count for any reference
                 totalApiCallCount: 0,
                 apiCallCount: 0,
                 checkPhoneNumberApiCallCount: 0,
                 checkPhoneNumberTotalApiCallCount: 0,
                 joiningDate: startDate.toISOString().split('T')[0],
                 packageStartDate: startDate.toISOString().split('T')[0],
                 packageEndDate: endDate.toISOString().split('T')[0],
                 hubspotDealId: ""
             });
             await subscribe.save();
             await syncDeal(subscribe);
            //  logger.info("Insert data in subscription model");
         }
     }catch(error){
         logger.info('Error in insertIntoSubscription: '+ error);
         return  error ;
     }
   }

  exports.updateSubscriptionInfo = async (userID, packageID) => {
        let startDate = new Date();
        const endDate = new Date();

        const package_info = await packagesModel.findOne({_id:packageID});
        const current_subscription_info = await Subscription.findOne({user: userID});

        if(package_info.subscription == 'monthly'){
            endDate.setDate(startDate.getDate() + 30);
         }
         else if(package_info.subscription == 'yearly'){
            endDate.setDate(startDate.getDate() + 365);
         }
      
        // logger.info("package information in updateSubscriptionInf: " + package_info);

        if(package_info.packageName == "Free" && current_subscription_info.package != "66dac9dd4ffd1188c309c0d4"){
            return ("You are not able to take free subscription again");
        }
        const subscriptionUpDate = await Subscription.findOneAndUpdate( //need to find problems here
            { user: userID},
            { $set:
                {
                    apiCallCount: 0,
                    package: packageID,
                    packageStartDate: startDate.toISOString().split('T')[0],
                    packageEndDate: endDate.toISOString().split('T')[0],  
                },
                
            },
            { new: true } 
          );
          await syncDeal(subscriptionUpDate);
         
        //   logger.info("Subscription information updated for user: "+ userID);
          return subscriptionUpDate;
  }

  
  exports.updateSubscription = async (req, res) => {
    if (isAuthorized(req)) {
        const accessToken = await getAccessToken(req);
        const accInfo = await getAccountInfo(accessToken);
        let startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);

        const userInfo = await User.findOne( {portalID: accInfo.portalId});
        if (!userInfo) {
            return res.status(404).json({ error: 'User not found' });
        }
        const subscriptionUpDate = await Subscription.findOneAndUpdate(
            { user: userInfo._id},
            { $set:
                {
                    package: req.body.packageID,
                    packageStartDate: startDate.toISOString().split('T')[0],
                    packageEndDate: endDate.toISOString().split('T')[0],
                    apiCallLimit: req.body.apiCallLimit //for only custom   
                },
                
            },
            { new: true } 
          );
        
          res.send(subscriptionUpDate);
    }
  }


//subscribe/getSubscriptionDetails
  exports.getSubscription = async (req, res) => {
       try{
        // logger.info("----portalID in /subscribe/getSubscriptionDetails: "+ JSON.stringify(req.query.portalID));
        const userInfo = await User.findOne( {portalID:req.query.portalID});
        // logger.info("----portalID in /subscribe/getSubscriptionDetails: "+ JSON.stringify(userInfo));
        if (!userInfo) {
            return res.status(404).json({ error: 'User not found' });
        }
        const subscriptionInfo = await Subscription.findOne( {user: userInfo._id});
        if (!subscriptionInfo) {
            return res.status(404).json({ error: 'You have not subscribed yet' });
        }
        // logger.info("----portalID in /subscribe/getSubscriptionDetails: "+ JSON.stringify(subscriptionInfo));
        return res.send(subscriptionInfo);
        }catch(error){
            return res.status(404).json(error);
        }
    }

    /* 
        test case:
        1. if today > enddate 
                1. if the status is cancelled => go to free version
                2. if status!=cancelled then update the apicallCount to 0, startDate and endDate
    */
exports.updateAutoSubsCription = async (req,res) => {
    try{
        const allSubscriprion = await Subscription.find();
        const today = new Date();
       
        
        allSubscriprion.map ((subsciption)=>{
            if (today >  (subsciption.packageEndDate)) {
                updateSubsAutoInfo(subsciption);
            }
        })
        
        res.send("updated");

    }catch (error){
        res.send(error);
    }
}

//need to work here
const updateSubsAutoInfo = async(subscriptionObj) =>{
    try{
        let startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        const findsubscripedUserDetails = await userModel.findOne({_id : subscriptionObj.user})
        // logger.info("---findsubscripedUserDetails---"+findsubscripedUserDetails.email)
        const paymentInfoByEmail = await ModelPayment.findOne({email: findsubscripedUserDetails.email}).sort({ createdAt: -1 });
        // logger.info("---paymentInfoByEmail---"+paymentInfoByEmail)
        if(paymentInfoByEmail.status == "cancelled"){
            const freePackageInfo = await packagesModel.findOne({packageName: "Free"})
            await Subscription.findOneAndUpdate(
                { _id: subscriptionObj._id},
                { $set:
                    {
                        apiCallCount: 0,
                        package: freePackageInfo._id,
                        packageStartDate: startDate.toISOString().split('T')[0],
                        packageEndDate: endDate.toISOString().split('T')[0],  
                    },
                    
                },
                { new: true } 
              );
            //   logger.info("switched to Free package, Information updated on :" + startDate);
        }else{
            await Subscription.findOneAndUpdate(
                { _id: subscriptionObj._id},
                { $set:
                    {
                        apiCallCount: 0,
                        packageStartDate: startDate.toISOString().split('T')[0],
                        packageEndDate: endDate.toISOString().split('T')[0],  
                    },
                    
                },
                { new: true } 
              );
            //   logger.info("Your package updated on :" + startDate);
        }
          return paymentInfoByEmail;
    }catch (error){
        logger.info("Error in CRON: " + error);
    }
   
}



   
exports.insertIntoSubscription = async (req, res) => {
   try{
        const startDate = new Date();
        const endDate = new Date();
        //endDate.setDate(startDate.getDate() + 30);
        // logger.info("PackageID in insertIntoSubscription packageID-------:"+ req.body.packageID)
        // logger.info("PackageID in insertIntoSubscription portalID-------:"+ req.body.portalID)

        const userInfo = await User.findOne( {portalID: req.body.portalID});
        const packageInfo = await packagesModel.findOne( {_id: req.body.packageID});

        if(packageInfo.subscription == 'monthly'){
            endDate.setDate(startDate.getDate() + 30);
         }
         else if(packageInfo.subscription == 'yearly'){
            endDate.setDate(startDate.getDate() + 365);
         }
        const subscriptionInfo = await Subscription.findOne( {user: userInfo._id});

      
        if (!userInfo) {
            logger.error("User not found");
            return res.status(404).json({ error: 'User not found' });
        }
        else if (!packageInfo) {
            logger.error("Package information not found");
            return res.json({ error: 'Package information not found' });
        }
        if(subscriptionInfo){
            await this.updateSubscriptionInfo(userInfo._id,req.body.packageID);
        }
        if (userInfo && !subscriptionInfo) {
            //insert into Subscription model
            const subscribe = new Subscription({  
                user: userInfo._id,
                package: req.body.packageID,
                //adding total API call count for any reference
                totalApiCallCount: 0,
                apiCallCount: 0,
                joiningDate: startDate.toISOString().split('T')[0],
                packageStartDate: startDate.toISOString().split('T')[0],
                packageEndDate: endDate.toISOString().split('T')[0],
            });
            await subscribe.save();
            logger.info("Insert data in subscription model");
        }
    }catch(error){
        logger.info('Error in insertIntoSubscription: '+ error );
        return error;
    }
  }

  exports.insertIntoSubscriptionAfterInstall = async (packageID,userID) => {
    try{
         const startDate = new Date();
         const endDate = new Date();
         const userInfo = await User.findOne( {_id: userID});
         const packageInfo = await packagesModel.findOne( {_id: packageID});
         const subscriptionInfo = await Subscription.findOne( {user: userInfo._id});

         if (!userInfo) {
            //  logger.error("User not found");
             return ({ error: 'User not found' });
         }
         else if (!packageInfo) {
             logger.error("Package information not found");
             return ({ error: 'Package information not found' });
         }
         if(subscriptionInfo){
            return ({ message: 'Already Exist' });
         }
         if (userInfo && !subscriptionInfo) {
             //insert into Subscription model
             const subscribe = new Subscription({  
                 user: userInfo._id,
                 package: packageID,
                 //adding total API call count for any reference
                 totalApiCallCount: 0,
                 apiCallCount: 0,
                 checkPhoneNumberApiCallCount: 0,
                 checkPhoneNumberTotalApiCallCount: 0,
                 joiningDate: startDate.toISOString().split('T')[0],
                 packageStartDate: startDate.toISOString().split('T')[0],
                 packageEndDate: endDate.toISOString().split('T')[0],
                 hubspotDealId: ""
             });
             await subscribe.save();
            //  logger.info("Insert data in subscription model");
         }
     }catch(error){
         logger.info('Error in insertIntoSubscription: '+ error);
         return  error ;
     }
   }