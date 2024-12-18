const User = require("../../model/userModel");
const Product = require("../../model/productModel");
const Wishlist = require("../../model/wishlistModel");
const mongoose = require("mongoose");

const addtoWishlist = async (req, res) => {
  try {
    // 1. Check authentication
    if (!req.session.user_id) {
      return res.status(401).json({
        status: false,
        title:"Please Login",
        message: "Please login to add items to wishlist",
      });
    }

    const userId = req.session.user_id;
    const productId = req.body.productId;

    // 2. Validate product ID
    if (!productId) {
      return res.status(400).json({
        status: false,
        message: "Product ID is required",
      });
    }

    // 3. Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }

    // 4. Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        products: [],
      });
    }

    // 5. Check if product exists in wishlist
    const productExists = wishlist.products.some(
      (item) => item.productId.toString() === productId
    );

    // 6. Remove or add product
    if (productExists) {
      
      wishlist.products = wishlist.products.filter(
        (item) => item.productId.toString() !== productId
      );
      return res.status(200).json({status:false,message:"Product already in wishlist"});

 
    } else {
      console.log("Adding to wishlist")
      // Add product
      wishlist.products.push({
        productId,
        addedOn: new Date(),
      });
    
    }

    // 7. Save wishlist
    await wishlist.save();
    console.log(wishlist)

    // 8. Send response matching frontend expectations
    return res.status(200).json({
      status: true, 
      message: `Product added to wishlist successfully`,
      
    });
  } catch (error) {
    console.error("Wishlist operation error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to update wishlist",
      error: error.message,
    });
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 12;

    console.log("User ID:", userId); // Debug log

    // Find wishlist and populate all product fields
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: "products.productId",
        model: "Product",
        select: {
          _id: 1,
          name: 1,
          images: 1,
          gross_weight: 1,
          gold_purity: 1,
          total_price: 1,
          discount_price: 1,
        },
      })
      .exec();

    console.log("Wishlist found:", wishlist); // Debug log

    if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
      return res.render("user/wishlist", {
        wishlist: [],
        currentPage: 1,
        totalPages: 1,
        itemsPerPage,
      });
    }

    // Remove the is_listed filter
    const availableProducts = wishlist.products;

    console.log("Available Products:", availableProducts); // Debug log

    // Format wishlist items with all populated fields
    const formattedWishlist = availableProducts.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      images: item.productId.images,
      gross_weight: item.productId.gross_weight,
      gold_purity: item.productId.gold_purity,
      total_price: item.productId.total_price,
      discount_price: item.productId.discount_price,
      addedOn: item.addedOn,
    }));

    console.log("Formatted Wishlist:", formattedWishlist); // Debug log

    // Pagination
    const totalItems = formattedWishlist.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedWishlist = formattedWishlist.slice(startIndex, endIndex);

    return res.render("user/wishlist", {
      wishlist: paginatedWishlist,
      currentPage: page,
      totalPages: totalPages,
      itemsPerPage: itemsPerPage,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).render("user/404", { message: "Error fetching wishlist" });
  }
};

// Updated controller with proper session user_id reference
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id; // Changed from user to user_id to match your session structure
    const productId = req.body.productId;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    const productIndex = wishlist.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.log("An error occurred while removing item from wishlist", error);
    res.status(500).json({
      success: false,
      message: "Error removing product from wishlist",
      error: error.message,
    });
  }
};

module.exports = {
  addtoWishlist,
  getWishlist,
  removeFromWishlist,
};
