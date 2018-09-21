// Load the dotfiles.
require('dotenv/config');

const express = require('express');

// Middleware!
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const morgan = require('morgan');

const Raven = require('raven');
Raven.config('https://a987cc875bda41b6a6fceb76eda529a1:a6bfaa9debfe456aaae3d744dbfa8a66@sentry.io/201945').install();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const path = require('path');
const port = process.env.PORT || 3000;
const database = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://localhost:27017';

require('./config/settings');
require('./config/admin');

// Connect to mongodb
mongoose.connect(database);

const app = express();

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());

const logFormat = process.env.NODE_ENV === 'dev' ? 'dev' : 'combined';
app.use(morgan(logFormat));

app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(methodOverride());

app.use(express.static(path.join(__dirname, '/app/client')));

// sponsorship prospectus
app.use('/sponsorship', express.static(path.join(__dirname, 'app/sponsorship.pdf')));

// Routers =====================================================================

const apiRouter = express.Router();
require('./app/server/routes/api')(apiRouter);
app.use('/api', apiRouter);

const authRouter = express.Router();
require('./app/server/routes/auth')(authRouter);
app.use('/auth', authRouter);

require('./app/server/routes')(app);

// The error handler must be before any other error middleware
app.use(Raven.errorHandler());

app.listen(port);
console.log('App listening on port ' + port);
