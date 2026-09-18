const db = require('../config/db');

const createUser = async (userData) => {
  const { email, passwordHash, firstName, heightCm, weightKg, experienceLevel, goal } = userData;
  return db.one(
    `INSERT INTO users (email, password_hash, first_name, height_cm, weight_kg, experience_level, goal)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, first_name, height_cm, weight_kg, experience_level, goal, created_at`,
    [email, passwordHash, firstName, heightCm, weightKg, experienceLevel, goal]
  );
};

const findUserByEmail = async (email) => {
  return db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
};

const findUserById = async (id) => {
  return db.oneOrNone(
    `SELECT id, email, first_name, height_cm, weight_kg, experience_level, goal, created_at 
     FROM users WHERE id = $1`,
    [id]
  );
};

const updateUser = async (id, updates) => {
  const keys = Object.keys(updates);
  if (keys.length === 0) return findUserById(id);

  const setString = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [id, ...Object.values(updates)];

  return db.one(
    `UPDATE users SET ${setString} WHERE id = $1 
     RETURNING id, email, first_name, height_cm, weight_kg, experience_level, goal, created_at`,
    values
  );
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser
};
