const express = require("express");
const cartRoute = express.Router();
const cartController = require("../controller/user/cartController");
const { isBlocked } = require("../middleware/accessAuthentication");


cartRoute.get("/",isBlocked, cartController.getCartPage);
cartRoute.post("/", cartController.addtoCart);
cartRoute.put("/updatecart", cartController.updateQuantity);
cartRoute.delete("/removecartitem", cartController.deleteCartItem);
cartRoute.delete("/clearcart", cartController.clearCart);

module.exports = cartRoute;
