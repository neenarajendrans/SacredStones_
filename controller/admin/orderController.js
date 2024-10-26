const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const Order = require("../../model/orderModel")

const getOrderPage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orders = await Order.find({ user: userId }).populate("product");

    res.render("admin/orderManagement",{orders});
  });



module.exports={ getOrderPage}