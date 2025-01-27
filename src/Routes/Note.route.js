const express = require('express');
const router = express.Router();
const NoteController = require('../Controllers/Note.controller');

router.post('/add', NoteController.add);

router.put('/edit/:id', NoteController.edit);

router.get('/get/:id', NoteController.get);

router.get('/list', NoteController.list);

router.delete('/delete/:id', NoteController.delete);

module.exports = router