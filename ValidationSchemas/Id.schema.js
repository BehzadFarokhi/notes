const Joi = require('joi-oid');

const idSchema = Joi.object({
    id: Joi.objectId().required()
});

module.exports = {
    idSchema
}