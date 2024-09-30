const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");

const getOrderPage = asyncHandler(async (req, res) => {
    res.render("admin/orderManagement");
  });

module.exports={ getOrderPage}