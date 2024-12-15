const env = require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Cart = require("../../model/cartModel");
const User = require("../../model/userModel");
const Order = require("../../model/orderModel");
const Product = require("../../model/productModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log(`orderID : ${req.body.orderId}`);
    const isRazorpayOrderId = orderId.startsWith("order_");

    let order;
    if (isRazorpayOrderId) {
      // If it's a Razorpay order ID, find the order by razorpayOrderId
      order = await Order.findOne({ razorpayOrderId: orderId });
    } else {
      // If it's a MongoDB Order ID, find by _id
      order = await Order.findById(orderId);
    }
    // Fetch the order details from your database
    // const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: order.finalAmount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: orderId,
      payment_capture: 1,
    });

    // Update the order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Fetch user details
    const user = await User.findById(order.user_id);

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.phoneNumber,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating Razorpay order" });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Payment is successful
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      const cart = await Cart.findOne({ user_id: req.session.user_id });
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      } else {
        await Cart.findByIdAndUpdate(
          cart._id,
          { $set: { products: [], total: 0 } },
          { new: true }
        );
      }

      // Update order status and payment status
      order.orderStatus = "Placed";
      order.paymentStatus = "Paid";
      // order.status = "Confirmed";
      await order.save();

      // Update product stock
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.qty } },
            { new: true }
          )
        )
      );

      res.json({
        success: true,
        message: "Payment verified successfully",
        orderId: order._id,
      });
    } else {
      // If signature verification fails, update order status to 'Failed'
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (order) {
        order.paymentStatus = "Failed";
        order.orderStatus = "Cancelled";
        order.items.map(async (item) => {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.qty },
          });
        });
      }
      await order.save();

      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying payment" });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
