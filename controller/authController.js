const User = require("./../model/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError")

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

// User signup
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User already exists", 403));
  }

  // Create a new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  createSendToken(newUser, 201, req, res);
});

// User login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // If everything is okay, send token to the client
  createSendToken(user, 200, req, res);
});

// Protect routes from unauthorized access
exports.protect = catchAsync(async (req, res, next) => {
  // Get the token from request headers or cookies
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // Check if the user changed the password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Update user profile
exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const userDetail = await User.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      status: "success",
      message: `User is updated to:`,
      userDetail
    });
  } catch (err) {
    return next(err);
  }
});

// Update user password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // Check if the current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log the user in and send the JWT
  createSendToken(user, 200, req, res);
});

// User logout
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

// Get the current user's profile
exports.getMe = async (req, res, next) => {
  const data = await User.findById(req.user.id);

  if (data) {
    res.status(200).json({
      status: "success",
      data: {
        data,
      },
    });
  } else {
    res.status(400).json({ status: 400, Error: "Failed" });
  }
};

// Get a specific user by ID
exports.getUser = factory.getOne(User);

// Get all users
exports.getAllUsers = factory.getAll(User);
