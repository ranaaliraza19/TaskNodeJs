const path = require("path");
const express = require("express");
const xss = require("xss-clean");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const userRoutes = require("./routes/authRouter");
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/errorController");
const productRoutes = require("./routes/productRoutes")
const fileUpload = require('express-fileupload')

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(fileUpload({
  useTempFiles: true
}))

// Data sanitization against XSS
app.use(xss());

app.use(compression());

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/product", productRoutes);


app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
