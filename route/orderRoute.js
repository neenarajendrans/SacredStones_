const express = require("express");
const orderRoute = express.Router();
const orderController = require("../controller/user/orderController");
const returnController = require("../controller/user/returnController");
const { isBlocked } = require("../middleware/accessAuthentication");
const { isLoggedin } = require("../middleware/authenticationMiddleware");

orderRoute.get("/checkout",isLoggedin, isBlocked, orderController.getCheckOutPage);
orderRoute.post("/checkout", orderController.checkOutPost);
orderRoute.get("/ordersuccess",isLoggedin, isBlocked, orderController.loadOrderDetails);
orderRoute.get("/orderdetails/:id", orderController.singleOrderDetails);
orderRoute.get("/cancelorder", orderController.getCancelOrderPage);
orderRoute.post("/cancelorder", orderController.orderCancel);
orderRoute.post("/updatestatus", orderController.updateOrderStatus);
orderRoute.get("/returnreason", returnController.getReturnOrderPage);
orderRoute.post("/returnorder", returnController.orderReturn);
orderRoute.delete("/delete/:orderId", orderController.orderDelete);

module.exports = orderRoute;
