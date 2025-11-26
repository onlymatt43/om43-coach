const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// IMPORT ROUTES
const validateCode = require('./routes/validateCode');
const chat = require('./routes/chat');
const videos = require('./routes/videos');
const admin = require('./routes/admin');
const webhook = require('./routes/webhook');

// MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());

// ROUTES
app.use('/api', validateCode);
app.use('/api', chat);
app.use('/api', videos);
app.use('/api', admin);
app.use('/api', webhook);

module.exports = app;
