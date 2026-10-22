const express = require('express');
const router = express.Router();
const c = require('../controllers/aiController');
const analytics = require('../controllers/analyticsController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.get('/recovery', c.recovery);
router.get('/volume', c.volumeSummary);
router.get('/summary', analytics.summary);
router.get('/profile-stats', analytics.profileStats);

module.exports = router;
