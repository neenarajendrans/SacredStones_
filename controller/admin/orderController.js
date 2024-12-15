const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const Order = require("../../model/orderModel");
const Address = require("../../model/addressModel");
const { handleWalletTransaction } = require("../user/walletController");

//Get order management page
const getOrderPage = async (req, res) => {
  try {
    // Get page number from query params or default to 1
    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Number of orders per page

    // Get orders with pagination
    const orders = await Order.find({ orderStatus: { $ne: "Pending" } })
      .populate("user_id", "fullName email") // Populate user details
      .sort({ orderDate: -1 }) // Sort by order date descending
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean() for better performance

    // Get total count for pagination
    const totalOrders = await Order.countDocuments({
      orderStatus: { $ne: "Pending" },
    });
    const totalPages = Math.ceil(totalOrders / limit);
    res.render("admin/orderManagement", {
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    console.error("Error in getOrderPage:", error);
    return res.redirect('/admin/errorpage');
  }
};

//update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("Order ID:", id);
    console.log("New Status:", status);

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus: status },
      { new: true }
    )
      .populate("user_id")
      .populate("items.product")
      .populate("address");

    if (!order) {
      return res.redirect('/admin/errorpage');
    }

    res.redirect("/admin/ordermanagement");
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.redirect('/admin/errorpage');
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate({
        path: "address", // Changed from 'Address' to 'address' to match schema
        populate: {
          path: "user_id",
          select: "fullName email",
        },
      })
      .populate({
        path: "items.product",
        select: "name discount_price images category",
        populate: {
          path: "category",
        },
      })
      .lean();

    if (!order) {
      return res.redirect('/admin/errorpage');
    }

    res.render("admin/orderDetail", { order });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    return res.redirect('/admin/errorpage');
  }
};

// cancel order
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find and update the order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Cancelled",
        },
      },
      { new: true } // This option returns the updated document
    );

    if (!order) {
      return res.render("admin/errorPage", { message: "Order not found " });
    }

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
       return res.redirect('/admin/errorpage');
      }
    }
    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.qty } } // Increase stock by cancelled quantity
      );
    }

    res.redirect(`/admin/ordermanagement`);
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.redirect('/admin/errorpage');
  }
};

module.exports = {
  cancelOrder,
  getOrderPage,
  updateOrderStatus,
  getOrderDetails,
};
