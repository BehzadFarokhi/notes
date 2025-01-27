const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const client = require('./Redis.helper');

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {

            const payload = {};
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: '1h',
                issuer: 'example.com',
                audience: userId,
            };

            JWT.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err);
                    return reject(createError.InternalServerError());
                }
                resolve(token);
            });
        })
    },
    verifyAccessToken: (req, res, next) => {
        if (!req.headers['authorization']) return next(createError.Unauthorized());

        const token = req.headers['authorization'].split(' ')[1];
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload)=> {
            if (err) return next(createError.Unauthorized(err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message))

            req.payload = payload;

            next();
        });
    },
    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const options = {
                expiresIn: '1y',
                issuer: 'example.com',
                audience: userId
            };

            try {
                const token = JWT.sign({}, process.env.REFRESH_TOKEN_SECRET, options);

                client
                    .set(userId, token, { EX: 31536000 })
                    .then(() => {
                        resolve(token);
                    })
                    .catch((err) => {
                        console.error('Redis set error:', err.message);
                        reject(createError.InternalServerError());
                    });
            } catch (err) {
                console.error('JWT signing error:', err.message);
                reject(createError.InternalServerError());
            }
        })
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, payload) => {
                if (err) {
                    console.error('JWT verification error:', err.message);
                    return reject(createError.Unauthorized());
                }

                const userId = payload.aud;

                try {
                    const storedToken = await client.get(userId);

                    if (refreshToken === storedToken) {
                        return resolve(userId);
                    }

                    reject(createError.Unauthorized());
                } catch (redisError) {
                    console.error('Redis GET error:', redisError.message);
                    reject(createError.InternalServerError());
                }
            });
        });
    }
}