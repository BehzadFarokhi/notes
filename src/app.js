const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
require('dotenv').config();
require('./Helpers/Redis.helper');
require('./Helpers/Mongodb.helper')
const { verifyAccessToken } = require('./Helpers/JWT.helper');

const AuthenticationRoute = require('./Routes/Authentication.route');
const NoteRoute = require('./Routes/Note.route');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', verifyAccessToken, async (req, res, next) => {
    console.log(req.headers['authorization']);

    res.send('User is verified');
});

app.use('/auth', AuthenticationRoute);
app.use('/note', verifyAccessToken, NoteRoute);

 app.use(async (req, res, next) => {
     next(createError.NotFound());
 });

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        err: {
            status: err.status || 500,
            message: err.message,
        }
    })
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
