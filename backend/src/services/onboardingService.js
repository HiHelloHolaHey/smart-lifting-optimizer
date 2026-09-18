const db = require('../config/db');
const onermModel = require('../models/onermModel');
const workoutModel = require('../models/workoutModel');
const workoutSetModel = require('../models/workoutSetModel');
const scheduleModel = require('../models/scheduleModel');

/**
 * Calculates estimated 1RM for key exercises based on experience level.
 * @param {string} experienceLevel 
 * @returns {Promise<Object>} Map of exercise ID to estimated 1RM in kg
 */
const calculate1RM = async (experienceLevel) => {
  const estimates = {
    beginner: { bench: 60, squat: 80, deadlift: 100, ohp: 40, row: 60 },
    intermediate: { bench: 100, squat: 140, deadlift: 180, ohp: 65, row: 90 },
    advanced: { bench: 140, squat: 200, deadlift: 250, ohp: 90, row: 130 }
  };

  const levelEstimates = estimates[experienceLevel] || estimates.beginner;
  
  const exercises = await db.any(
    `SELECT id, name FROM exercises WHERE name IN ('Barbell Bench Press', 'Barbell Back Squat', 'Deadlift', 'Barbell Overhead Press', 'Barbell Row')`
  );

  const nameToKey = {
    'Barbell Bench Press': 'bench',
    'Barbell Back Squat': 'squat',
    'Deadlift': 'deadlift',
    'Barbell Overhead Press': 'ohp',
    'Barbell Row': 'row'
  };

  const result = {};
  exercises.forEach(ex => {
    const key = nameToKey[ex.name];
    if (key && levelEstimates[key]) {
      result[ex.id] = levelEstimates[key];
    }
  });

  return result;
};

/**
 * Generates a 4-week workout template.
 * @param {string} userId 
 * @param {string} splitType 
 * @param {Date} startDate 
 * @returns {Promise<string[]>} Array of created workout IDs
 */
const generateWeeklyTemplate = async (userId, splitType, startDate) => {
  const exercises = await db.any('SELECT * FROM exercises');
  const exMap = exercises.reduce((acc, ex) => {
    acc[ex.name] = ex.id;
    return acc;
  }, {});

  const templates = {
    PPL_PUSH: ['Barbell Bench Press', 'Barbell Overhead Press', 'Incline Dumbbell Press', 'Tricep Pushdown'],
    PPL_PULL: ['Deadlift', 'Barbell Row', 'Pull-Up', 'Barbell Curl'],
    PPL_LEGS: ['Barbell Back Squat', 'Leg Press', 'Romanian Deadlift', 'Calf Raise'],
    UPPER: ['Barbell Bench Press', 'Barbell Row', 'Barbell Overhead Press', 'Pull-Up'],
    LOWER: ['Barbell Back Squat', 'Deadlift', 'Leg Press', 'Calf Raise'],
    FULL_BODY: ['Barbell Back Squat', 'Barbell Bench Press', 'Barbell Row', 'Barbell Overhead Press']
  };

  let scheduleDays = [];
  if (splitType.startsWith('PPL')) {
    scheduleDays = [{ dayOffset: 0, split: 'PPL_PUSH' }, { dayOffset: 2, split: 'PPL_PULL' }, { dayOffset: 4, split: 'PPL_LEGS' }, { dayOffset: 5, split: 'PPL_PUSH' }];
  } else if (splitType === 'UPPER' || splitType === 'LOWER' || splitType.includes('UPPER_LOWER')) { // Adjusting based on logic
    scheduleDays = [{ dayOffset: 0, split: 'UPPER' }, { dayOffset: 1, split: 'LOWER' }, { dayOffset: 3, split: 'UPPER' }, { dayOffset: 4, split: 'LOWER' }];
  } else {
    scheduleDays = [{ dayOffset: 0, split: 'FULL_BODY' }, { dayOffset: 2, split: 'FULL_BODY' }, { dayOffset: 4, split: 'FULL_BODY' }];
  }

  const workoutIds = [];
  const setsToInsert = [];

  for (let week = 0; week < 4; week++) {
    for (const { dayOffset, split } of scheduleDays) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (week * 7) + dayOffset);

      const workout = await workoutModel.createWorkout({
        userId,
        scheduledDate: date.toISOString(),
        splitType: split,
        notes: `Week \${week + 1} \${split} Workout`
      });
      workoutIds.push(workout.id);

      const splitExercises = templates[split] || templates.FULL_BODY;
      splitExercises.forEach(exName => {
        const exId = exMap[exName];
        if (exId) {
          for (let set = 1; set <= 3; set++) {
            setsToInsert.push({
              workout_id: workout.id,
              exercise_id: exId,
              weight_kg: 0, // Will be updated by progressive overload logic when starting
              reps: 8,
              set_number: set
            });
          }
        }
      });
    }
  }

  await workoutSetModel.createManySets(setsToInsert);
  return workoutIds;
};

/**
 * Initializes onboarding data for a user.
 * @param {string} userId 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const initializeOnboarding = async (userId, { experienceLevel, goal, splitType, schedule }) => {
  const onerms = await calculate1RM(experienceLevel);
  const oneRepMaxPromises = Object.entries(onerms).map(([exId, weight]) => 
    onermModel.upsertOneRM(userId, parseInt(exId), weight)
  );
  await Promise.all(oneRepMaxPromises);

  const startDate = new Date();
  const workoutIds = await generateWeeklyTemplate(userId, splitType, startDate);

  if (schedule) {
    await scheduleModel.upsertSchedule(userId, {
      gymOpenTime: schedule.gymOpenTime,
      gymCloseTime: schedule.gymCloseTime,
      busyTimesJson: schedule.busyTimes,
      preferredFrequency: schedule.preferredFrequency,
      goalPriority: schedule.goalPriority
    });
  }

  return { workouts: workoutIds, oneRepMaxes: onerms };
};

module.exports = {
  calculate1RM,
  generateWeeklyTemplate,
  initializeOnboarding
};
