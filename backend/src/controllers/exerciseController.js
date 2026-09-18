const swapService = require('../services/swapService');

// POST /swap  { exercise_id or exerciseId }
const swapExercise = async (req, res, next) => {
  try {
    const exerciseId = parseInt(req.body.exercise_id ?? req.body.exerciseId);
    if (isNaN(exerciseId)) return res.status(400).json({ error: 'Valid exercise_id required' });
    const alternatives = await swapService.findAlternatives(exerciseId);
    res.status(200).json(alternatives);
  } catch (error) {
    next(error);
  }
};

// GET /:id/alternatives  (REST-style from frontend)
const swapExerciseById = async (req, res, next) => {
  try {
    const exerciseId = parseInt(req.params.id);
    if (isNaN(exerciseId)) return res.status(400).json({ error: 'Valid exercise id required' });
    const alternatives = await swapService.findAlternatives(exerciseId);
    res.status(200).json(alternatives);
  } catch (error) {
    next(error);
  }
};

module.exports = { swapExercise, swapExerciseById };
