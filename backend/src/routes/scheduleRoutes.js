const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const calendarController = require('../controllers/calendarController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, scheduleController.getSchedule);
router.post('/generate', verifyToken, scheduleController.generateSchedule);
router.get('/export', verifyToken, calendarController.exportIcs);

module.exports = router;
