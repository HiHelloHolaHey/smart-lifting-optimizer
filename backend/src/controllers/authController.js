const authService = require('../services/authService');
const userModel = require('../models/userModel');
const config = require('../config');
const db = require('../config/db');

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/** Attaches the `onboarded` flag (has a generated program) to a user row. */
const withOnboarded = async (user) => {
  const { count } = await db.one('SELECT COUNT(*)::int AS count FROM workouts WHERE user_id = $1', [user.id]);
  return { ...user, onboarded: count > 0 };
};

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.cookie('token', token, cookieOptions());
    res.status(201).json({ user: await withOnboarded(user) });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.cookie('token', token, cookieOptions());
    res.status(200).json({ user: await withOnboarded(user) });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

/** Returns the full profile (the JWT only carries the id). */
const getMe = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.user.id);
    if (!user) {
      // Token is valid but the account no longer exists
      res.clearCookie('token');
      return res.status(401).json({ error: 'Account not found. Please sign in again.' });
    }
    res.status(200).json({ user: await withOnboarded(user) });
  } catch (error) {
    next(error);
  }
};

const GOALS = ['strength', 'hypertrophy', 'weight_loss', 'endurance'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** Validates and normalises profile fields; returns {values} or {error, field}. */
const parseProfile = (body) => {
  const out = {};
  if (body.firstName !== undefined) {
    const name = String(body.firstName).trim();
    if (!name || name.length > 50) return { error: 'Name must be 1-50 characters.', field: 'firstName' };
    out.first_name = name;
  }
  if (body.heightCm !== undefined) {
    const h = Number(body.heightCm);
    if (!(h >= 100 && h <= 250)) return { error: 'Height must be between 100 and 250 cm.', field: 'heightCm' };
    out.height_cm = h;
  }
  if (body.weightKg !== undefined) {
    const w = Number(body.weightKg);
    if (!(w >= 30 && w <= 400)) return { error: 'Weight must be between 30 and 400 kg.', field: 'weightKg' };
    out.weight_kg = w;
  }
  if (body.goal !== undefined) {
    if (!GOALS.includes(body.goal)) return { error: 'Invalid goal.', field: 'goal' };
    out.goal = body.goal;
  }
  if (body.experienceLevel !== undefined) {
    if (!LEVELS.includes(body.experienceLevel)) return { error: 'Invalid experience level.', field: 'experienceLevel' };
    out.experience_level = body.experienceLevel;
  }
  return { values: out };
};

const updateProfile = async (req, res, next) => {
  try {
    const { values, error, field } = parseProfile(req.body);
    if (error) return res.status(400).json({ error, field });
    const user = await userModel.updateUser(req.user.id, values);
    res.status(200).json({ user: await withOnboarded(user) });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe, updateProfile, parseProfile };
