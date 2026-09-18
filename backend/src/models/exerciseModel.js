const db = require('../config/db');

const findById = async (id) => {
  return db.oneOrNone('SELECT * FROM exercises WHERE id = $1', [id]);
};

const findByMuscleGroup = async (muscleGroup) => {
  return db.any('SELECT * FROM exercises WHERE muscle_group = $1', [muscleGroup]);
};

const findAlternatives = async (exerciseId) => {
  return db.any(
    `SELECT e2.* 
     FROM exercises e1
     JOIN exercises e2 ON e1.muscle_group = e2.muscle_group 
     WHERE e1.id = $1 AND e2.id != $1`,
    [exerciseId]
  );
};

module.exports = {
  findById,
  findByMuscleGroup,
  findAlternatives
};
