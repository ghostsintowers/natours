const multer = require('multer');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
  // get tour collection from data
  const tours = await Tour.find();

  // build template

  // render that template using data from step 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name'));
  }

  // console.log(tour);
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

//   router.get('/', (req, res) => {
//     res.status(200).render('base', {
//       tour: 'The Forest Hiker',
//       user: 'Jonas',
//     });
//   });

//   router.get('/overview', (req, res) => {
//     res.status(200).render('overview', {
//       title: 'All Tours'
//     });
//   });

//   router.get('/tour', (req, res) => {
//     res.status(200).render('tour', {
//       title: 'The Forest Hiker'
//     });
//   })

exports.getMyTours = catchAsync(async (req, res, next) => {
  // Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // Find tours
  const tourIDs = bookings.map((el) => el.tour.id);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
