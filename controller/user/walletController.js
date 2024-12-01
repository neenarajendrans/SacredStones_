const Wallet = require("../../model/walletModel");
const Order = require("../../model/orderModel");
const Product = require("../../model/productModel");

const getWallet = async (req, res) => {
  try {
    const userId = req.session.user_id; // assuming session contains user id

    // Check if the wallet exists for the user
    let wallet = await Wallet.findOne({ userId }).lean();

    // If no wallet exists, create a new one with default balance
    if (!wallet) {
      // Creating a new wallet with default balance
      wallet = new Wallet({
        userId: userId, // Assign the user ID
        balance: 0, // Initial balance of 0
        transactions: [], // No transactions initially
      });

      await wallet.save(); // Save the wallet to the database
      console.log("New wallet created:", wallet);
    }

    res.render("user/wallet", { wallet });
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).render("user/wallet", { message: "Error fetching wallet" });
  }
};
// Function to create or update wallet
const handleWalletTransaction = async (userId, amount, type, description) => {
  try {
    const wallet = await Wallet.findOne({ userId });

    if (wallet) {
      // Update existing wallet
      const newBalance =
        type === "credit" ? wallet.balance + amount : wallet.balance - amount;

      // Ensure balance doesn't go below 0
      if (newBalance < 0) {
        throw new Error("Insufficient wallet balance");
      }

      wallet.balance = newBalance;
      wallet.transactions.push({
        type,
        amount,
        description,
        date: new Date(),
      });

      return await wallet.save();
    } else {
      // Create new wallet
      const newWallet = new Wallet({
        userId,
        balance: amount,
        transactions: [
          {
            type,
            amount,
            description,
            date: new Date(),
          },
        ],
      });

      return await newWallet.save();
    }
  } catch (error) {
    console.error("Error handling wallet transaction:", error);
    throw error;
  }
};

const handleWalletPayment = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { orderId } = req.body;
    
    // Validate input
    if (!userId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Order ID are required"
      });
    }

    // Get the order details with error handling
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get the order amount
    const orderAmount = order.totalAmount;

    // Get user's wallet with error handling
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Check if wallet has sufficient balance
    if (wallet.balance < orderAmount) {
      // Rollback order status
      order.orderStatus = "Cancelled";
      order.paymentStatus = "Failed";
      order.items.map(async (item) => {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.qty },
          });
        })
        await order.save()
      

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Process the wallet transaction
    try {
      // Ensure handleWalletTransaction is properly defined
      await handleWalletTransaction(
        userId,
        orderAmount,
        "debit",
        `Payment for order ${orderId}`
      );

      // Update order status
      order.paymentStatus = "Paid";
      order.orderStatus = "Placed";
      order.paymentMethod = "Wallet";
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        orderId: order._id,
      });
    } catch (transactionError) {
      // More detailed error logging
      console.error("Wallet Transaction Error:", {
        message: transactionError.message,
        stack: transactionError.stack,
        userId,
        orderId,
        orderAmount
      });

      // Rollback any partial changes
      order.paymentStatus = "Failed";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Wallet transaction failed",
        error: transactionError.message
      });
    }
  } catch (error) {
    // Comprehensive error logging
    console.error("Wallet Payment Error:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update the module exports to include the new function
module.exports = {
  getWallet,
  handleWalletPayment,
  handleWalletTransaction,
};
