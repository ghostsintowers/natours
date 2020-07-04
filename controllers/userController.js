const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// ************************************* MULTER *************************************
// cb means call back
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// })

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only images', 400), false);
  }
};

const upload = multer({ 
  storage: multerStorage,
  fileFilter: multerFilter
});

// photo is name of the form field
exports.uploadUserPhoto = upload.single('photo');

// ************************************* RESIZE PHOTO *************************************
exports.resizeUserPhoto = catchAsync( async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


// ************************************* FILTER *************************************
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el];
  })

  return newObj;
}

exports.checkID = (req, res, next, val) => {
  // console.log('Hello from the check id middleware');
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalid id',
    });
  }
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user tries to POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This is not for password data. Please use update my password.'
      ),
      401
    );
  }
  // Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if(req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync( async(req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  })
});


exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use signup instead.',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User); // Don't use to change passwords
exports.deleteUser = factory.deleteOne(User);

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'not yet implemented',
//   });
// };

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'not yet implemented',
//   });
// };

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users, // envelope data object, could just write tours since names are same
//     },
//   });
// });

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'not yet implemented',
//   });
// };
