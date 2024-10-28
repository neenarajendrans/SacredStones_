const express = require('express');
const orderRoute = express.Router();
const orderController = require('../controller/user/orderController');

orderRoute.get('/checkout', orderController.getCheckOutPage); 
orderRoute.post('/checkout', orderController.checkOutPost);
orderRoute.get('/ordersuccess',orderController.loadOrderDetails); 
orderRoute.get('/orderdetails/:id',orderController.singleOrderDetails); 
orderRoute.get('/cancelorder',orderController.getCancelOrderPage);
orderRoute.post('/cancelorder',orderController.orderCancel);


module.exports= orderRoute;