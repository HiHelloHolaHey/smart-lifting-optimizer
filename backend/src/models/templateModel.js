const db = require('../config/db');

const findByUser = (userId) =>
  db.any('SELECT * FROM workout_templates WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

const create = (userId, name, exercises) =>
  db.one(
    `INSERT INTO workout_templates (user_id, name, exercise_order_json)
     VALUES ($1, $2, $3::jsonb) RETURNING *`,
    [userId, name, JSON.stringify(exercises)]
  );

const update = (id, userId, name, exercises) =>
  db.oneOrNone(
    `UPDATE workout_templates SET name = $3, exercise_order_json = $4::jsonb
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, name, JSON.stringify(exercises)]
  );

const remove = (id, userId) =>
  db.result('DELETE FROM workout_templates WHERE id = $1 AND user_id = $2', [id, userId], (r) => r.rowCount);

module.exports = { findByUser, create, update, remove };
