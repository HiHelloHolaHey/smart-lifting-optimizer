const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const verifyToken = require('../middleware/verifyToken');

// IMPORTANT: /next/:exerciseId MUST be before /:id to avoid Express
// matching the literal string "next" as a workout UUID
router.get('/next/:exerciseId', verifyToken, workoutController.getNextForExercise);
router.get('/', verifyToken, workoutController.getWorkouts);
router.get('/:id', verifyToken, workoutController.getWorkout);
router.put('/:id/status', verifyToken, workoutController.updateStatus);
router.patch('/:id/reschedule', verifyToken, workoutController.rescheduleWorkout);
router.post('/:id/start', verifyToken, workoutController.startWorkout);
router.post('/:id/finish', verifyToken, workoutController.finishWorkout);
router.post('/:id/discard', verifyToken, workoutController.discardWorkout);
router.post('/:id/exercises', verifyToken, workoutController.addExercise);
router.delete('/:id/exercises/:exerciseId', verifyToken, workoutController.removeExercise);
router.post('/:id/sets', verifyToken, workoutController.addSet);
router.put('/:id/sets/:setId', verifyToken, workoutController.updateSet);
router.put('/:id/exercises/:exerciseId/notes', verifyToken, workoutController.saveNotes);
router.put('/:id/exercises/:exerciseId/swap', verifyToken, workoutController.swapExercise);

module.exports = router;
