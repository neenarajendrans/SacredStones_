const express = require('express');
const orderRoute = express.Router();
const adminController = require('../controller/admin/adminController');
const orderController = require('../controller/admin/orderController');
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');
const userController = require('../controller/user/userController')
const asyncHandler = require('express-async-handler')

orderRoute.get('/', orderController.getOrderPage); 

module.exports= orderRoute;