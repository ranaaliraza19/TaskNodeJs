const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema(
  {
    product_owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Every Product must have Owner"],
    },
    name: {
      type: String,
      required: [true, "Please Provide an name for product"],
    },
    price: {
      type: Number,
      required: [true, "Please Provide an price for product"]
    },
    description: {
      type: String,
      required: [true, "Please Provide an description for product"],
    },
    quantity: {
      type: Number,
      required: [true, "Please Provide an quantity for product"]
    },
    thumbnail: {
      type: String,
      // required: [true, "Please provide an thumbnail for campaign"],
    },
  },
  {
    timestamps: true,
  }
);
const Products = mongoose.model("Products", productsSchema);
module.exports = Products;
