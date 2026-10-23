const workoutModel = require('../models/workoutModel');
const workoutSetModel = require('../models/workoutSetModel');
const workoutLogModel = require('../models/workoutLogModel');
const onermModel = require('../models/onermModel');
const progressiveOverloadService = require('../services/progressiveOverloadService');
const db = require('../config/db');

// 'active' and 'completed' go through start/finish so timestamps stay consistent
const VALID_STATUS = ['scheduled', 'skipped'];

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
      `SELECT ws.id, ws.completed, w.status FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
       WHERE ws.id = $1 AND w.id = $2 AND w.user_id = $3`,
      [setId, id, req.user.id]
    );
    if (!owned) return res.status(404).json({ error: 'Set not found' });

    const wantsLog = req.body.completed === true || req.body.completed === 'true';
    if (wantsLog && owned.status !== 'active') {
      return res.status(409).json({ error: 'Start the workout before logging sets.', code: 'NOT_STARTED' });
    }
    const touchesValues = req.body.weight_kg !== undefined || req.body.reps !== undefined;
    if (owned.completed && touchesValues && req.body.completed !== false) {
      return res.status(409).json({ error: 'Un-tick the set before editing it.', code: 'SET_LOCKED' });
    }

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

    const updated = await workoutSetModel.updateSet(setId, updates);

    // Automatic Epley 1RM & Personal Record (PR) detection on completed working sets
    if (updated && updated.completed && updated.set_type === 'working' && Number(updated.weight_kg) > 0 && Number(updated.reps) > 0) {
      const w = Number(updated.weight_kg);
      const r = Math.min(30, Number(updated.reps));
      const est1RM = Math.round((r === 1 ? w : w * (1 + r / 30)) * 10) / 10;
      const existingOrm = await db.oneOrNone(
        'SELECT estimated_1rm_kg FROM one_rep_maxes WHERE user_id = $1 AND exercise_id = $2',
        [req.user.id, updated.exercise_id]
      );
      if (!existingOrm || est1RM > Number(existingOrm.estimated_1rm_kg)) {
        await onermModel.upsertOneRM(req.user.id, updated.exercise_id, est1RM);
        updated.new_pr = true;
        updated.estimated_1rm_kg = est1RM;
      }
    }

    res.status(200).json(updated);
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
    if (workout.status === 'active' || workout.status === 'completed') return res.status(409).json({ error: 'Use finish or discard for this workout.' });
    res.status(200).json(await workoutModel.updateWorkoutStatus(workout.id, req.body.status));
  } catch (error) {
    next(error);
  }
};

/** Reschedules a planned (scheduled/skipped) workout to a new date/time. */
const rescheduleWorkout = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (workout.status === 'active' || workout.status === 'completed') {
      return res.status(409).json({ error: 'Cannot reschedule an active or completed workout.' });
    }
    const parsed = new Date(req.body.scheduled_date);
    if (!req.body.scheduled_date || Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Please provide a valid scheduled_date.' });
    }
    const updated = await db.one(
      "UPDATE workouts SET scheduled_date = $1, status = 'scheduled' WHERE id = $2 RETURNING *",
      [parsed.toISOString(), workout.id]
    );
    res.status(200).json(updated);
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

/** Starts the workout: only one may be in progress at a time. Sets can only be logged after this. */
const startWorkout = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (workout.status === 'completed') return res.status(409).json({ error: 'This workout is already completed.' });
    if (workout.status === 'active') return res.status(200).json(workout);

    const other = await db.oneOrNone(
      "SELECT id, name, split_type FROM workouts WHERE user_id = $1 AND status = 'active' AND id <> $2",
      [req.user.id, workout.id]
    );
    if (other) {
      return res.status(409).json({ error: 'Another workout is already in progress. Finish or discard it first.', code: 'ACTIVE_EXISTS', active_workout_id: other.id });
    }
    res.status(200).json(
      await db.one("UPDATE workouts SET status = 'active', started_at = NOW(), ended_at = NULL WHERE id = $1 RETURNING *", [workout.id])
    );
  } catch (error) {
    next(error);
  }
};

const finishWorkout = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (workout.status !== 'active') return res.status(409).json({ error: 'Only a workout in progress can be finished.' });
    res.status(200).json(
      await db.one("UPDATE workouts SET status = 'completed', ended_at = NOW() WHERE id = $1 RETURNING *", [workout.id])
    );
  } catch (error) {
    next(error);
  }
};

/** Discards progress: logged sets are cleared and the workout goes back to its planned state. */
const discardWorkout = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (workout.status !== 'active') return res.status(409).json({ error: 'Only a workout in progress can be discarded.' });
    await db.tx(async (t) => {
      await t.none(
        'UPDATE workout_sets SET completed = false, completed_at = NULL WHERE workout_id = $1',
        [workout.id]
      );
      await t.none("UPDATE workouts SET status = 'scheduled', started_at = NULL, ended_at = NULL WHERE id = $1", [workout.id]);
    });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/** Adds an exercise (with N planned sets) to a workout that isn't completed. */
const addExercise = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (workout.status === 'completed') return res.status(409).json({ error: 'Cannot edit a completed workout.' });
    const exerciseId = parseInt(req.body.exercise_id, 10);
    const sets = Math.max(1, Math.min(10, parseInt(req.body.sets, 10) || 3));
    const reps = Math.max(1, Math.min(50, parseInt(req.body.reps, 10) || 8));
    const exists = exerciseId && (await db.oneOrNone('SELECT id FROM exercises WHERE id = $1', [exerciseId]));
    if (!exists) return res.status(404).json({ error: 'Exercise not found' });
    const dup = await db.oneOrNone('SELECT 1 FROM workout_sets WHERE workout_id = $1 AND exercise_id = $2 LIMIT 1', [workout.id, exerciseId]);
    if (dup) return res.status(409).json({ error: 'That exercise is already in this workout.' });

    const weight = req.body.weight_kg === undefined || req.body.weight_kg === null ? null : Number(req.body.weight_kg);
    await db.tx(async (t) => {
      for (let i = 1; i <= sets; i++) {
        await t.none(
          `INSERT INTO workout_sets (workout_id, exercise_id, weight_kg, reps, set_number, set_type)
           VALUES ($1, $2, $3, $4, $5, 'working')`,
          [workout.id, exerciseId, weight, reps, i]
        );
      }
    });
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const removeExercise = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    if (workout.status === 'completed') return res.status(409).json({ error: 'Cannot edit a completed workout.' });
    const exerciseId = parseInt(req.params.exerciseId, 10);
    await db.tx(async (t) => {
      await t.none('DELETE FROM workout_sets WHERE workout_id = $1 AND exercise_id = $2', [workout.id, exerciseId]);
      await t.none('DELETE FROM workout_logs WHERE workout_id = $1 AND exercise_id = $2', [workout.id, exerciseId]);
    });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/** Replaces an exercise in a workout (only for sets not yet completed). */
const swapExercise = async (req, res, next) => {
  try {
    const workout = await loadOwned(req, res);
    if (!workout) return;
    const oldId = parseInt(req.params.exerciseId, 10);
    const newId = parseInt(req.body.new_exercise_id, 10);
    if (!oldId || !newId) return res.status(400).json({ error: 'new_exercise_id is required' });
    const exists = await db.oneOrNone('SELECT id FROM exercises WHERE id = $1', [newId]);
    if (!exists) return res.status(404).json({ error: 'Exercise not found' });

    const result = await db.result(
      'UPDATE workout_sets SET exercise_id = $3 WHERE workout_id = $1 AND exercise_id = $2 AND completed = false',
      [workout.id, oldId, newId]
    );
    res.status(200).json({ updated_sets: result.rowCount });
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

module.exports = { getWorkouts, getWorkout, updateSet, addSet, updateStatus, rescheduleWorkout, saveNotes, swapExercise, getNextForExercise, startWorkout, finishWorkout, discardWorkout, addExercise, removeExercise };
