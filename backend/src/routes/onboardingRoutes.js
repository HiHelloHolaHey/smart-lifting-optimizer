const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, onboardingController.onboard);

module.exports = router;
