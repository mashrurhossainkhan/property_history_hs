const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');

router.post('/', userController.insertIntoUser);
router.get('/all', userController.getUser);
router.get('/profile/:portalID', userController.profile);
router.get('/getUserDetails/:id', userController.getUserByID);
router.put('/update', userController.updateUser);

module.exports = router;
