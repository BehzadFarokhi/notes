const controller = require('../../src/Controllers/Authentication.controller');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../src/Helpers/JWT.helper');
const userSchema = require('../../src/ValidationSchemas/User.schema');
const User = require('../../src/Models/User.model');
const client = require('../../src/Helpers/Redis.helper');
const createError = require('http-errors');

jest.mock('../../src/Helpers/JWT.helper', () => ({
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
}));

jest.mock('../../src/Models/User.model');
jest.mock('../../src/Helpers/Redis.helper');

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe('Auth Controller Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    afterAll(async () => {
        if (client.quit) {
            await client.quit(); // Properly close Redis connection
            console.log('Redis client disconnected');
        }
    });

    describe('register', () => {
        it('should register a user and return access and refresh tokens', async () => {
            const req = { body: { email: 'test@example.com', password: 'password123' } };
            const res = { send: jest.fn() };
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue(null);
            User.prototype.save = jest.fn().mockResolvedValue({ id: '1' });
            signAccessToken.mockResolvedValue('access_token');
            signRefreshToken.mockResolvedValue('refresh_token');

            await controller.register(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ accessToken: 'access_token', refreshToken: 'refresh_token' });
        });

        it('should return 409 error if user already exists', async () => {
            const req = { body: { email: 'test@example.com', password: 'password123' } };
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
            const req = { body: { email: 'test@example.com', password: 'password123' } };
            const res = { send: jest.fn() };
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue({ id: '1', isValidPassword: jest.fn().mockResolvedValue(true) });
            signAccessToken.mockResolvedValue('access_token');
            signRefreshToken.mockResolvedValue('refresh_token');

            await controller.login(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ accessToken: 'access_token', refreshToken: 'refresh_token' });
        });

        it('should return 404 error if user is not found', async () => {
            const req = { body: { email: 'test@example.com', password: 'password123' } };
            const res = {};
            const next = jest.fn();

            userSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            User.findOne = jest.fn().mockResolvedValue(null);

            await controller.login(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.NotFound('User not registered'));
        });

        it('should return 401 error if password is incorrect', async () => {
            const req = { body: { email: 'test@example.com', password: 'wrongpassword' } };
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

            verifyRefreshToken.mockResolvedValue('user_id');
            signAccessToken.mockResolvedValue('new_access_token');
            signRefreshToken.mockResolvedValue('new_refresh_token');

            await controller.refreshToken(req, res, next);

            expect(res.send).toHaveBeenCalledWith({
                accessToken: 'new_access_token',
                refreshToken: 'new_refresh_token',
            });
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

            verifyRefreshToken.mockResolvedValue('user_id');
            client.del.mockResolvedValue(1);

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
    });
});
