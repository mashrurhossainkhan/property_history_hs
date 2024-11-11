const axios = require('axios');
const qs = require('qs');
const logger = require('../utils/logger'); // Add logger
const User = require('../model/user.model');
// const BASE_URL = "http://localhost:3000";
// const BASE_URL = "https://hs-app-lemon.vercel.app"
// const BASE_URL = "https://app.dataformatter.my.id"
const BASE_URL = process.env.BACKEND_URL

const getTokenHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
};

const exchangeForTokens = async (req, exchangeProof) => {
  try {
    const url_encoded_string = qs.stringify(exchangeProof);
    const responseBody = await axios.post('https://api.hubapi.com/oauth/v1/token', url_encoded_string, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
    });
    const tokens = responseBody.data;
    const userRes = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${tokens.access_token}`);
    const portalID = userRes.data.hub_id;
    let user = await User.findOne({ portalID });
    if (!user) {
        user = new User({
            portalID: portalID,
            refreshToken: tokens.refresh_token,
            accessToken: tokens.access_token,
            expiresIn: tokens.expires_in,
            name:  "",
            companyName:  "",
            email: "",
            phoneNumber:  "",
            countryCode:  "",
            accountType: "",
            timeZone: "",
            companyCurrency:  "",
            uiDomain:   "",
            dataHostingLocation:  "",
            additionalCurrencies:  "",
        });
    } else {
        user.refreshToken = tokens.refresh_token;
        user.accessToken =  tokens.access_token;
        user.expiresIn = tokens.expires_in;
    }
    await user.save();

    req.session.refresh_token = tokens.refresh_token;
    req.session.access_token = tokens.access_token;
    req.session.expires_in = tokens.expires_in;
    req.session.token_timestamp = Date.now();

    logger.info(`Received access token and refresh token for session: ${req.sessionID}`);
    return tokens.access_token;
  } catch (e) {
    logger.error(`Error exchanging ${exchangeProof.grant_type} for access token: ${e.response ? e.response.data : e.message}`);
    return { message: e.response ? e.response.data.message : e.message };
  }
};

const refreshAccessToken = async (req) => {
  const refreshTokenProof = {
    grant_type: 'refresh_token',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: BASE_URL + '/oauth-callback',
    refresh_token: req.session.refresh_token
  };
  return await exchangeForTokens(req, refreshTokenProof);
};

const getAccessToken = async (req) => {
  const tokenAge = Date.now() - req.session.token_timestamp;
  const tokenLifetime = req.session.expires_in * 1000;

  if (tokenAge >= tokenLifetime) {
    await refreshAccessToken(req);
  }
  return req.session.access_token;
};

const isAuthorized = (req) => {
  return !!req.session.refresh_token;
};

const getContact = async (accessToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    const result = await axios.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all', { headers });
    return result.data[0];
  } catch (e) {
    logger.error(`Unable to retrieve contact: ${e.message}`);
    return parseErrorResponse(e);
  }
};

const getAccountInfo = async (accessToken) => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    const result = await axios.get(`https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`, { headers });
    return result.data; // This should include email, user ID, etc.
  } catch (e) {
    logger.error(`Unable to retrieve account info: ${e.message}`);
    return parseErrorResponse(e);
  }
};

const parseErrorResponse = (error) => {
  try {
    return JSON.parse(error.response.body);
  } catch (parseError) {
    logger.error(`Error parsing response: ${parseError.message}`);
    return { status: 'error', message: 'An error occurred', details: error.message };
  }
};

module.exports = {
  exchangeForTokens,
  getAccessToken,
  isAuthorized,
  getContact,
  getAccountInfo,
  refreshAccessToken
};