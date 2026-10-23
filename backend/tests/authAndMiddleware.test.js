jest.mock('../src/models/userModel');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const userModel = require('../src/models/userModel');
const { register, login, passwordProblems } = require('../src/services/authService');
const verifyToken = require('../src/middleware/verifyToken');
const errorHandler = require('../src/middleware/errorHandler');

describe('authService & middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('passwordProblems', () => {
    test('detects missing length, letter, and number', () => {
      expect(passwordProblems('short')).toContain('at least 8 characters');
      expect(passwordProblems('short')).toContain('at least one number');
      expect(passwordProblems('12345678')).toContain('at least one letter');
      expect(passwordProblems('abcdefgh')).toContain('at least one number');
      expect(passwordProblems('ValidPass1')).toEqual([]);
    });
  });

  describe('register', () => {
    test('rejects invalid email with 400 INVALID_EMAIL', async () => {
      await expect(register({ email: 'not-an-email', password: 'Password1' })).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_EMAIL',
        field: 'email',
      });
    });

    test('rejects weak password with 400 WEAK_PASSWORD', async () => {
      await expect(register({ email: 'test@example.com', password: 'weak' })).rejects.toMatchObject({
        statusCode: 400,
        code: 'WEAK_PASSWORD',
        field: 'password',
      });
    });

    test('rejects duplicate email with 409 EMAIL_TAKEN', async () => {
      userModel.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'taken@example.com' });
      await expect(register({ email: 'TAKEN@example.com', password: 'Password1' })).rejects.toMatchObject({
        statusCode: 409,
        code: 'EMAIL_TAKEN',
        field: 'email',
      });
    });
  });

  describe('login', () => {
    test('returns 404 USER_NOT_FOUND naming the email when account does not exist', async () => {
      userModel.findUserByEmail.mockResolvedValue(null);
      await expect(login({ email: 'nobody@example.com', password: 'Password1' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        field: 'email',
      });
    });

    test('returns 401 WRONG_PASSWORD when password hash does not match', async () => {
      const hash = await bcrypt.hash('CorrectPass1', 4);
      userModel.findUserByEmail.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        password_hash: hash,
      });

      await expect(login({ email: 'user@example.com', password: 'WrongPassword1' })).rejects.toMatchObject({
        statusCode: 401,
        code: 'WRONG_PASSWORD',
        field: 'password',
      });
    });
  });

  describe('verifyToken middleware', () => {
    const mockRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    test('returns 401 when no token is provided in cookies or Authorization header', () => {
      const req = { cookies: {}, headers: {} };
      const res = mockRes();
      const next = jest.fn();

      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('accepts valid JWT from httpOnly cookie and attaches req.user', () => {
      const token = jwt.sign({ id: 'user-123' }, config.jwtSecret, { expiresIn: '1h' });
      const req = { cookies: { token }, headers: {} };
      const res = mockRes();
      const next = jest.fn();

      verifyToken(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.id).toBe('user-123');
    });
  });

  describe('errorHandler middleware', () => {
    test('serializes statusCode, message, field, and code into JSON response', () => {
      const err = Object.assign(new Error('Invalid email'), {
        statusCode: 400,
        field: 'email',
        code: 'INVALID_EMAIL',
      });
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      errorHandler(err, {}, res, () => {});
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid email',
        field: 'email',
        code: 'INVALID_EMAIL',
      });
    });
  });
});
