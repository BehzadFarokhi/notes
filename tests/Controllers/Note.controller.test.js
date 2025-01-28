const createError = require('http-errors');
const Note = require('../../src/Models/Note.mdel');
const { noteSchema } = require('../../src/ValidationSchemas/Note.schema');
const { idSchema } = require('../../src/ValidationSchemas/Id.schema');
const controller = require('../../src/Controllers/Note.controller');

jest.mock('../../src/Models/Note.mdel');
jest.mock('../../src/ValidationSchemas/Note.schema');
jest.mock('../../src/ValidationSchemas/Id.schema');

const mockNote = (noteName) => {
    return {
        title: `${noteName} Note`,
        description: `This is my ${noteName} note.`,
        createdAt: '2025-01-26T12:48:45.123Z',
        lastModifiedAt: '2025-01-26T12:48:45.123Z'
    }
}

const updatedNote =
{ title: 'Updated Note', description: 'This is my updated note.', createdAt: '2025-01-26T12:48:45.123Z', lastModifiedAt: '2025-01-26T12:48:45.123Z' }

describe('Note Controller Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('add', () => {
        it('should add a new note and return it', async () => {
            const req = { body: mockNote("First") };
            const res = { send: jest.fn() };
            const next = jest.fn();

            noteSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            Note.findOne = jest.fn().mockResolvedValue(null);
            Note.prototype.save = jest.fn().mockResolvedValue({ id: '1', ...req.body });

            await controller.add(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ savedNote: {id:'1', ...mockNote("First") } });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return a conflict error if the note title already exists', async () => {
            const req = { body: mockNote('Test') };
            const res = {};
            const next = jest.fn();

            noteSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            Note.findOne = jest.fn().mockResolvedValue({ title: 'Test Note' });

            await controller.add(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.Conflict('Note with the title: Test Note already exists.'));
        });
    });

    describe('edit', () => {
        it('should update an existing note and return it', async () => {
            const req = { params: { id: '1' }, body: mockNote('Updated') };
            const res = { send: jest.fn() };
            const next = jest.fn();

            idSchema.validate = jest.fn().mockReturnValue({ error: null });
            noteSchema.validateAsync = jest.fn().mockResolvedValue(req.body);
            Note.findByIdAndUpdate = jest.fn().mockResolvedValue({ id: '1', ...req.body });

            await controller.edit(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ updatedNote: { id: "1", ...mockNote('Updated') } });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return a bad request error for invalid ID', async () => {
            const req = { params: { id: 'invalid_id' }, body: mockNote('Updated') };
            const res = {};
            const next = jest.fn();

            idSchema.validate = jest.fn().mockReturnValue({ error: { message: 'Invalid ID' } });

            await controller.edit(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.BadRequest('Invalid note ID format'));
        });
    });

    describe('get', () => {
        it('should return a note by ID', async () => {
            const req = { params: { id: '1' } };
            const res = { send: jest.fn() };
            const next = jest.fn();

            Note.findById = jest.fn().mockResolvedValue({ id: '1', ...mockNote('Updated') });

            await controller.get(req, res, next);

            expect(res.send).toHaveBeenCalledWith({ note: { id: '1', ...mockNote('Updated') } });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return a not found error if the note does not exist', async () => {
            const req = { params: { id: '1' } };
            const res = {};
            const next = jest.fn();

            Note.findById = jest.fn().mockResolvedValue(null);

            await controller.get(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.NotFound("Note with the given ID doesn't exist."));
        });
    });

    describe('list', () => {
        it('should return a list of notes', async () => {
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Note.find = jest.fn().mockResolvedValue([{ id: '1', ...mockNote('Note 1') }, { id: '2', ...mockNote('Note 2') }]);

            await controller.list(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ notes: [{ id: '1', ...mockNote('Note 1') }, { id: '2', ...mockNote('Note 2') }] });
        });

        it('should return a message if no notes are found', async () => {
            const req = {};
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Note.find = jest.fn().mockResolvedValue([]);

            await controller.list(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'No notes found' });
        });
    });

    describe('delete', () => {
        it('should delete a note by ID and return success message', async () => {
            const req = { params: { id: '1' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();

            Note.findByIdAndDelete = jest.fn().mockResolvedValue({ id: '1', ...mockNote('Test') });

            await controller.delete(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note deleted successfully' });
        });

        it('should return a not found error if the note does not exist', async () => {
            const req = { params: { id: '1' } };
            const res = {};
            const next = jest.fn();

            Note.findByIdAndDelete = jest.fn().mockResolvedValue(null);

            await controller.delete(req, res, next);

            expect(next).toHaveBeenCalledWith(createError.NotFound("Note with the given ID doesn't exist"));
        });
    });
});
