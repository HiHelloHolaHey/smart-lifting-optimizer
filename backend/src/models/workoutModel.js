const db = require('../config/db');

const createWorkout = async (data) => {
  const { userId, scheduledDate, splitType, notes } = data;
  return db.one(
    `INSERT INTO workouts (user_id, scheduled_date, split_type, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, scheduledDate, splitType, notes]
  );
};

const findWorkoutsByUser = async (userId) => {
  return db.any(
    `SELECT w.*, 
            COUNT(ws.id)::int as total_sets, 
            COUNT(ws.id) FILTER (WHERE ws.completed = true)::int as completed_sets,
            COALESCE(SUM(ws.weight_kg * ws.reps) FILTER (WHERE ws.completed = true AND ws.set_type = 'working'), 0)::float as volume
     FROM workouts w
     LEFT JOIN workout_sets ws ON w.id = ws.workout_id
     WHERE w.user_id = $1
     GROUP BY w.id
     ORDER BY w.scheduled_date DESC`,
    [userId]
  );
};

const findWorkoutById = async (workoutId) => {
  const workout = await db.oneOrNone('SELECT * FROM workouts WHERE id = $1', [workoutId]);
  if (!workout) return null;

  const sets = await db.any(
    `SELECT ws.*, e.name as exercise_name, e.muscle_group, e.is_compound
     FROM workout_sets ws
     JOIN exercises e ON ws.exercise_id = e.id
     WHERE ws.workout_id = $1
     ORDER BY ws.exercise_id, ws.set_number`,
    [workoutId]
  );

  workout.sets = sets;
  return workout;
};

const updateWorkoutStatus = async (workoutId, status) => {
  return db.one(
    `UPDATE workouts SET status = $2 WHERE id = $1 RETURNING *`,
    [workoutId, status]
  );
};

module.exports = {
  createWorkout,
  findWorkoutsByUser,
  findWorkoutById,
  updateWorkoutStatus
};
