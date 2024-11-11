const express = require('express');
const router = express.Router();
const hubspotController = require('../controllers/hubspotController');

router.get('/install', hubspotController.install);
router.get('/oauth-callback', hubspotController.oauthCallback);
router.get('/', hubspotController.home);
router.get('/error', hubspotController.error);
router.get('/test-session', hubspotController.session_for_postman);//for testing purpose only

module.exports = router;
