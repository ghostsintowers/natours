// const fs = require('fs');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// Route Handler
// Best to specify version for people currently using the api

// ************************************ CONTROLLERS ************************************
// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side', app: 'Natours' });
// });
//
// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint');
// });

// exports.checkID = (req, res, next) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid id',
//     });
//   }
//   next();
// };

// Create a checkBody middleware function
// Check if body contains name and process.disconnect();
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'must have a name and price',
//     });
//   }
//   next();
// };
//
// const Tour = require('./../models/tourModel');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitfields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// ************************************ GET ALL TOURS ************************************
exports.getAllTours = async (req, res) => {
  try {
    // const queryObj = { ...req.query };
    //
    // // BUILD QUERY
    // // 1A) Filtering
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((el) => delete queryObj[el]);
    // console.log(req.query, queryObj);
    //
    // // 1B) Advanged Filtering
    // let queryStr = JSON.stringify(queryObj);
    // // {difficulty: 'easy'}, duration {$gte: 5} - in MongoDB
    // // {difficulty: 'easy'}, duration {gte: 5} - query string
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));
    //
    // // console.log(req.requestTime);
    // let query = Tour.find(JSON.parse(queryStr));

    // 2) Sorting
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   console.log(sortBy);
    //   query = query.sort(sortBy);
    // }

    // 3) Field Limiting
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // 4) Pagination
    // page=2*limit=10, 1-10, page 1, 11-20, page 2, etc
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit).limitFields();
    //
    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip > numTours) throw new Error('this page does not exist');
    // }

    // 5) Aliasing

    // For reference (another way of doing it)
    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    //  EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours, // envelope data object, could just write tours since names are same
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// ************************************ GET TOUR ************************************
exports.getTour = async (req, res) => {
  try {
    // const id = req.params.id * 1;
    // const tour = tours.find((el) => el.id === id);
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({_id: req.params.id}) - same thing, mongoose makes it easier with findById
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// ************************************ CREATE TOUR ************************************
exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({})
    // newTour.save()

    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail - why is this happening?',
      message: err,
    });
  }
};

// exports.createTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// console.log(req.body);
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
//
// tours.push(newTour);

// don't use writeFileSync because we're in the event loop
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       status: 'success',
//       // data: {
//       //   tour: newTour,
//       // },
//     });
//   }
// );
//
// };

// ************************************ UPDATE TOUR ************************************
exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    }); // end res.status
  } // end catch
};

// ************************************ DELETE TOUR ************************************
exports.deleteTour = async (req, res) => {
  try {
    const delTour = await Tour.findByIdAndDelete(req.params.id, () => {
      console.log('hello from the delete');
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
