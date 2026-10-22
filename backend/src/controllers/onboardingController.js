const onboardingService = require('../services/onboardingService');
const userModel = require('../models/userModel');
const db = require('../config/db');
const { parseProfile } = require('./authController');

const SPLITS = ['PPL', 'UPPER', 'UPPER_LOWER', 'LOWER', 'FULL_BODY'];

/**
 * Saves the profile collected during onboarding (name, stats, goal, level)
 * and generates the 4-week starting program.
 */
const onboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, heightCm, weightKg, experienceLevel, goal, splitType, schedule } = req.body;

    const { values, error, field } = parseProfile({ firstName, heightCm, weightKg, experienceLevel, goal });
    if (error) return res.status(400).json({ error, field });
    if (!values.first_name) return res.status(400).json({ error: 'Please tell us your name.', field: 'firstName' });
    if (!values.experience_level || !values.goal) return res.status(400).json({ error: 'Experience level and goal are required.' });
    if (!SPLITS.includes(splitType)) return res.status(400).json({ error: 'Choose a workout split.', field: 'splitType' });

    const { count } = await db.one('SELECT COUNT(*)::int AS count FROM workouts WHERE user_id = $1', [userId]);
    if (count > 0) return res.status(409).json({ error: 'Your program is already set up.', code: 'ALREADY_ONBOARDED' });

    await userModel.updateUser(userId, values);
    const result = await onboardingService.initializeOnboarding(userId, { experienceLevel, goal, splitType, schedule });
    res.status(201).json({ ...result, user: await userModel.findUserById(userId) });
  } catch (error) {
    next(error);
  }
};

module.exports = { onboard };
