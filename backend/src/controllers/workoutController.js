const workoutModel = require('../models/workoutModel');
const workoutSetModel = require('../models/workoutSetModel');
const progressiveOverloadService = require('../services/progressiveOverloadService');

const getWorkouts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const workouts = await workoutModel.findWorkoutsByUser(userId);
    res.status(200).json(workouts);
  } catch (error) {
    next(error);
  }
};

const getWorkout = async (req, res, next) => {
  try {
    const workoutId = req.params.id;
    const workout = await workoutModel.findWorkoutById(workoutId);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    // ensure user owns it
    if (workout.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(200).json(workout);
  } catch (error) {
    next(error);
  }
};

const updateSet = async (req, res, next) => {
  try {
    const setId = req.params.setId;
    const updates = req.body; // weight_kg, reps, completed
    const updated = await workoutSetModel.updateSet(setId, updates);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

const getNextForExercise = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const exerciseId = parseInt(req.params.exerciseId);
    const suggestion = await progressiveOverloadService.calculateNextSession(userId, exerciseId);
    res.status(200).json(suggestion);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkouts,
  getWorkout,
  updateSet,
  getNextForExercise
};
