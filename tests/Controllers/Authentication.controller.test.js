const createError = require('http-errors');
const User = require('../../src/Models/User.model');
const { userSchema } = require('../../src/ValidationSchemas/User.schema');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../src/Helpers/JWT.helper');
const client = require('../../src/Helpers/Redis.helper');
const controller = require('../../src/Controllers/Authentication.controller');

jest.mock('../../src/Models/User.model');
jest.mock('../../src/ValidationSchemas/User.schema');
jest.mock('../../src/Helpers/JWT.helper');
jest.mock('../../src/Helpers/Redis.helper');

describe('Auth Controller Tests', () => {
    describe('register', () => {
        it('should register a user and return access and refresh tokens', async () => {
            const req = {
                body: { email: 'test@example.com', password: 'password123' }
            };
            const res = { send: jest.fn() };
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue(null);
            User.prototype.save = jest.fn().mockResolvedValue({ id: '1' });
            signAccessToken = jest.fn().mockResolvedValue('access_token');
            signRefreshToken = jest.fn().mockResolvedValue('refresh_token');

            await controller.register(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ accessToken: 'access_token', refreshToken: 'refresh_token' });
        });

        it('should return 409 error if user already exists', async () => {
            const req = {
                body: { email: 'test@example.com', password: 'password123' }
            };
            const res = {};
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue({ email: 'test@example.com' });

            await controller.register(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.Conflict('test@example.com is already been registered'));
        });
    });

    describe('login', () => {
        it('should return access and refresh tokens if credentials are correct', async () => {
            const req = {
                body: { email: 'test@example.com', password: 'password123' }
            };
            const res = { send: jest.fn() };
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue({ id: '1', isValidPassword: jest.fn().mockResolvedValue(true) });
            signAccessToken = jest.fn().mockResolvedValue('access_token');
            signRefreshToken = jest.fn().mockResolvedValue('refresh_token');

            await controller.login(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ accessToken: 'access_token', refreshToken: 'refresh_token' });
        });

        it('should return 404 error if user is not found', async () => {
            const req = {
                body: { email: 'test@example.com', password: 'password123' }
            };
            const res = {};
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue(null);

            await controller.login(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.NotFound('User not registered'));
        });

        it('should return 401 error if password is incorrect', async () => {
            const req = {
                body: { email: 'test@example.com', password: 'wrongpassword' }
            };
            const res = {};
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue({ id: '1', isValidPassword: jest.fn().mockResolvedValue(false) });

            await controller.login(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.Unauthorized('Invalid username or password'));
        });
    });

    describe('refreshToken', () => {
        it('should return new access and refresh tokens', async () => {
            const req = { body: { refreshToken: 'valid_refresh_token' } };
            const res = { send: jest.fn() };
            const next = jest.fn();

            verifyRefreshToken = jest.fn().mockResolvedValue('user_id');
            signAccessToken = jest.fn().mockResolvedValue('new_access_token');
            signRefreshToken = jest.fn().mockResolvedValue('new_refresh_token');

            await controller.refreshToken(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ accessToken: 'new_access_token', refreshToken: 'new_refresh_token' });
        });

        it('should return 400 error if no refresh token is provided', async () => {
            const req = { body: {} };
            const res = {};
            const next = jest.fn();

            await controller.refreshToken(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.BadRequest());
        });
    });

    describe('logout', () => {
        it('should successfully logout a user and remove the refresh token', async () => {
            const req = { body: { refreshToken: 'valid_refresh_token' } };
            const res = { sendStatus: jest.fn() };
            const next = jest.fn();

            verifyRefreshToken = jest.fn().mockResolvedValue('user_id');
            client.del = jest.fn().mockResolvedValue(1);

            await controller.logout(req, res, next);

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });

        it('should return 400 error if no refresh token is provided', async () => {
            const req = { body: {} };
            const res = {};
            const next = jest.fn();

            await controller.logout(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.BadRequest('Refresh token is required'));
        });

        it('should return 404 error if refresh token is not found in Redis', async () => {
            const req = { body: { refreshToken: 'valid_refresh_token' } };
            const res = {};
            const next = jest.fn();

            verifyRefreshToken = jest.fn().mockResolvedValue('user_id');
            client.del = jest.fn().mockResolvedValue(0);

            await controller.logout(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.NotFound('Refresh token not found in Redis'));
        });
    });
});
