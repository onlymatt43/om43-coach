const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const validate = require('./routes/validate');
const videos = require('./routes/videos');
const admin = require('./routes/admin');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', validate);
app.use('/api', videos);
app.use('/api', admin);

module.exports = app;
