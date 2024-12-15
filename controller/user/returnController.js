//get cancelorder page
const asyncHandler = require("express-async-handler");
const Order = require("../../model/orderModel");

const getReturnOrderPage = asyncHandler(async (req, res) => {
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
    res.render("user/returnreason", { order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).render("error", {
      message: "Error loading order details",
    });
  }
});

//return order or change the order status
const orderReturn = asyncHandler(async (req, res) => {
  const { orderId, reason, details } = req.body;
  const userId = req.session.user_id;

  // Input validation
  if (!orderId || !reason) {
    return res.status(400).json({
      success: false,
      message: "Order ID and Return reason are required",
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
    // Combine reason and details into a single returnReason field
    const combinedReason = details ? `${reason}: ${details}` : reason;

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Return Request",
          returnReason: combinedReason,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Requested for Return the Product",
    });
  } catch (error) {
    console.error("Order return request error:", error);
    res.status(500).json({
      success: false,
      message: "Error during return request",
      error: error.message,
    });
  }
});

// to restock the items
// await Promise.all(
//   order.items.map(async (item) => {
//     await Product.findByIdAndUpdate(item.product, {
//       $inc: { stock: item.qty },
//     });
//   })
// );
module.exports = {
  getReturnOrderPage,
  orderReturn,
};
