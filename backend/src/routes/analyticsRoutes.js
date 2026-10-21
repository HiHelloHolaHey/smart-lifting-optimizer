const express = require('express');
const router = express.Router();
const c = require('../controllers/aiController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.get('/recovery', c.recovery);
router.get('/volume', c.volumeSummary);

module.exports = router;
