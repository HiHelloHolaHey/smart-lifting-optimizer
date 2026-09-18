const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const verifyToken = require('../middleware/verifyToken');

router.post('/generate', verifyToken, scheduleController.generateSchedule);

module.exports = router;
