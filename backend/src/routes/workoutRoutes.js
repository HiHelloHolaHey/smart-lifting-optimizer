const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const verifyToken = require('../middleware/verifyToken');

// IMPORTANT: /next/:exerciseId MUST be before /:id to avoid Express
// matching the literal string "next" as a workout UUID
router.get('/next/:exerciseId', verifyToken, workoutController.getNextForExercise);
router.get('/', verifyToken, workoutController.getWorkouts);
router.get('/:id', verifyToken, workoutController.getWorkout);
router.put('/:id/sets/:setId', verifyToken, workoutController.updateSet);

module.exports = router;
