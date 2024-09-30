const express = require('express');
const cartRoute = express.Router();
const cartController = require('../controller/user/cartController');

cartRoute.get('/',cartController.getCartPage);
cartRoute.post('/',cartController.addtoCart);


module.exports = cartRoute;