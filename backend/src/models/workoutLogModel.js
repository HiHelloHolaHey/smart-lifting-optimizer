const db = require('../config/db');

const upsertNotes = (workoutId, exerciseId, notes) =>
  db.one(
    `INSERT INTO workout_logs (workout_id, exercise_id, exercise_notes)
     VALUES ($1, $2, $3)
     ON CONFLICT (workout_id, exercise_id)
     DO UPDATE SET exercise_notes = EXCLUDED.exercise_notes, updated_at = NOW()
     RETURNING *`,
    [workoutId, exerciseId, notes]
  );

const findByWorkout = (workoutId) =>
  db.any('SELECT * FROM workout_logs WHERE workout_id = $1', [workoutId]);

/** Latest completed set per (exercise, set_number) before the given workout — "ghost" previous performance. */
const getPreviousPerformance = (userId, workoutId) =>
  db.any(
    `SELECT DISTINCT ON (ws.exercise_id, ws.set_type, ws.set_number)
            ws.exercise_id, ws.set_type, ws.set_number, ws.weight_kg, ws.reps
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND ws.completed = true AND ws.workout_id <> $2
     ORDER BY ws.exercise_id, ws.set_type, ws.set_number, w.scheduled_date DESC`,
    [userId, workoutId]
  );

/** Completed working-set volume per muscle group since a date (for fatigue map). */
const getMuscleVolume = (userId, sinceDate) =>
  db.any(
    `SELECT e.muscle_group,
            COUNT(*)::int AS sets,
            COALESCE(SUM(ws.weight_kg * ws.reps), 0)::float AS volume,
            MAX(ws.completed_at) AS last_trained
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE w.user_id = $1 AND ws.completed = true AND ws.set_type = 'working'
       AND COALESCE(ws.completed_at, w.scheduled_date) >= $2
     GROUP BY e.muscle_group`,
    [userId, sinceDate]
  );

/** Weekly volume totals for the last N days (monthly summary). */
const getVolumeByWeek = (userId, days) =>
  db.any(
    `SELECT to_char(date_trunc('week', COALESCE(ws.completed_at, w.scheduled_date) AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS week,
            COALESCE(SUM(ws.weight_kg * ws.reps), 0)::float AS volume,
            COUNT(*)::int AS sets
     FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND ws.completed = true AND ws.set_type = 'working'
       AND COALESCE(ws.completed_at, w.scheduled_date) >= NOW() - ($2 || ' days')::interval
     GROUP BY 1 ORDER BY 1`,
    [userId, String(days)]
  );

module.exports = { upsertNotes, findByWorkout, getPreviousPerformance, getMuscleVolume, getVolumeByWeek };
