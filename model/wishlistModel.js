const mongoose = require("mongoose");
const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.mongo.ObjectId,
      required: true,
      ref: "User",
    },
    products: [
      {
        productId: {
          type: mongoose.mongo.ObjectId,
          required: true,
          ref: "Product",
        },
        addedOn: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const wishlistModel = mongoose.model("Wishlist", wishlistSchema);
module.exports = wishlistModel;
