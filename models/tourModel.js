const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // validator
      unique: true,
      trim: true,
      maxlength: [40, 'The tour name is too long, must be <= 40 characters'],
      minlength: [10, 'The tour name is too short, must be >= 10 characters'],
      // validate: [validator.isAlpha, 'Name must only contain characters'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium, or difficult.',
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be between 1.0 and 5.0'],
      set: (val) => Math.round(val * 10) / 10, // rounds it to X.X
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this keyword won't work on patch
          return val < this.price; // will return a validation error if discount is more than price
        },
        message: 'Discount price should be lower than actual price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({price: 1});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// can't use virtuals in queries
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate to populate only on get a single tour (too much data for get all tours)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // connects the models together
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() - this points to current DOCUMENT
// tourSchema.pre('save', function (next) {
//   // console.log('Hello from the document middleware');
//   // console.log((this.slug = slugify(this.name, { lower: true })));
//   next();
// });

// // Embedding users into tours (guides would be an array in model)
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises); // guides is an array of promises so promise.all must be used
//   next();
// })

// tourSchema.pre('save', function (next) {
//   console.log('Hello from the pre HOOK');
//   next();
// });
//
// tourSchema.post('save', function (doc, next) {
//   console.log('Finished document: ');
//   console.log(doc);
//   next();
// });

// Query HOOKS (Middleware) - this points to query
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   // console.log(docs);
//   // console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// Aggregation MIDDLEWARE - this points to current aggregation
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: { $ne: true },
//     },
//   });
//   // console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema); // always capitalize model names / variables
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });
//
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

module.exports = Tour;
