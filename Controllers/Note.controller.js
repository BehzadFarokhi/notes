const createError = require('http-errors');
const Note = require('../Models/Note.mdel');
const { noteSchema } = require('../ValidationSchemas/Note.schema');
const { idSchema } = require('../ValidationSchemas/Id.schema');

// const {
//     signAccessToken,
//     signRefreshToken,
//     verifyRefreshToken
// } = require('../Helpers/jwt_helper');
//const client = require('../Helpers/init_redis');

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

            res.send({note});

        } catch (error) {
            next(error);
        }
    },
    list: async (req, res, next) => {
        try {
            // Fetch all notes from the database
            const notes = await Note.find();

            // If no notes are found, return an empty array or a custom message
            if (notes.length === 0) {
                return res.status(200).json({ message: "No notes found" });
            }

            // Return the list of notes
            res.status(200).json({ notes });
        } catch (error) {
            next(error); // Forward any error to the global error handler
        }
    },
    delete: async (req, res, next) => {
        try {
            // Get the note ID from the URL parameter
            const { id } = req.params;

            // Find and delete the note by ID
            const deletedNote = await Note.findByIdAndDelete(id);

            // If no note is found, throw a Not Found error
            if (!deletedNote) {
                return next(createError.NotFound("Note with the given ID doesn't exist"));
            }

            // Return a success message
            res.status(200).json({ message: "Note deleted successfully" });
        } catch (error) {
            next(error); // Forward any error to the global error handler
        }
    },
}