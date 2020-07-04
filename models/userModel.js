const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name required'],
    unique: false,
    trim: true,
    maxlength: [40, 'User name must be less than or equal to 40 characters'],
    minlength: [2, 'User name must be greater than or equal to 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'User e-mail required'],
    lowercase: true,
    unique: true,
    trim: true,
    maxlength: [40, 'User e-mail must be less than or equal to 40 characters'],
    minlength: [5, 'User e-mail must be greater than or equal to 5 characters'],
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    required: false,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Password required'],
    unique: false,
    trim: true,
    select: false,
    maxlength: [20, 'Password must be less than or equal to 20 characters'],
    minlength: [8, 'Password must be greater than or equal to 5 characters'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirmation required'],
    unique: false,
    trim: true,
    select: false,
    validate: {
      // This only works on CREATE or SAVE!!
      validator: function (el) {
        return el === this.password; // makes sure this is equal to first password
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ENCRYPTING PASSWORD
// Make asynchronous so event loop is not blocked
// userSchema.pre('save', async function (next) {
//   // Only run if password is changed
//   if (!this.isModified('password')) return next();

//   // USES HASHING ALGORITHM BCRYPT
//   this.password = await bcrypt.hash(this.password, 12);

//   // Doesn't need to persist to the database, only needed on signup / update
//   this.passwordConfirm = undefined;

//   next();
// });

// userSchema.pre('save', function (next) {
//   if (!this.isModified('password') || this.isNew) return next();

//   this.passwordChangedAt = Date.now() - 1000;
//   next();
// });

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});



userSchema.pre(/^find/, function(next){
  // this is query middleware, points to current query
  this.find({active: {$ne: false }});
  next();
});


userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // creates a reset token and converts token to hexadecimal string, not a full password, just temp
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //encrypts resetToken
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
