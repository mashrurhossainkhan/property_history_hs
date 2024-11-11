const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.post('/user', subscriptionController.insertIntoSubscription); // /subscibe/user
router.get('/getSubscription', subscriptionController.getSubscription);
router.put('/update', subscriptionController.updateSubscription);
router.post('/update/everyday/check',subscriptionController.updateAutoSubsCription);

module.exports = router;
