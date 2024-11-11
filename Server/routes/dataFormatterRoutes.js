const express = require('express');
const router = express.Router();
const dataFormatterController = require('../controllers/dataFormatterController');

const packageConditions = require('../controllers/Logic/packageConditions');

/**
 * @swagger
 * /format/check_phone_number:
 *   post:
 *     summary: Phone number checkker
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: number
 *     responses:
 *       200:
 *         description: Checked phone number
 *       500:
 *         description: Server error
 */
router.post('/check_phone_number', dataFormatterController.checkPhoneNumber);
router.post('/phone_number', dataFormatterController.phoneNumber); //phoneNumberWithoutAuth or phoneNumber

//router.put('/package_details_update', packageDetailsUpdate);

router.get('/get_country_code', dataFormatterController.getCountry);

router.post('/test', dataFormatterController.test)

// router.put('/bulk/update/phone_number',packageConditions.bulkPhoneNumberApiCallCount);
// router.put('/bulk/update/check_phone_number',packageConditions.bulk_Check_PhoneNumberApiCallCount);

router.put('/remove/cache/all',dataFormatterController.removeAllCache);


module.exports = router;
