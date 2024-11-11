const User = require('../model/user.model');
let logger = require('../utils/logger');
const { getAccessToken, isAuthorized, getContact, getAccountInfo } = require('../auth/hubspotAuth');

exports.insertIntoUser = async (user_info) => {
    try { 
        const userInfo = await User.findOne({ portalID: user_info.hub_id});
        // console.log("exist:",user_info)
        if (userInfo) {
            // If the user exists, update their information
            // userInfo.name = user_info.name || "";
            // userInfo.companyName = user_info.companyName || "";
             userInfo.email = user_info.user || User.email;
            // userInfo.phoneNumber = user_info.phoneNumber || "";
            userInfo.countryCode = user_info.countryCode || "";
            userInfo.accountType = user_info.accountType || "";
            userInfo.timeZone = user_info.timeZone || "";
            userInfo.companyCurrency = user_info.companyCurrency || "";
            userInfo.uiDomain = user_info.hub_domain || "";
            userInfo.dataHostingLocation = user_info.dataHostingLocation || "";
            userInfo.additionalCurrencies = user_info.additionalCurrencies || "";

            // Save the updated user
            await userInfo.save();
            // logger.info("user data inserted to mongo", User);
            return userInfo;
        }
        else{
            logger.info(user_info.hub_id + ' already exist');
            return "Cannot Insert data into User model";
        }
    } catch (error) {
        //console.log('Error inserting USER document:', error);
        return (error);
    }
}


exports.getUser = async (req,res) => {
    try {
        const users = await User.find();
        if (!users) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(users);
    } catch (error) {
        console.log(error);
    }
}

exports.profile = async (req, res) => {
    try{
        const portalId = (req.params.portalID); // Get the user ID from the URL parameter
      
        const userInfo = await User.findOne({ portalID: portalId }); // Find the user by ID
        if (!userInfo) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        return res.send(userInfo);
    }catch (err) {
        res.send('Not Logged In'+ err);
    }
}

exports.getUserByID = async (req, res) => {
    const userId = req.params.id; // Get the user ID from the URL parameter
    // console.log(req.params);
    const userInfo = await User.findOne({ _id: userId }); // Find the user by ID
    if (!userInfo) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.send(userInfo);
};


exports.updateUserInfoAfterPayment = async(portalID, chargeData) => {
    try{
        console.log("--------in updateUserInfoAfterPayment 28 AUG====="+ JSON.stringify(chargeData));
        const userInfoUpDate = await User.findOneAndUpdate(
            { portalID: portalID },
            {
                $set:
                {
                    name: chargeData.name,
                    phoneNumber: chargeData.phoneNumber,
                    companyName: chargeData.companyName,
                    countryCode: chargeData.countryCode
                },
            },
            { new: true }
        );
        if (!userInfoUpDate) {
            return 'User not found';
        }
        //return res.redirect("http://localhost:3000")
        return userInfoUpDate;
    }catch(error){
        return error;
    }
}
//user/update
exports.updateUser = async (req, res) => {
    // console.log(req.body);
    try {
        const userInfoUpDate = await User.findOneAndUpdate(
            { portalID: req.body.portalID },
            {
                $set:
                {
                    name: req.body.name,
                    email: req.body.email,
                    phoneNumber: req.body.phoneNumber,
                    companyName: req.body.companyName,
                    countryCode: req.body.countryCode,
                },
            },
            { new: true }
        );
        if (!userInfoUpDate) {
            return res.status(404).json({ error: 'User not found' });
        }
        //return res.redirect("http://localhost:3000")
        return res.status(200).json(userInfoUpDate);
    } catch (error) {
        return res.status(400).json(error);
    }
};