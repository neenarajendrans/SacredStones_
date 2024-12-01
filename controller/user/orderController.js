const asyncHandler = require("express-async-handler");
const Address = require("../../model/addressModel");
const User = require("../../model/userModel");
const Cart = require("../../model/cartModel");
const Product = require("../../model/productModel");
const {
  calculateProductTotal,
  calculateSubtotal,
} = require("../../config/cartSum");
const Order = require("../../model/orderModel");
const {handleWalletTransaction} = require("./walletController"); 


function generateOrderId (){
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let orderId = '';
  for(let i =0; i<8; i++){
    const randomIndex = Math.floor(Math.random()*characters.length)
      orderId += characters[randomIndex];
    
  }
  return orderId;
}

// Update order status to placed
const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;
    // Validate order ID
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }
    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Placed",
          paymentStatus: "Pending", // For COD orders, payment status remains pending
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    // Clear cart after order is placed
    await Cart.findOneAndUpdate(
      { user_id: updatedOrder.user_id },
      { $set: { products: [], total: 0 } },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
});

// Get Checkout page
const getCheckOutPage = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;

  const userData = await User.findById(userId);

  const cart = await Cart.findOne({ user_id: userId })
    .populate({
      path: "products.productData_id",
      model: "Product",
    })
    .exec();
  console.log(cart, "cart page");

  if (!cart) {
    console.log("Cart not found.");
  }
  const cartItems = cart.products || [];
  const subtotal = calculateSubtotal(cartItems);
  const productTotal = calculateProductTotal(cartItems);
  const subtotalWithShipping = subtotal;
  const addressData = await Address.find({ user_id: userId });
  res.render("user/checkOut", {
    userData,
    addressData,
    cart: cartItems,
    productTotal,
    subtotalWithShipping,
  });
});

// post Checkout page
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
      return res
        .status(404)
        .json({ success: false, message: "User or cart not found" });
    }
    if (!cart.products || cart.products.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }
    if (!address) {
      return res.status(400).json({ message: "Billing address not selected" });
    }
    
    // Check product stock before proceeding
    for (const item of cart.products) {
      const product = await Product.findById(item.productData_id._id);
      if (!product || product.stock < item.qty) {
        return res.status(400).json({
          message: `Insufficient stock for product ${
            product ? product.name : "Unknown"
          }`,
        });
      }
    }
    const cartItems = cart.products;
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + (item.productData_id.discount_price * item.qty || 0),
      0
    );
    console.log("here----", req.session.appliedCoupon);
    // Get coupon information from session
    const appliedCoupon = req.session.appliedCoupon || null;
    let couponCode = null;
    let couponDiscount = 0;
    let total = totalAmount;
    let orderstatus = "Pending";
    let paymentstatus = "Pending"
    // If coupon is applied, calculate the discounted total
    if (appliedCoupon) {
      couponCode = appliedCoupon.couponCode;
      couponDiscount = appliedCoupon.discount;
      total = totalAmount - couponDiscount;
    }
    if(paymentMethod==="CashOnDelivery"){
      orderstatus = "Placed"
      paymentstatus = "Pending" 

    }else if(paymentMethod === "Online"){
      orderstatus = "Pending"
      paymentstatus = "Pending"

    }else if(paymentMethod ==="Wallet"){
      orderstatus = "Pending"
      paymentstatus = "Pending"
    }

    // Create new order
    const order = new Order({
      orderId: generateOrderId(),
      user_id: userId,
      address: address,
      orderDate: new Date(),
      orderStatus: orderstatus,
      paymentMethod: paymentMethod,
      paymentStatus: paymentstatus,
      deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
      totalAmount: totalAmount,
      finalAmount: total,
      discount: couponDiscount,
      items: cartItems.map((cartItem) => ({
        product: cartItem.productData_id._id,
        name: cartItem.productData_id.name,
        image: cartItem.productData_id.images[0],
        qty: cartItem.qty,
        price: cartItem.productData_id.discount_price,
      })),
    });

    // Save order
    const savedOrder = await order.save();
    // Update product stock - FIXED VERSION
    await Promise.all(
      cartItems.map((item) =>
        Product.findByIdAndUpdate(
          item.productData_id._id,
          { $inc: { stock: -item.qty } },
          { new: true }
        )
      )
    );

    // Clear cart
    if (savedOrder.orderStatus === "Placed") {
      await Cart.findByIdAndUpdate(
        cart._id,
        { $set: { products: [], total: 0 } },
        { new: true }
      );
    }
    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      details: error.message,
    });
  }
});

//Get orderDatail page
const loadOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  const userData = await User.findById(userId);
  let page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  const limitno = 5;
  const order = await Order.find({ user_id: userData._id })
    .populate("user_id")
    .populate({
      path: "items.product",
      model: "Product",
    })
    .limit(limitno * 1)
    .skip((page - 1) * limitno)
    .sort({ createdAt: -1 });
  console.log(order, " Details");
  const count = await Order.find({user_id: userData._id }).countDocuments();
  let totalPages = Math.ceil(count / limitno);
  if (userData) {
    res.render("user/orders", { userData, order,totalPages, currentPage: page });
  } else {
    res.redirect("/login");
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
      path: "address", // The field name in your schema is 'address'
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
    return res.status(400).render("error", {
      message: "Order ID is required",
    });
  }
  try {
    const order = await Order.findById(orderId)
      .populate("user_id")
      .populate("address")
      .populate({
        path: "items.product",
        model: "Product",
      });
    if (!order) {
      return res.status(404).render("error", {
        message: "Order not found",
      });
    }
    res.render("user/cancelreason", { order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).render("error", {
      message: "Error loading order details",
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
      message: "Order ID and cancellation reason are required",
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
      message: "Order not found",
    });
  }
  try {
    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Cancelled",
          cancellationReason: reason,
        },
      },
      { new: true }
    );
    // Restore product quantities
    await Promise.all(
      order.items.map(async (item) => {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.qty },
        });
      })
    );
    //refund
    if (order.paymentStatus === "Paid") {
      const refundAmount = order.finalAmount;
      
      try {
        await handleWalletTransaction(
          order.user_id,
          refundAmount,
          "credit",
          `Refund for order ${orderId}`
        );
        order.paymentStatus = "Refunded";
        await order.save();
      } catch (error) {
        console.error("Error processing wallet refund:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to process wallet refund",
          error: error.message,
        });
      }
    }
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Order cancellation error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  }
});

module.exports = {
  orderCancel,
  getCancelOrderPage,
  getCheckOutPage,
  checkOutPost,
  loadOrderDetails,
  singleOrderDetails,
  updateOrderStatus,
};
