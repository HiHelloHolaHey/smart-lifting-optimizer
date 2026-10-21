const workoutModel = require('../models/workoutModel');
const workoutSetModel = require('../models/workoutSetModel');
const workoutLogModel = require('../models/workoutLogModel');
const progressiveOverloadService = require('../services/progressiveOverloadService');
const db = require('../config/db');

const VALID_STATUS = ['scheduled', 'active', 'completed', 'skipped'];

/** Loads a workout and verifies ownership; sends the error response itself and returns null on failure. */
const loadOwned = async (req, res) => {
  const workout = await db.oneOrNone('SELECT * FROM workouts WHERE id = $1', [req.params.id]);
  if (!workout) {
    res.status(404).json({ error: 'Workout not found' });
    return null;
  }
  if (workout.user_id !== req.user.id) {
    res.status(403).json({ error: 'Unauthorized' });
    return null;
  }
  return workout;
};

const getWorkouts = async (req, res, next) => {
  try {
    const workouts = await workoutModel.findWorkoutsByUser(req.user.id);
    res.status(200).json(workouts);
  } catch (error) {
    next(error);
  }
};

const getWorkout = async (req, res, next) => {
  try {
    const workout = await workoutModel.findWorkoutById(req.params.id);
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    if (workout.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const [notes, previous] = await Promise.all([
      workoutLogModel.findByWorkout(workout.id),
      workoutLogModel.getPreviousPerformance(req.user.id, workout.id),
    ]);
    workout.notes_by_exercise = Object.fromEntries(notes.map((n) => [n.exercise_id, n.exercise_notes || '']));
    workout.previous = previous;
    res.status(200).json(workout);
  } catch (error) {
    next(error);
  }
};

const updateSet = async (req, res, next) => {
  try {
    const { setId, id } = req.params;
    const owned = await db.oneOrNone(
      `SELECT ws.id FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
       WHERE ws.id = $1 AND w.id = $2 AND w.user_id = $3`,
      [setId, id, req.user.id]
    );
    if (!owned) return res.status(404).json({ error: 'Set not found' });

    // Whitelist: never interpolate client-provided keys into SQL
    const updates = {};
    if (req.body.weight_kg !== undefined) updates.weight_kg = req.body.weight_kg === '' ? null : Number(req.body.weight_kg);
    if (req.body.reps !== undefined) updates.reps = req.body.reps === '' ? null : parseInt(req.body.reps, 10);
    if (req.body.completed !== undefined) {
      updates.completed = Boolean(req.body.completed);
      updates.completed_at = updates.completed ? new Date() : null;
    }
    if (req.body.set_type !== undefined) {
      if (!['warmup', 'working'].includes(req.body.set_type)) return res.status(400).json({ error: 'Invalid set_type' });
      updates.set_type = req.body.set_type;
    }
    if ((updates.weight_kg !== undefined && Number.isNaN(updates.weight_kg)) || (updates.reps !== undefined && Number.isNaN(updates.reps))) {
      return res.status(400).json({ error: 'Invalid weight or reps' });
    }

    res.status(200).json(await workoutSetModel.updateSet(setId, updates));
  } catch (error) {
    next(error);
  }
};

const addSet = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    const exerciseId = parseInt(req.body.exercise_id, 10);
    const setType = req.body.set_type === 'warmup' ? 'warmup' : 'working';
    if (!exerciseId) return res.status(400).json({ error: 'exercise_id is required' });

    const { next_number } = await db.one(
      `SELECT COALESCE(MAX(set_number), 0) + 1 AS next_number FROM workout_sets
       WHERE workout_id = $1 AND exercise_id = $2 AND set_type = $3`,
      [workout.id, exerciseId, setType]
    );
    const created = await db.one(
      `INSERT INTO workout_sets (workout_id, exercise_id, weight_kg, reps, set_number, set_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [workout.id, exerciseId, req.body.weight_kg ?? null, req.body.reps ?? null, next_number, setType]
    );
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (!VALID_STATUS.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    res.status(200).json(await workoutModel.updateWorkoutStatus(workout.id, req.body.status));
  } catch (error) {
    next(error);
  }
};

const saveNotes = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    const exerciseId = parseInt(req.params.exerciseId, 10);
    const notes = String(req.body.notes ?? '').slice(0, 2000);
    res.status(200).json(await workoutLogModel.upsertNotes(workout.id, exerciseId, notes));
  } catch (error) {
    next(error);
  }
};

const getNextForExercise = async (req, res, next) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId, 10);
    const suggestion = await progressiveOverloadService.calculateNextSession(req.user.id, exerciseId);
    res.status(200).json(suggestion);
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkouts, getWorkout, updateSet, addSet, updateStatus, saveNotes, getNextForExercise };
