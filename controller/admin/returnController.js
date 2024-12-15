const Order = require("../../model/orderModel");
const asyncHandler = require("express-async-handler");
const Wallet = require("../../model/walletModel");
const {
  handleWalletTransaction,
} = require("../../controller/user/walletController");

const getRequestPage = asyncHandler(async (req, res) => {
  const orders = await Order.find({ orderStatus: "Return Request" })
    .populate("user_id", "fullName email") // Populate user details
    .sort({ orderDate: -1 }); // Sort by most recent order first

  // Render the return request page with orders
  res.render("admin/return", {
    orders: orders,
    title: "Return Requests",
  });
});

const approveReturnRequest = asyncHandler(async (req, res) => {
  try {
    console.log(req.params);

    const { orderId } = req.params;

    // Validate input
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update the order status to "Returned"
    order.orderStatus = "Returned";

    await order.save();
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
      message: "Return request approved and processed successfully",
      order,
    });
  } catch (error) {
    console.error("Error approving return request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve return request",
      error: error.message,
    });
  }
});

module.exports = {
  getRequestPage,
  approveReturnRequest,
};
