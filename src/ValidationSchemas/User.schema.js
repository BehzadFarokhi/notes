const Joi = require('joi-oid');

const userSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).required(),
});

module.exports = {
    userSchema
}