const exerciseModel = require('../models/exerciseModel');

/**
 * Finds alternative exercises.
 * @param {number} exerciseId 
 * @returns {Promise<Object[]>}
 */
const findAlternatives = async (exerciseId) => {
  const original = await exerciseModel.findById(exerciseId);
  if (!original) throw new Error('Exercise not found');

  const alternatives = await exerciseModel.findAlternatives(exerciseId);

  const scored = alternatives.map(alt => {
    let score = 0;
    
    // +2 if equipment array has exactly 1 item (simpler swap)
    if (alt.equipment_needed && alt.equipment_needed.length === 1) {
      score += 2;
    }
    
    // +1 if is_compound matches the original
    if (alt.is_compound === original.is_compound) {
      score += 1;
    }

    return { ...alt, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
};

module.exports = {
  findAlternatives
};
