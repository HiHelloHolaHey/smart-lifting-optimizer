const workoutSetModel = require('../models/workoutSetModel');
const onermModel = require('../models/onermModel');

/**
 * @typedef {Object} OverloadSuggestion
 * @property {number} suggested_weight_kg
 * @property {number} suggested_reps
 * @property {string} increment_reason
 * @property {boolean} ready_for_progression
 */

/**
 * Calculates next session parameters.
 * @param {string} userId 
 * @param {number} exerciseId 
 * @returns {Promise<OverloadSuggestion>}
 */
const calculateNextSession = async (userId, exerciseId) => {
  // Fetch last ~3 sessions worth of sets. Assuming max 5 sets per session, fetch 15.
  const history = await workoutSetModel.getLastNSessionsForExercise(userId, exerciseId, 3);
  
  if (!history || history.length === 0) {
    const onerms = await onermModel.findByUser(userId);
    const orm = onerms.find(o => o.exercise_id === exerciseId);
    let baseWeight = 20; // empty bar default
    if (orm && orm.estimated_1rm_kg) {
      baseWeight = parseFloat(orm.estimated_1rm_kg) * 0.6;
    }
    // Round to nearest 2.5kg
    baseWeight = Math.round(baseWeight / 2.5) * 2.5;
    
    return {
      suggested_weight_kg: baseWeight,
      suggested_reps: 8,
      increment_reason: 'Baseline suggestion based on 1RM or defaults.',
      ready_for_progression: true
    };
  }

  // Group by workout_id to isolate the last session
  const sessions = {};
  history.forEach(set => {
    if (!sessions[set.workout_id]) {
      sessions[set.workout_id] = { sets: [], date: set.scheduled_date };
    }
    sessions[set.workout_id].sets.push(set);
  });

  // Sort sessions by date descending
  const sortedSessionIds = Object.keys(sessions).sort((a, b) => 
    new Date(sessions[b].date) - new Date(sessions[a].date)
  );

  const lastSessionId = sortedSessionIds[0];
  const lastSessionSets = sessions[lastSessionId].sets;

  const targetReps = 8; // Assuming 8 is target for now
  const allCompleted = lastSessionSets.every(s => s.completed);
  const avgReps = lastSessionSets.reduce((sum, s) => sum + s.reps, 0) / lastSessionSets.length;
  
  const lastWeight = parseFloat(lastSessionSets[0].weight_kg) || 0;
  const lastReps = lastSessionSets[0].reps || 8;

  if (allCompleted && avgReps >= targetReps) {
    // Look at previous session to see if we just increased weight
    let justIncreasedWeight = false;
    if (sortedSessionIds.length > 1) {
      const prevSessionSets = sessions[sortedSessionIds[1]].sets;
      const prevWeight = parseFloat(prevSessionSets[0].weight_kg) || 0;
      if (lastWeight > prevWeight) {
        justIncreasedWeight = true;
      }
    }

    if (justIncreasedWeight) {
      return {
        suggested_weight_kg: lastWeight,
        suggested_reps: lastReps + 1,
        increment_reason: 'Maintained weight, increased reps for progression.',
        ready_for_progression: true
      };
    } else {
      let newWeight = lastWeight * 1.025;
      newWeight = Math.round(newWeight / 0.5) * 0.5; // Round to nearest 0.5kg
      return {
        suggested_weight_kg: newWeight,
        suggested_reps: targetReps,
        increment_reason: 'All sets completed with target reps. Increased weight by 2.5%.',
        ready_for_progression: true
      };
    }
  }

  return {
    suggested_weight_kg: lastWeight,
    suggested_reps: lastReps,
    increment_reason: 'Not all sets completed in last session. Maintaining current weight and reps.',
    ready_for_progression: false
  };
};

module.exports = {
  calculateNextSession
};
