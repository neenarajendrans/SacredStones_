const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const Order = require("../../model/orderModel")
const Address = require("../../model/addressModel")


const getOrderPage = async (req, res) => {
  try {
      // Get page number from query params or default to 1
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Number of orders per page
      
      // Get filter parameters
      const { orderStatus, paymentStatus, search } = req.query;
      
      // Build filter object
      let filter = {};
      if (orderStatus) filter.status = orderStatus;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (search) {
          filter.$or = [
              { '_id': { $regex: search, $options: 'i' } },
              { 'user_id.fullName': { $regex: search, $options: 'i' } }
          ];
      }

      // Get orders with pagination
      const orders = await Order.find(filter)
          .populate('user_id', 'fullName email') // Populate user details
          .sort({ orderDate: -1 }) // Sort by order date descending
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(); // Use lean() for better performance

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(filter);
      const totalPages = Math.ceil(totalOrders / limit);

      res.render('admin/orderManagement', {
          orders,
          currentPage: page,
          totalPages,
          totalOrders,
          filter: {
              orderStatus,
              paymentStatus,
              search
          }
      });

  } catch (error) {
      console.error('Error in getOrderPage:', error);
      res.status(500).render('error', {
          message: 'Error loading orders',
          error: process.env.NODE_ENV === 'development' ? error : {}
      });
  }
};

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
    ).populate('user_id')
      .populate('items.product')
      .populate('address');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found',
      });
    }
   
   res.redirect('/admin/ordermanagement')
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating order status' 
    });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate({
        path: 'address', // Changed from 'Address' to 'address' to match schema
        populate: {
          path: 'user_id',
          select: 'fullName email'
        }
      })
      .populate({
        path: 'items.product',
        select: 'name discount_price images category',
        populate:{
          path:'category',
        }
      })
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.render('admin/orderDetail', { order });
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    res.status(500).json({ error: 'Error loading order details' });
  }
};

const cancelOrder = async (req, res) => {
  try {
      const orderId = req.params.id;
      
      // Find and update the order
      const order = await Order.findByIdAndUpdate(
          orderId,
          {
              $set: {
                  orderStatus: 'Cancelled',
                  
              }
          },
          { new: true } // This option returns the updated document
      );

      if (!order) {
          
          return res.send('order not found');
      }

      // // If the payment method was online and payment status is paid
      // if (order.paymentMethod === 'Online' && order.paymentStatus === 'Paid') {
      //     // Add the amount back to user's wallet
      //     await User.findByIdAndUpdate(
      //         order.user_id,
              // {
              //     $inc: { walletBalance: order.finalAmount },
              //     $push: {
              //         walletHistory: {
              //             amount: order.finalAmount,
              //             type: 'Credit',
              //             description: `Refund for cancelled order #${order.orderId}`
              //         }
              //     }
              // }
      //     );
      // }

      // Update product stock
      for (const item of order.items) {
          await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.qty } } // Increase stock by cancelled quantity
          );
      }

      
      res.redirect(`/admin/ordermanagement`);

  } catch (error) {
      console.error('Error cancelling order:', error);
      req.flash('error', 'Failed to cancel order');
      res.redirect('/admin/ordermanagement');
  }
};


module.exports = {
  cancelOrder,
  getOrderPage,
  updateOrderStatus,
  getOrderDetails
};

