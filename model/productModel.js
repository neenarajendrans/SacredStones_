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
    // regular price / unit price
    type: Number,
    required: true,
  },
  discount_price: {
    type: Number, 
    required: true,
  },
  stock: {
    type: Number, //quantity
    required: true,
    min: 0,
    max: 100,
  },
  popularity:{
    type:Number,
    default:0
  },
  is_listed: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status:{
    type: String,
    enum: ['Available', 'out of stock','Discontinued'],
    required:true,
    default:'Available',
  },
  isWishlisted: {
    type: Boolean,
    default: false,
  },
  
  createdOn: {
    type: Date,
    default: Date.now()
},
},{timestamps:true});

module.exports = mongoose.model("Product", Product);
