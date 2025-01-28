const createError = require('http-errors');
const Note = require('../Models/Note.mdel');
const { noteSchema } = require('../ValidationSchemas/Note.schema');
const { idSchema } = require('../ValidationSchemas/Id.schema');

module.exports = {
    add: async (req, res, next) => {
        try {
            const result = await noteSchema.validateAsync(req.body);
            const doesExists = await Note.findOne({ title: result.title });

            if (doesExists) throw createError.Conflict(`Note with the title: ${result.title} already exists.`);

            const note = new Note(result);
            const savedNote = await note.save();

            res.send({ savedNote });

        } catch (error) {
            if (error.isJoi === true) error.status = 422
            next(error);
        }
    },
    edit: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { error } = idSchema.validate({id});

            if (error) {
                return next(createError.BadRequest("Invalid note ID format"));
            }

            const result = await noteSchema.validateAsync(req.body);
            const updatedNote = await Note.findByIdAndUpdate(
                id,
                { $set: result },
                { new: true }
            );

            if (!updatedNote) throw createError.NotFound("Note with the given ID doesn't exist.");

            res.send({ updatedNote });
        } catch (error) {
            if (error.isJoi === true) error.status = 422;

            next(error);
        }
    },
    get: async (req, res, next) => {
        try {
            const { id } = req.params;
            const note = await Note.findById(id)

            if(!note) throw createError.NotFound("Note with the given ID doesn't exist.");
            res.send({note});

        } catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            const notes = await Note.find();

            if (notes.length === 0) {
                return res.status(200).json({ message: "No notes found" });
            }

            res.status(200).json({ notes });
        } catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            const { id } = req.params;
            const deletedNote = await Note.findByIdAndDelete(id);

            if (!deletedNote) {
                return next(createError.NotFound("Note with the given ID doesn't exist"));
            }

            res.status(200).json({ message: "Note deleted successfully" });
        } catch (error) {
            next(error);
        }
    },
}
