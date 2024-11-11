const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageCotroller');


router.get('/all', packageController.get_all_packages);
router.get('/:id', packageController.get_all_packages_by_id);


module.exports = router;
