const cors = require('cors');
const path = require('path'); // built in
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');


// const bodyParser = require('body-parser');
// const compression = require('compression');
// const cors = require('cors');


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Setting up PUG engine
app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'views')); 

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));


// ************************************ MIDDLEWARE ************************************
app.use(cors());

// SECURITY HTTP headers
app.use(helmet());

// Middleware - function that can modify incoming data
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}


// Limit number of attempts from IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour.',
});
app.use('/api', limiter);

// Body Parser, reading data into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// Prevent parameter pollution - such as two sorts being requested in the apiFeatures
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
    ],
  })
);



// MIDDLEWARE DEMO
app.use((req, res, next) => {
  // console.log(req.headers);
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next(); // don't forget to use next in your middleware or it gets stuck
});


// ************************************ ROUTES ************************************
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// ************************************ ERRORS ************************************

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
