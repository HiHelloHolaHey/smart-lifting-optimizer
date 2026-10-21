const express = require('express');
const router = express.Router();
const c = require('../controllers/aiController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.post('/pre-workout-brief', c.preWorkoutBrief);
router.post('/smart-swap', c.smartSwap);
router.post('/generate-routine', c.generateRoutine);

module.exports = router;
