const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/userModel');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** @returns {string[]} unmet password requirements (empty when valid) */
const passwordProblems = (password) => {
  const problems = [];
  if (typeof password !== 'string' || password.length < 8) problems.push('at least 8 characters');
  if (!/[A-Za-z]/.test(password || '')) problems.push('at least one letter');
  if (!/\d/.test(password || '')) problems.push('at least one number');
  if (Buffer.byteLength(password || '') > 72) problems.push('no more than 72 characters');
  return problems;
};

const fail = (statusCode, message, extra = {}) => Object.assign(new Error(message), { statusCode, ...extra });

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

/**
 * Registers a new account. Profile details (name, stats, goal) are collected during onboarding.
 * @param {{email: string, password: string}} data
 */
const register = async ({ email, password }) => {
  email = normalizeEmail(email);
  if (!EMAIL_RE.test(email)) throw fail(400, 'Please enter a valid email address.', { field: 'email', code: 'INVALID_EMAIL' });
  const problems = passwordProblems(password);
  if (problems.length) throw fail(400, `Password needs ${problems.join(', ')}.`, { field: 'password', code: 'WEAK_PASSWORD' });

  if (await userModel.findUserByEmail(email)) {
    throw fail(409, 'An account with this email already exists. Try signing in instead.', { field: 'email', code: 'EMAIL_TAKEN' });
  }

  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));
  const user = await userModel.createUser({ email, passwordHash });
  const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { user, token };
};

/**
 * Logs in a user with specific, actionable errors.
 * @param {{email: string, password: string}} credentials
 */
const login = async ({ email, password }) => {
  email = normalizeEmail(email);
  if (!email || !password) throw fail(400, 'Enter your email and password.', { code: 'MISSING_FIELDS' });

  const user = await userModel.findUserByEmail(email);
  if (!user) throw fail(404, `No account found for ${email}. Check the spelling or create an account.`, { field: 'email', code: 'USER_NOT_FOUND' });

  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw fail(401, 'Incorrect password. Please try again.', { field: 'password', code: 'WRONG_PASSWORD' });
  }

  const { password_hash, ...userWithoutPassword } = user;
  const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  return { user: userWithoutPassword, token };
};

module.exports = { register, login, passwordProblems };
