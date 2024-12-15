const User = require("../../model/userModel");
const Order = require("../../model/orderModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");

// Helper function to get date range based on period
const getDateRange = (period) => {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case "daily":
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - 12 * 7); // Last 12 weeks
      break;
    case "monthly":
      startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
      break;
    case "yearly":
      startDate.setFullYear(startDate.getFullYear() - 5); // Last 5 years
      break;
    default:
      startDate.setFullYear(startDate.getFullYear() - 1); // Default to last year
  }

  return { startDate, endDate };
};

//function for fetching sales data
const fetchSalesData = async (period) => {
  const { startDate, endDate } = getDateRange(period);

  const salesData = await Order.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: {
          $nin: [
            "Returned",
            "Cancelled",
            "Return Request",
            "Failed",
            "Pending",
          ],
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
        totalSales: { $sum: "$finalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return salesData;
};

//function for fetching product data
const fetchTopProducts = async (period) => {
  const { startDate, endDate } = getDateRange(period);

  const topProducts = await Order.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: {
          $nin: [
            "Returned",
            "Cancelled",
            "Return Request",
            "Failed",
            "Pending",
          ],
        },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        salesCount: { $sum: "$items.qty" },
        totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
      },
    },
    { $sort: { salesCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        _id: 1,
        productName: "$productInfo.name",
        salesCount: 1,
        totalRevenue: 1,
      },
    },
  ]);

  return topProducts;
};

//function for fetching categories data
const fetchTopCategories = async (period) => {
  const { startDate, endDate } = getDateRange(period);

  const topCategories = await Order.aggregate([
    {
      $match: {
        orderDate: { $gte: startDate, $lte: endDate },
        orderStatus: {
          $nin: [
            "Returned",
            "Cancelled",
            "Return Request",
            "Failed",
            "Pending",
          ],
        },
      },
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $group: {
        _id: "$productInfo.category",
        salesCount: { $sum: "$items.qty" },
        totalRevenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
      },
    },
    { $sort: { salesCount: -1 } },
    { $limit: 3 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: "$categoryInfo" },
    {
      $project: {
        _id: 1,
        name: "$categoryInfo.name",
        salesCount: 1,
        totalRevenue: 1,
      },
    },
  ]);

  return topCategories;
};

const loadDashboard = async (req, res) => {
  try {
    const period = "monthly"; 
    const salesData = await fetchSalesData(period);
    const topProducts = await fetchTopProducts(period);
    const topCategories = await fetchTopCategories(period);
    const totalProducts = await Product.find({}).countDocuments();
    const totalOrders = await Order.countDocuments({
        orderStatus: { $ne: "Pending" },
      });
    const totalCategories = await Category.countDocuments();
    const orders = await Order.find({
     orderStatus: { $in: ["Confirmed", "Delivered"] }
      });
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      const query = {
          orderStatus: { $in: ["Confirmed", "Delivered"] }
      };
      query.createdAt = { $gte: monthStart };
      
      const monthlyOrders = await Order.find(query);
    const monthly = monthlyOrders.reduce((sum, order) => sum + order.finalAmount, 0);
    const revenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);

    return res.render("admin/adminPanel", {
      salesData: JSON.stringify(salesData),
      topProducts: topProducts,
      topCategories: topCategories,
      totalProducts,
      totalCategories,
      totalOrders,
      revenue,
      monthly
    });
  } catch (error) {
    console.error("Error in loadDashboard:", error.message);
   
    return res.render("admin/errorPage", { message: "An error occurred while loading the dashboard" });
  }
};

const updateSalesData = async (req, res) => {
  try {
    const { period } = req.query;
    const salesData = await fetchSalesData(period);
    res.json(salesData);
  } catch (error) {
    console.error("Error in updateSalesData:", error.message);
    
    return res.render("admin/errorPage", { message: "Error fetching Sales Data" });
  }
};

const updateTopProducts = async (req, res) => {
  try {
    const { period } = req.query;
    const topProducts = await fetchTopProducts(period);
    res.json(topProducts);
  } catch (error) {
    console.error("Error in updateTopProducts:", error.message);
   
    return res.render("admin/errorPage", { message: "Error Fetching top Products" });
  }
};

const updateTopCategories = async (req, res) => {
  try {
    const { period } = req.query;
    const topCategories = await fetchTopCategories(period);
    res.json(topCategories);
  } catch (error) {
    console.error("Error in updateTopCategories:", error.message);
    
    return res.render("admin/errorPage", { message: "Error fetching top categories" });
  }
};

module.exports = {
  loadDashboard,
  updateSalesData,
  updateTopCategories,
  updateTopProducts,
};
