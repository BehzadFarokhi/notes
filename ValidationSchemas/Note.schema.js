const Joi = require('joi-oid');

const noteSchema = Joi.object({
    noteId: Joi.objectId(),
    title: Joi.string().min(1).required(),
    description: Joi.string().min(1).required(),
    createdAt: Joi.date().required(),
    lastModifiedAt: Joi.date().required(),
});

module.exports = {
    noteSchema
}