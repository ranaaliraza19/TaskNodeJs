const cloudinary = require('cloudinary').v2;

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const productModel = require("../model/productsModel");
const { Types } = require("mongoose");
const ApiFeatures = require("../utils/apiFeatures");
const ObjectId = Types.ObjectId;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a new product
exports.createProduct = catchAsync(async (req, res, next) => {
  let docs = [];

  // Check if the request body contains the 'data' array
  if (!req.body?.data || !Array.isArray(req.body?.data)) {
    return next(new AppError("Kindly provide the list of data of the products", 400));
  }

  const data = req.body?.data;

  // Iterate through the data array and validate the required fields
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.name && data[i]?.price && data[i]?.quantity) {
      docs.push({
        product_owner_id: req.user._id,
        name: data[i].name,
        price: data[i].price,
        description: data[i].description,
        quantity: data[i].quantity,
        thumbnail: data[i].thumbnail,
      });
    }
  }

  // Check if any valid product data is available
  if (docs.length == 0) {
    return next(new AppError("Kindly provide valid product data", 400));
  }

  // Bulk insert the new products into the productModel
  const newProduct = await productModel.bulkWrite(
    docs.map((doc) => ({
      insertOne: {
        document: doc,
      },
    }))
  );

  res.status(200).json({
    status: "Success",
    newProduct,
  });
});

// Upload an image for a product
exports.upload = catchAsync(async (req, res, next) => {
  const productId = req.params.product_id;
  const userId = req.user._id;

  // Validate if the user has created the product
  const product = await productModel.findOne({
    _id: productId,
    product_owner_id: userId,
  });

  if (!product) {
    return next(new AppError("You do not have permission to update this product", 403));
  }

  // Check if a file is uploaded
  if (!req.files || !req.files.image) {
    return next(new AppError("No file uploaded", 400));
  }

  const file = req.files.image;

  // Upload the file to Cloudinary
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.tempFilePath, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  // Update the thumbnail field in the product table
  product.thumbnail = result.secure_url;
  await product.save();

  res.status(200).json({
    status: "Success",
    message: "Image uploaded successfully",
  });
});

// Get all products
exports.getAllProducts = catchAsync(async (req, res) => {
  const { name } = req.query;
  const filter = {
    owner_id: req.user._id,
  };

  // Apply filters based on the 'name' query parameter
  if (name) {
    filter["name"] = { $regex: name, $options: "i" };
  }

  const features = new ApiFeatures(productModel.find(filter), req.query)
    .sort()
    .limitFields()
    .paginate();

  // Count the total number of products
  const totalCount = await productModel.count(filter);

  // Execute the query with applied filters and pagination
  const doc = await features.query;

  res.status(200).json({
    status: "success",
    results: doc.length,
    data: doc,
    total: totalCount,
  });
});

// Get products owned by the current user
exports.getMyProducts = catchAsync(async (req, res) => {
  const data = await productModel.find({
    product_owner_id: ObjectId(req.user._id),
  });

  res.status(200).json({
    status: "success",
    data,
  });
});

// Get a product by its ID
exports.getProductById = catchAsync(async (req, res, next) => {
  const { product_id } = req.params;

  // Check if the product ID is valid
  if (!ObjectId.isValid(product_id)) {
    return next(new AppError("Invalid product ID", 400));
  }

  // Find the product by its ID
  const data = await productModel.findById(product_id);

  res.status(200).json({
    status: "success",
    data,
  });
});

// Update a product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find the product by ID
  const product = await productModel.findById(id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if the logged-in user is the owner of the product
  if (product.product_owner_id.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to update this product', 403));
  }

  try {
    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: id },
      req.body,
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Product has been updated',
      updatedProduct,
    });
  } catch (err) {
    return next(err);
  }
});

// Delete a product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find the product by ID
  const product = await productModel.findById(id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if the logged-in user is the owner of the product
  if (product.product_owner_id.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to delete this product', 403));
  }

  // Delete the product
  const deletedProduct = await productModel.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: `Product with ID ${deletedProduct._id} has been deleted`,
  });
});
