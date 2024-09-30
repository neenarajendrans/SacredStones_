const mongoose = require("mongoose");

const Product = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: [
    {
      type: String,
      required: true,
    },
  ],
  gross_weight: {
    type: Number,
    required: true,
  },
  gold_purity: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  making_charge: {
    type: Number,
    required: true,
  },
  total_price: {
    // regular price
    type: Number,
    required: true,
  },
  discount_price: {
    type: Number, // sale price
    required: true,
  },
  stock: {
    type: Number, //quantity
    required: true,
    min: 0,
    max: 100,
  },
  review: {
    // product offer is required?
    type: String,
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
  status:{
    type: String,
    enum: ['Available', 'out of stock','Discontinued'],
    required:true,
    default:'Available',
  }
},{timestamps:true});

module.exports = mongoose.model("Product", Product);
