const mongoose = require("mongoose");
const { defaultMaxListeners } = require("nodemailer/lib/xoauth2");

const user = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      unique: false,
      sparse: true,
      default: null,
    },
    googleId: {
      type: String,
      
      required: false,

    },
    password: {
      type: String,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },

    is_blocked: {
      type: Boolean,
      default: false,
    },
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
      },
    ],
    wallet: {
      type: Number,
      // default: 0,
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Wishlist",
    }],
    orderHistory:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now,
    },
    referalCode:{   // not decided yet
        type:String,

    },
    redeemed:{
        type:Boolean,
    },
    redeemedUsers:[{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"User"
    }],
    searchHistory:[{
        category:{
            type:mongoose.Schema.Types.ObjectId, // for every search topic like popularity, featured... eveything need to be recorded?
            ref:"Category",
        },
        searchOn:{
            type:Date,
            default:Date.now,
        }
    }]
  },
  { timestamps: true } // timestamp and createdOn required?
);
module.exports = mongoose.model("User", user);
