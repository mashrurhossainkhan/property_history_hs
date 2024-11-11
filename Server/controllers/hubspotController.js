const { getAccessToken, isAuthorized, getContact, getAccountInfo } = require('../auth/hubspotAuth');
const logger = require('../utils/logger'); // Add logger
const { get_all_packages } = require('./packageCotroller');
const { update_Payment_Info, insertIntoPayment } = require('./paymentController');
const { insertIntoSubscription } = require('./subscriptionController');
const { insertIntoUser } = require('./usercontroller');
const { createProperties } = require('./propertyController');
const {insertIntoSubscriptionAfterInstall} = require('./subscriptionController');
const { syncDeal } = require('./dataSyncController');
const axios = require('axios');

 //const BASE_URL = "http://localhost:3003";
 //const FRONTEND_URL = "http://localhost:3000";
//const BASE_URL = "https://hs-phone-number-formatter.vercel.app"

// Utility function to log with portal ID and email
const logWithDetails = (level, message, req) => {
  const portalId = req.session.portalId || 'unknown';
  const email = req.session.email || 'unknown';
  logger.log({ level, message, portalId, email });
};



exports.install = async (req, res) => {
  const authUrl =
        'https://app.hubspot.com/oauth/authorize' +
        `?client_id=${encodeURIComponent(process.env.CLIENT_ID)}` +
        `&scope=${encodeURIComponent(process.env.SCOPES)}` +
        `&redirect_uri=${encodeURIComponent(process.env.BACKEND_URL)+ "/oauth-callback"}`;
  res.redirect(authUrl);
  logWithDetails('info', 'Redirected user to HubSpot OAuth URL for installation', req);
};

exports.oauthCallback = async (req, res) => {
  //here will get the chargeID req.params
  const { exchangeForTokens } = require('../auth/hubspotAuth');
  if (req.query.code) {
    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.BACKEND_URL + '/oauth-callback',
      code: req.query.code
    };
    const token = await exchangeForTokens(req, authCodeProof);
    if (token.message) {
      logWithDetails('error', `Error during OAuth callback: ${token.message}`, req);
      return res.redirect(`/error?msg=${token.message}`);
    }
    logWithDetails('info', 'OAuth callback successful, redirecting to home', req);
    res.redirect(`/`);
  } else {
    logWithDetails('warn', 'OAuth callback received without a code', req);
    res.redirect('/error?msg=No%20code%20provided');
  }
};

exports.home = async (req, res) => {
  if (isAuthorized(req)) {
    const accessToken = await getAccessToken(req);
    const accInfo = await getAccountInfo(accessToken);
    let userInsertion = await insertIntoUser(accInfo);
    let paymentInsertion = await insertIntoPayment(userInsertion);
    const Subscription = require('../model/subscription.model');
    await createProperties(accessToken)
    
    // console.log("====> accInfo ===> "+ JSON.stringify(accInfo));
    //Todo:: Need to create new package for new user
    const packageId = "66dac9dd4ffd1188c309c0d4";
    let subsciptionInsertion = await  insertIntoSubscriptionAfterInstall(packageId,userInsertion._id)
    const subsciption_data = await Subscription.findOne({user:userInsertion._id})
    await syncDeal(subsciption_data)
    res.redirect(`${process.env.FRONTEND_URL}/welcome?portalID=${userInsertion.portalID}`);
    logWithDetails('info', 'Displayed home page with account info and access token', req);
  }
  //res.redirect(process.env.FRONTEND_URL);
}

exports.error = (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(`
    <h4>Error: ${req.query.msg}</h4>
    <footer>
      <p>&copy; 2024 <a href="https://www.hubxpert.com/">Hubxpert</a>. All rights reserved.</p>
    </footer>
  `);
  res.end();
  logWithDetails('error', `Displayed error page: ${req.query.msg}`, req);
};

//For testing purpose only
exports.session_for_postman = async(req,res) => {
  req.session.refresh_token = req.body.refresh_token;
  req.session.access_token = req.body.access_token;
  req.session.expires_in = req.body.expires_in;
  req.session.token_timestamp = Date.now();
  res.json("sesion set");
}
//For testing purpose only