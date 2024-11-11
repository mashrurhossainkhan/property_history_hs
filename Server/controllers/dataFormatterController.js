const { parsePhoneNumberFromString, isValidPhoneNumber, AsYouType } = require('libphonenumber-js');
const countries = require('i18n-iso-countries');
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
const { refreshAccessToken, getAccessToken, isAuthorized, getContact, getAccountInfo } = require('../auth/hubspotAuth');
const logger = require('../utils/logger'); // Add logger
const userModel = require('../model/user.model');
const paymentModel = require('../model/payment.model');
const { updateAPICount, packageCondition, CheckPhoneNumberpackageCondition, CheckPhoneNumberUpdateAPICount } = require('./Logic/packageConditions');
const redisClient = require('./Logic/bulkCountInsertion');
const axios = require('axios');

let CheckPhoneNumberCallCache = new Map();

//////////////////////// PHONE NUMBER //////////////////////////
const DEFAULT_COUNTRY = 'US';
const MIN_PHONE_NUMBER_LENGTH = 7;
const MAX_PHONE_NUMBER_LENGTH = 15;

const getCountryCode = (country, country_text) => {
  if (country_text) {
    // Check if country_text is a valid country code
    const countryCodes = countries.getAlpha2Codes();
    if (countryCodes[country_text.toUpperCase()]) {
      return country_text.toUpperCase();
    }

    // Check if country_text is a full country name
    const countryNames = countries.getNames("en");
    const foundCode = Object.keys(countryNames).find(code => countryNames[code].toLowerCase() === country_text.toLowerCase());
    if (foundCode) {
      return foundCode;
    }
  }

  if (country) {
    // Check if country is a valid country code
    const countryCodes = countries.getAlpha2Codes();
    if (countryCodes[country.toUpperCase()]) {
      return country.toUpperCase();
    }

    // Check if country is a full country name
    const countryNames = countries.getNames("en");
    const foundCode = Object.keys(countryNames).find(code => countryNames[code].toLowerCase() === country.toLowerCase());
    if (foundCode) {
      return foundCode;
    }
  }

  // Default to US if no valid country code is found
  return DEFAULT_COUNTRY;
};

exports.phoneNumber = async (req, res) => {
  //change in phone Number function
  const { phoneNumber, country, country_text, hs_object_id } = req.body;
  let propertyName = req.body.propertyName;
  try {
    let check = await packageCondition(req.body.portalID); //get portalId, totalAPICALLS, user_package.Limit, canPass here
    // Fetch the user and payment info
    const User = await userModel.findOne({ portalID: req.body.portalID });
    const paymentInfo = await paymentModel.findOne({ portalID: req.body.portalID }).sort({ createdAt: -1 });

    if (!check) {//!check.canPass
      return res.status(200).json({
        "outputFields": {
          "Message": "API Limit Exceeded",
          "hs_execution_state": "FAILED"
        }
      });
    }
    if (paymentInfo && paymentInfo.status == "cancelled") {
      return res.status(200).json({
        "outputFields": {
          "Message": "API Limit Exceeded",
          "hs_execution_state": "FAILED"
        }
      });
    }
    else if (check) { //check.canPass
      check = false; //due to server gettign check true sometimes
      await updateAPICount(req.body.portalID);
      const formattedNumber = formatPhoneNumber(phoneNumber, country, country_text);
      
      if(formattedNumber!="Invalid phone number length" && formattedNumber!="Invalid phone number"){
        await updateContactProperty("pf_formatted_phone_number_14082001", formattedNumber, hs_object_id,
          User.accessToken, req, User.refreshToken);
  
        if (propertyName) {
          await updateContactProperty(propertyName, formattedNumber, hs_object_id, User.accessToken, req,
            User.refreshToken);
        }
      }
    
      res.json({
        "outputFields": {
          "Formatted_Phone_Number": formattedNumber,
          "hs_execution_state": "SUCCESS"
        }
      });
    } else {
      res.json({
        "outputFields": {
          "Message": "Upgrade your plan",
          "hs_execution_state": "SUCCESS"
        }
      });
    }
  } catch (error) {
    res.json({
      "outputFields": {
        "Message": "Invalid",
        "hs_execution_state": "SUCCESS"
      }
    });
  }
};

const formatPhoneNumber = (phoneNumber, country, country_text) => {
  const countryCode = getCountryCode(country, country_text);

  // Remove extension part if exists
  const extensionMatch = phoneNumber.match(/(ext\.?|extension)\s?(\d+)/i);
  const mainPhoneNumber = extensionMatch ? phoneNumber.replace(extensionMatch[0], '').trim() : phoneNumber;

  // Remove all non-digit characters from the main phone number
  const sanitizedPhoneNumber = mainPhoneNumber.replace(/\D+/g, '');

  // Check if the phone number length is within the valid range
  if (sanitizedPhoneNumber.length < MIN_PHONE_NUMBER_LENGTH || sanitizedPhoneNumber.length > MAX_PHONE_NUMBER_LENGTH) {
    return 'Invalid phone number length'
  }

  let parsedNumber = parsePhoneNumberFromString(sanitizedPhoneNumber, countryCode);
  if (!parsedNumber || !parsedNumber.isValid()) {
    // Attempt to format the number as it is typed
    parsedNumber = new AsYouType(countryCode).input(sanitizedPhoneNumber);
    parsedNumber = parsePhoneNumberFromString(parsedNumber, countryCode);
  }

  if (parsedNumber && parsedNumber.isValid()) {
    return parsedNumber.formatInternational().replace(/\s+/g, '');
  }

  return 'Invalid phone number';
};


//Country code
exports.getCountry = async (req, res) => {
  try {
    const countryCodes = countries.getAlpha2Codes();
    const countryNames = countries.getNames("en");

    const options = Object.keys(countryCodes).map(code => ({
      value: code,
      label: countryNames[code]
    }));

    res.json({ options });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};



/////////////////////// Check Phone Number START //////////////////////////////////
const checkPhoneNumber = (phoneNumber, country) => {

  // Check if the phone number contains hyphens
  if (/-/.test(phoneNumber)) {
    return 'Hyphen in the Number';
  }

  // Check if the phone number contains brackets
  if (/\(|\)/.test(phoneNumber)) {
    return 'Bracket in the Number';
  }


  // Check if the phone number contains any other non-digit text (excluding the '+' symbol)
  if (/\D/.test(phoneNumber.replace('+', '').replace('.', '').replace('-', '').replace('*', ''))) {
    return 'Contains Text or Special Characters';
  }

  // Check if the phone number contains non-numeric text (excluding the '+' symbol)
  if (/[^\d\+\s\-()]/.test(phoneNumber)) {
    return 'Contains Invalid Characters';
  }


  // Check if the phone number contains spaces
  if (/\s/.test(phoneNumber)) {
    return 'Space in the Number';
  }

  // Check if the phone number contains any other non-digit text (excluding the '+' symbol)
  if (/\D/.test(phoneNumber.replace('+', ''))) {
    return 'Contains Text or Special Characters';
  }

  // Remove all non-digit characters
  const sanitizedPhoneNumber = phoneNumber.replace(/\D+/g, '');

  // Check if the phone number length is within the valid range
  if (sanitizedPhoneNumber.length < MIN_PHONE_NUMBER_LENGTH) {
    return 'Too Short';
  }
  if (sanitizedPhoneNumber.length > MAX_PHONE_NUMBER_LENGTH) {
    return 'Too Long';
  }

  const parsedNumber = parsePhoneNumberFromString(phoneNumber);

  // Check if country correctly matches
  if (country) {
    const countryCode = getCountryCode(country, null)
    if (countryCode !== undefined && parsedNumber) {
      // console.log(countryCode)
      if (parsedNumber.country != countryCode) {
        return 'Country Mismatch';
      }
    }
  }

  // Check if the phone number includes a country code
  if (!parsedNumber || !parsedNumber.country) {
    return 'No Country Code';
  }

  // Check if the phone number is valid
  if (!parsedNumber.isValid()) {
    return 'Invalid';
  }

  return 'Correctly Formatted';
};

//cache code commit:https://github.com/TeamHubxpert/HPU-PhoneNumberFortmatter/commit/673d6ff6470bd1bcb4ae66ad950a8f8154939e77
exports.checkPhoneNumber = async (req, res) => {
  const { phoneNumber, country, portalID, hs_object_id, object } = req.body;
  let propertyName = req.body.propertyName;

  const check = await packageCondition(req.body.portalID); //get portalId, totalAPICALLS, user_package.Limit, canPass here

  // Fetch the user and payment info
  const User = await userModel.findOne({ portalID: req.body.portalID });
  const paymentInfo = await paymentModel.findOne({ portalID: req.body.portalID }).sort({ createdAt: -1 });

  if (!check) {
    return res.status(200).json({
      "outputFields": {
        "quality": "API Limit Exceeded",
        "hs_execution_state": "FAILED"
      }
    });
  }
  if (paymentInfo && paymentInfo.status == "cancelled") {
    return res.status(200).json({
      "outputFields": {
        "quality": "You have cancelled your subscription",
        "hs_execution_state": "FAILED"
      }
    });
  }
  else if (check) {
    //console.log("checking is fine in check phone number" + check);
    await CheckPhoneNumberUpdateAPICount(req.body.portalID);
    //incrementAPICount(req.body.portalID, "checkPhoneNumber");

    if (!phoneNumber) {
      return res.status(200).json({
        "outputFields": {
          "quality": "Empty",
          "hs_execution_state": "SUCCESS"
        }
      });
    }

    const result = checkPhoneNumber(phoneNumber, country);


    await updateContactProperty("pf_phone_number_quality_14082001", result,
      hs_object_id, User.accessToken, req, User.refreshToken);
    //  save value in users property if provided 
    if (propertyName) {
      await updateContactProperty(propertyName, result, hs_object_id, User.accessToken,
        req, User.refreshToken);
    }
    return res.status(200).json({
      "outputFields": {
        "quality": result,
        "hs_execution_state": "SUCCESS"
      }
    });
  }
};
/////////////////////// Check Phone Number END //////////////////////////////////

const updateContactProperty = async (propertyName, value, contactId, token, req, refresh_token) => {
  try {
    const response = await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        properties: {
          [propertyName]: value
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // console.log('Contact updated:', response.data);
  } catch (error) {
    if (error.response && error.response.data.category === 'EXPIRED_AUTHENTICATION') {
      // console.log('Token expired, refreshing access token...');
      try {
        req.session.refresh_token = refresh_token;
        const newTokenData = await refreshAccessToken(req);

        // console.log('Retrying with new access token...');
        const retryResponse = await axios.patch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
          {
            properties: {
              [propertyName]: value
            }
          },
          {
            headers: {
              Authorization: `Bearer ${newTokenData}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // console.log('Contact updated on retry:', retryResponse.data);
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError.response ? refreshError.response.data : refreshError.message);
      }
    } else {
      console.error('Error updating contact:', error.response ? error.response.data : error.message);
    }
  }
};


///////////////TEST ROUTE///////////////////////////
exports.test = async (req, res) => {
  // console.log(req.body)
  res.status(200).json({ message: 'Test Route', "REQBODY": req.body });
}
///////////////TEST ROUTE END/////////////////////////


exports.removeAllCache = async () => {
  //   console.log(
  //     "removing CheckPhoneNumberCallCache" + JSON.stringify(CheckPhoneNumberCallCache)
  //   );
  CheckPhoneNumberCallCache.clear();
}