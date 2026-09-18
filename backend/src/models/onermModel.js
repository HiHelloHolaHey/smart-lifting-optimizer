const db = require('../config/db');

const upsertOneRM = async (userId, exerciseId, estimated1rm) => {
  return db.one(
    `INSERT INTO one_rep_maxes (user_id, exercise_id, estimated_1rm_kg)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, exercise_id) DO UPDATE SET
       estimated_1rm_kg = EXCLUDED.estimated_1rm_kg,
       calculated_at = NOW()
     RETURNING *`,
    [userId, exerciseId, estimated1rm]
  );
};

const findByUser = async (userId) => {
  return db.any(
    `SELECT orm.*, e.name as exercise_name
     FROM one_rep_maxes orm
     JOIN exercises e ON orm.exercise_id = e.id
     WHERE orm.user_id = $1`,
    [userId]
  );
};

module.exports = {
  upsertOneRM,
  findByUser
};
