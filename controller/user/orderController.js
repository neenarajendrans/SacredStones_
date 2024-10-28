const asyncHandler = require("express-async-handler");
const Address = require("../../model/addressModel");
const User = require("../../model/userModel");
const Cart = require('../../model/cartModel');
const Product = require('../../model/productModel');
const {calculateProductTotal,calculateSubtotal}=require('../../config/cartSum')
const Order = require("../../model/orderModel");
const {v4:uuidv4} = require('uuid'); // for creating a random number as orderID


//@des Get Checkout page
//@route Get /order/checkout
//@access public

const getCheckOutPage = asyncHandler(async (req, res) => {
    const userId = req.session.user_id;
  
    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: "products.productData_id",
        model: "Product",
      })
      .exec();
console.log(cart,"cart page");

if (!cart) {
  console.log("Cart not found.");
}
const cartItems = cart.products || [];
const subtotal = calculateSubtotal(cartItems);
const productTotal = calculateProductTotal(cartItems);
const subtotalWithShipping = subtotal ;
const addressData = await Address.find({ user_id: userId });
  res.render("user/checkOut",{userData,addressData,cart:cartItems,productTotal,subtotalWithShipping});
  });


//@des post Checkout page
//@route post /order/checkout
//@access public



const checkOutPost = asyncHandler(async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { address, paymentMethod } = req.body;

    // Validate user and cart existence
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: "products.productData_id",
        model: "Product",
      })
      .populate("user_id");

    if (!user || !cart) {
      return res.status(404).json({ success: false, error: "User or cart not found" });
    }

    if (!cart.products || cart.products.length === 0) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    if (!address) {
      return res.status(400).json({ error: 'Billing address not selected' });
    }

    // Check product stock before proceeding
    for (const item of cart.products) {
      const product = await Product.findById(item.productData_id._id);
      if (!product || product.stock < item.qty) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${product ? product.name : 'Unknown'}` 
        });
      }
    }

    const cartItems = cart.products;
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + (item.productData_id.discount_price * item.qty || 0),
      0
    );

    // Create new order
    const order = new Order({
      orderId: uuidv4(),
      user_id: userId,
      address: address,
      orderDate: new Date(),
      orderStatus: "Placed",
      paymentMethod: paymentMethod,
      paymentStatus: "Pending",
      deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
      totalAmount: totalAmount,
      finalAmount: totalAmount,
      items: cartItems.map((cartItem) => ({
        product: cartItem.productData_id._id,
        qty: cartItem.qty,
        price: cartItem.productData_id.discount_price,
      })),
    });

    // Save order
    const savedOrder = await order.save();

    // Update product stock - FIXED VERSION
    await Promise.all(cartItems.map(item =>
      Product.findByIdAndUpdate(
        item.productData_id._id,
        { $inc: { stock: -item.qty } },
        { new: true }
      )
    ));
    
    // Clear cart
    await Cart.findByIdAndUpdate(
      cart._id,
      { $set: { products: [], total: 0 } },
      { new: true }
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Order placed successfully',
      orderId: savedOrder._id 
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to place order',
      details: error.message 
    });
  }
});




//@des Get orderDatail page
//@route Get /order/ordersuccess
//@access public

const loadOrderDetails = asyncHandler(async (req, res) => {
  const userId =  req.session.user_id;

  const userData = await User.findById(userId);
  const order = await Order.find({ user_id: userData._id })
  .populate('user_id')
  .populate({
    path: 'items.product',
    model: 'Product',
  })


console.log(order," Details");
  if (userData) {
   
      res.render("user/orders",{ userData,order });
    } else {
      res.redirect('/login');
    }
});

// single order page-------------------------

const singleOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  const orderId = req.params.id;

  const userData = await User.findById(userId);
  const order = await Order.findById(orderId)
    .populate("user_id")
    .populate({
      path: "address",  // The field name in your schema is 'address'
      model: "Address", // The model name is 'address', all lowercase
    })
    .populate({
      path: "items.product",
      model: "Product",
    });

  console.log(order, "wow");

  res.render("user/orderDetailed", { userData, order });
});

//get cancelorder page
const getCancelOrderPage = asyncHandler(async (req, res) => {
  const orderId = req.query.id;
  
  if (!orderId) {
      return res.status(400).render('error', {
          message: 'Order ID is required'
      });
  }

  try {
      const order = await Order.findById(orderId)
          .populate('user_id')
          .populate('address')
          .populate({
              path: 'items.product',
              model: 'Product'
          });

      if (!order) {
          return res.status(404).render('error', {
              message: 'Order not found'
          });
      }

     

      res.render('user/cancelreason', { order });

  } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).render('error', {
          message: 'Error loading order details'
      });
  }
});

//cancel order or change the order status
const orderCancel = asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;
  const userId = req.session.user_id;

  // Input validation
  if (!orderId || !reason) {
    return res.status(400).json({
      success: false,
      message: "Order ID and cancellation reason are required"
    });
  }

  // Find and validate order
  const order = await Order.findOne({ _id: orderId })
    .populate("user_id")
    .populate({
      path: "address",
      model: "Address",
    })
    .populate({
      path: "items.product",
      model: "Product",
    });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  try {
    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Cancelled",
          cancellationReason: reason
        }
      },
      { new: true }
    );

 // Restore product quantities
 await Promise.all(order.items.map(async (item) => {
  await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.qty } }
  );
}));

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
     
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message
    });
  }
});





    







module.exports={orderCancel,getCancelOrderPage,getCheckOutPage,checkOutPost,loadOrderDetails, singleOrderDetails}