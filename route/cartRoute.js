const express = require('express');
const cartRoute = express.Router();
const cartController = require('../controller/user/cartController');

cartRoute.get('/',cartController.getCartPage);
cartRoute.post('/',cartController.addtoCart);
cartRoute.put("/updatecart", cartController.updateQuantity);
cartRoute.delete("/removecartitem", cartController.deleteCartItem);


module.exports = cartRoute;