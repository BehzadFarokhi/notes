const createError = require('http-errors');
const User = require('../Models/User.model');
const { userSchema } = require('../ValidationSchemas/User.schema');
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} = require('../Helpers/JWT.helper');
const client = require('../Helpers/Redis.helper');

module.exports = {
    register: async (req, res, next) => {
        try {
            const result = await userSchema.validateAsync(req.body);
            const doesExists = await User.findOne({ email: result.email });

            if (doesExists) throw createError.Conflict(`${result.email} is already been registered`);

            const user = new User(result);
            const savedUser = await user.save();
            const accessToken = await signAccessToken(savedUser.id)
            const refreshToken = await signRefreshToken(savedUser.id)

            res.send({ accessToken, refreshToken });

        } catch (error) {
            if (error.isJoi === true) error.status = 422
            next(error);
        }
    },
    login: async (req, res, next) => {
        try {
            const result = await userSchema.validateAsync(req.body);
            const user = await User.findOne({ email: result.email });

            if (!user) throw createError.NotFound("User not registered");

            const isMatch = await user.isValidPassword(result.password);

            if(!isMatch) throw createError.Unauthorized('Invalid username or password');

            const accessToken = await signAccessToken(user.id);
            const refreshToken = await signRefreshToken(user.id);

            res.send({ accessToken, refreshToken });

        } catch(error){
            if (error.isJoi === true) return next(createError.BadRequest("Invalid Username or password"));
            next(error);
        }
    },
    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            if(!refreshToken) throw createError.BadRequest();

            const userId = await verifyRefreshToken(refreshToken);

            const accessToken = await signAccessToken(userId);
            const refToken = await signRefreshToken(userId);

            res.send({accessToken: accessToken, refreshToken: refToken });

        } catch (error) {
            next(error);
        }
    },
    logout: async(req, res, next) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw createError.BadRequest('Refresh token is required');
            }

            const userId = await verifyRefreshToken(refreshToken);
            try {
                const result = await client.del(userId);

                if (result === 0) {
                    throw createError.NotFound('Refresh token not found in Redis');
                }
                res.sendStatus(204);
            } catch (redisError) {
                console.error('Redis DEL error:', redisError.message);
                throw createError.InternalServerError();
            }
        } catch (err) {
            next(err);
        }
    }
}