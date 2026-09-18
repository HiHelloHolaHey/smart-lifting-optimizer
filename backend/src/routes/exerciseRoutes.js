const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const verifyToken = require('../middleware/verifyToken');

// POST /api/exercises/swap  { exercise_id }
router.post('/swap', verifyToken, exerciseController.swapExercise);

// GET /api/exercises/:id/alternatives  (frontend-friendly REST style)
router.get('/:id/alternatives', verifyToken, exerciseController.swapExerciseById);

module.exports = router;
