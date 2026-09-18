const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/userModel');

/**
 * Registers a new user.
 * @param {Object} userData
 * @returns {Promise<{user: Object, token: string}>}
 */
const register = async ({ email, password, firstName, heightCm, weightKg, experienceLevel, goal }) => {
  const existingUser = await userModel.findUserByEmail(email);
  if (existingUser) {
    throw { statusCode: 400, message: 'Email already in use' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await userModel.createUser({
    email,
    passwordHash,
    firstName,
    heightCm,
    weightKg,
    experienceLevel,
    goal
  });

  const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  
  return { user, token };
};

/**
 * Logs in a user.
 * @param {Object} credentials
 * @returns {Promise<{user: Object, token: string}>}
 */
const login = async ({ email, password }) => {
  const user = await userModel.findUserByEmail(email);
  if (!user) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const { password_hash, ...userWithoutPassword } = user;
  const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

  return { user: userWithoutPassword, token };
};

module.exports = {
  register,
  login
};
