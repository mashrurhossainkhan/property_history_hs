// // redisClient.js
// const fs = require('fs');
// const userModel = require('../../model/user.model');
// const subscriptionModel = require('../../model/subscription.model');
// const packagesModel = require('../../model/packages.model');
// const User = require('../../model/user.model');
// const Subscription = require('../../model/subscription.model');
// let countPhoneNumberApiCall = 0;
// let countCheckPhoneNumber = 0;
// const logger = require('../../utils/logger'); // Add logger
// let cache = [];


// const incrAsync = (portalID, funcName) => {
//     try{
//         if (funcName == "phoneNumber"){
//             let countOfGivenPortalID = cache.find(cache => cache.portalID === portalID);
//             if (countOfGivenPortalID){
//                 countPhoneNumberApiCall =  countOfGivenPortalID.countPhoneNumberApiCall + 1;
//             }else{
//                 countPhoneNumberApiCall=1;
//                 countCheckPhoneNumber = 0;
//             }
//             keysAsync(portalID, countPhoneNumberApiCall,countCheckPhoneNumber, "phoneNumber");

//         }else if (funcName == "checkPhoneNumber"){
//             //countCheckPhoneNumber
//             let countOfGivenPortalID_checkPhoneNumber = cache.find(cache => cache.portalID === portalID);
//             if (countOfGivenPortalID_checkPhoneNumber){
//                 countCheckPhoneNumber =  countOfGivenPortalID_checkPhoneNumber.countCheckPhoneNumber + 1;
//             }else{
//                 countCheckPhoneNumber=1;
//                 countPhoneNumberApiCall=0;
//             }
//             keysAsync(portalID, countPhoneNumberApiCall, countCheckPhoneNumber, "checkPhoneNumber");
//         }
//     }catch(error){
//         console.log(error);
//     }
// }

// const getAsync = () => {

//     fs.readFile('cache.json', 'utf8', (err, data) => {
//         if (err) {
//             console.error('Error reading cache.json:', err);
//             return;
//         }
//         try {
//             const cache = JSON.parse(data);

//             if(cache){
//                 cache.map ((data) => {
//                     updateAPICount(data.portalID, data.countPhoneNumberApiCall)
//                     CheckPhoneNumberUpdateAPICount(data.portalID, data.countCheckPhoneNumber)
//                 })
//                 clearJsonFile();
//             }
//         } catch (parseError) {
//             console.error('Error parsing JSON data:', parseError);
//         }
//     });
// }

// const getCacheData = () => {
//     return cache;
// }

// const keysAsync = async(portalID, countPhoneNumberApiCall,countCheckPhoneNumber, funcName) => {
//     const existingEntry = cache.find(entry => entry.portalID === portalID);
//     const User = await userModel.findOne({portalID: portalID});
//     const userSubscription = await subscriptionModel.findOne({user: User._id});
//     const userPackage = await packagesModel.findOne({_id: userSubscription.package});
//     if(funcName == "phoneNumber"){
//         // Check if the portalID already exists in the cache array
//         if (existingEntry) {
//             console.log('===countPhoneNumberApiCall===' + countPhoneNumberApiCall);
//             // If found, update the countPhoneNumberApiCall
//             existingEntry.countPhoneNumberApiCall = countPhoneNumberApiCall;
//         } else {
//             // If not found, push a new object into the array
//             cache.push({ portalID: portalID, countPhoneNumberApiCall: countPhoneNumberApiCall , countCheckPhoneNumber: countCheckPhoneNumber , limit: userPackage.Limit, 
//                 alreadyUsed: parseInt(userSubscription.apiCallCount) + parseInt(userSubscription.checkPhoneNumberApiCallCount)});
//         }
//         writeCacheToFile();
//         // Reset countPhoneNumberApiCall after updating
//         countPhoneNumberApiCall = 0;
//     }else if (funcName == "checkPhoneNumber"){
//          // Check if the portalID already exists in the cache array
//          if (existingEntry) {
//             // If found, update the countPhoneNumberApiCall
//             existingEntry.countCheckPhoneNumber = countCheckPhoneNumber;
//         } else {
//             // If not found, push a new object into the array
//             cache.push({ portalID: portalID, countPhoneNumberApiCall: countPhoneNumberApiCall, countCheckPhoneNumber: countCheckPhoneNumber , limit: userPackage.Limit, 
//                 alreadyUsed: parseInt(userSubscription.apiCallCount) + parseInt(userSubscription.checkPhoneNumberApiCallCount)});
//         }
//         writeCacheToFile();
//     }
// };

// const writeCacheToFile = () => {
//     // Convert the cache array to a JSON string
//     const jsonData = JSON.stringify(cache, null, 2); // null and 2 are used for pretty formatting

//     // Write the JSON string to a file
//     fs.writeFile('cache.json', jsonData, (err) => {
//         if (err) {
//             console.error('Error writing to cache.json:', err);
//         } else {
//             console.log('cache.json has been updated');
//         }
//     });
//     //getAsync();
// };

// const clearJsonFile = () => {
//     const emptyArray = [];

//     fs.writeFile('cache.json', JSON.stringify(emptyArray, null, 2), (err) => {
//         if (err) {
//             console.error('Error clearing cache.json:', err);
//         } else {
//             console.log('cache.json has been cleared');
//         }
//     });
//     cache = []
// };

// /*

// const updateAPICount = async (portalID, count) => {
//     try {
//       // Find the user by portalID
//       logger.info("---------------------logging at update API Count start-------------------");
//       logger.info("Portal id: "+ portalID);
//       const user = await User.findOne({ portalID: portalID });
//       logger.info("---------------------logging at update API Count end-------------------");
//       if (!user) {
//         console.log('User not found in updateAPICount');
//         return;
//       }
      
//       // Find the subscription and update the apiCallCount
//       const subscriptionInfoUpdate = await Subscription.findOneAndUpdate(
//         { user: user._id },
//         { $inc: { apiCallCount: parseInt(count) , totalApiCallCount: parseInt(count)} }, // Increment apiCallCount by 1 //total also increase
//         { new: true, upsert: false }  // upsert: false ensures it won't create a new document
//       );
  
//       if (!subscriptionInfoUpdate) {
//         console.log('Subscription not found');
//         return;
//       }
      
//       console.log('Updated subscription:', subscriptionInfoUpdate);
//     } catch (e) {
//       console.error('Error in condition function:', e);
//     }
//   };


//   const CheckPhoneNumberUpdateAPICount = async (portalID, count) => {
//     try {
//       // Find the user by portalID
//       logger.info("---------------------logging at CheckPhoneNumberUpdateAPICount start-------------------");
//       logger.info("Portal id: "+ portalID);
//       const user = await User.findOne({ portalID: portalID });
//       logger.info("---------------------logging at CheckPhoneNumberUpdateAPICount update API Count end-------------------");
//       if (!user) {
//         console.log('User not found in updateAPICount');
//         return;
//       }
      
//       // Find the subscription and update the apiCallCount
//       const subscriptionInfoUpdate = await Subscription.findOneAndUpdate(
//         { user: user._id },
//         { $inc: { checkPhoneNumberApiCallCount: parseInt(count) , checkPhoneNumberTotalApiCallCount: parseInt(count) } }, // Increment apiCallCount by 1 //total also increase
//         { new: true, upsert: false }  // upsert: false ensures it won't create a new document
//       );
  
//       if (!subscriptionInfoUpdate) {
//         console.log('Subscription not found');
//         return;
//       }
      
//       console.log('Updated subscription:', subscriptionInfoUpdate);
//     } catch (e) {
//       console.error('Error in condition function:', e);
//     }
//   };

// */
// module.exports = { incrAsync, getAsync, getCacheData };
