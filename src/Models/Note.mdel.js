const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    noteId: {
        type: String,
        required: false,
    },
    title: {
       type: String,
       required: true,
       unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    lastModifiedAt: {
        type: Date,
        required: true,
    }
});

const Note = mongoose.model('note', NoteSchema);

module.exports = Note;