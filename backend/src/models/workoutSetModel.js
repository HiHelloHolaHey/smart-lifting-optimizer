const db = require('../config/db');
const pgp = require('pg-promise')();

const createSet = async (data) => {
  const { workoutId, exerciseId, weightKg, reps, setNumber } = data;
  return db.one(
    `INSERT INTO workout_sets (workout_id, exercise_id, weight_kg, reps, set_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [workoutId, exerciseId, weightKg, reps, setNumber]
  );
};

const updateSet = async (setId, updates) => {
  const keys = Object.keys(updates);
  if (keys.length === 0) return db.oneOrNone('SELECT * FROM workout_sets WHERE id = $1', [setId]);

  const setString = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [setId, ...Object.values(updates)];

  return db.one(
    `UPDATE workout_sets SET ${setString} WHERE id = $1 RETURNING *`,
    values
  );
};

const getLastNSessionsForExercise = async (userId, exerciseId, n) => {
  return db.any(
    `SELECT ws.*, w.scheduled_date
     FROM workout_sets ws
     JOIN workouts w ON ws.workout_id = w.id
     WHERE w.user_id = $1 AND ws.exercise_id = $2 AND ws.completed = true
     ORDER BY w.scheduled_date DESC
     LIMIT $3`,
    [userId, exerciseId, n * 5] // Rough estimate to get last n *sessions* (assuming ~5 sets per session) - handled better in service
  );
};

const createManySets = async (setsArray) => {
  if (setsArray.length === 0) return [];
  const columns = new pgp.helpers.ColumnSet(['workout_id', 'exercise_id', 'weight_kg', 'reps', 'set_number'], {table: 'workout_sets'});
  const query = pgp.helpers.insert(setsArray, columns) + ' RETURNING *';
  return db.any(query);
};

module.exports = {
  createSet,
  updateSet,
  getLastNSessionsForExercise,
  createManySets
};
