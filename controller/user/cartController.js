const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Cart = require("../../model/cartModel");
const Product = require("../../model/productModel");
const { model } = require("mongoose");
const {
  calculateProductTotal,
  calculateSubtotal,
} = require("../../config/cartSum");

// Get cart page
const getCartPage = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  console.log("userId:", userId);
  const userData = await User.findById(userId);
  
  if (userData) {
    const userCart = await Cart.findOne({ user_id: userId }).populate(
      "products.productData_id"
    );

    if (userCart) {
      const cart = userCart ? userCart.products : [];
      const subtotal = calculateSubtotal(cart);
      const productTotal = calculateProductTotal(cart);
      const subtotalWithShipping = subtotal;
      
      // Flag to track out-of-stock products
      let hasOutOfStockProducts = false;
      
      // Check for out-of-stock or insufficient stock products
      const updatedCart = cart.map(cartItem => {
        const product = cartItem.productData_id;
        
        // Mark product as out of stock if stock is insufficient
        if (product.stock < cartItem.qty || product.stock === 0) {
          hasOutOfStockProducts = true;
          return {
            ...cartItem.toObject(),
            isOutOfStock: true
          };
        }
        
        return cartItem;
      });

      // Check for max quantity exceeded
      let maxQuantityExceeded = cart.some(cartItem => 
        cartItem.qty > 5 || cartItem.qty > cartItem.productData_id.stock
      );

      res.render("user/cart", {
        userData,
        productTotal,
        subtotalWithShipping,
        hasOutOfStockProducts,
        maxQuantityExceeded,
        cart: updatedCart,
        // Pass a flag to control checkout button visibility
        canProceedToCheckout: !hasOutOfStockProducts && cart.length > 0
      });
    } else {
      // Handle scenario where user has no cart
      res.render("user/cart", { 
        userData, 
        cart: [], 
        subtotalWithShipping: 0,
        canProceedToCheckout: false
      });
    }
  } else {
    res.redirect("/login");
  }
});
//Add to cart
const addtoCart = asyncHandler(async (req, res) => {
  console.log("123");
  console.log(req.body.qty);

  // Guest User
  if (!req.session.user_id) {
    return res.status(200).json({
      success: false,
      message: "Please login to your account to make a purchase",
    });
  }

  const userId = req.session.user_id;
  const productId = req.body.productData_id;
  const qty = parseInt(req.body.qty, 10); // what is this 10 for?
  const stock = parseInt(req.body.stock, 10); // what is this 10 for?
  console.log("userId:", userId);
  console.log("product_Id:", productId);
  console.log("qty:", qty);
  console.log("stock:", stock);

  if (!userId || !productId || isNaN(qty) || qty <= 0) {
    // Handle missing or invalid parameters
    return res
      .status(400)
      .json({ success: false, error: "Invalid parameters" });
  }

  const product = await Product.findById(productId);
  if (!product || product.stock < qty) {
    return res
      .status(400)
      .json({ success: false, message: "Insufficient stock" });
  }

  //check product status
  if (
    product.status !== "Available" ||
    !product.is_listed ||
    product.isDeleted
  ) {
    return res.status(404).json({ success: false, error: "Product not Found" });
  }
  const maxQuantityPerUser = 5;
  const existingCart = await Cart.findOne({ user_id: userId });
  console.log(existingCart);

  if (existingCart) {
    const existingCartItem = existingCart.products.find(
      (item) => item.productData_id.toString() === productId
    );

    if (existingCartItem) {
      const newQuantity = existingCartItem.qty + qty;

      // Check if the new quantity exceeds maximum limit
      if (newQuantity > maxQuantityPerUser) {
        const availableToAdd =
          product.stock < maxQuantityPerUser
            ? product.stock - existingCartItem.qty
            : maxQuantityPerUser - existingCartItem.qty;

        return res.status(400).json({
          success: false,
          message: `Cannot add ${qty} more items. you can only add ${availableToAdd} more items to this product`,
        });
      } else if (newQuantity > product.stock) {
        // ask chat gpt to help to set a limit to the cart item quantity here somewhere
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }

      existingCartItem.qty = newQuantity;
    } else {
      if (qty > product.stock) {
        // ask chat gpt to help to set a limit to the cart item quantity here somewhere
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }

      existingCart.products.push({
        productData_id: productId,
        qty: qty,
      });
    }

    // Update the cart total
    existingCart.total = existingCart.products.reduce(
      (total, item) => total + (item.qty || 0),
      0
    );

    await existingCart.save();
  } else {
    const newCart = new Cart({
      user_id: userId,
      products: [{ productData_id: productId, qty: qty }],
      total: qty,
    });

    await newCart.save();
  }

  return res.status(200).json({
    success: true,
    message: "Product added to cart successfully",
  });
});

// update cart
const updateQuantity = asyncHandler(async (req, res) => {
  const productId = req.query.productId;
  const newQuantity = parseInt(req.query.quantity);
  const userId = req.session.user_id;
  

  const existingCart = await Cart.findOne({ user_id: userId });
  if (existingCart) {
    const existingCartItem = existingCart.products.find(
      (item) => item.productData_id.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.qty = newQuantity;
      existingCart.total = existingCart.products.reduce(
        (total, item) => total + (item.qty || 0),
        0
      );

      await existingCart.save();
    }

    res.json({ success: true });
  } else {
    res.json({ success: false, error: "Cart not found" });
  }
});

// delete cart item
const deleteCartItem = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  const productId = req.query.productId;
  const existingCart = await Cart.findOne({ user_id: userId });
  if (existingCart) {
    const updatedItems = existingCart.products.filter(
      (item) => item.productData_id.toString() !== productId
    );

    existingCart.products = updatedItems;
    existingCart.total = updatedItems.reduce(
      (total, item) => total + (item.qty || 0),
      0
    );

    await existingCart.save();

    res.json({ success: true, toaster: true });
  } else {
    res.json({ success: false, error: "Cart not found" });
  }
});
// clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.session.user_id; // or however you store the user ID
    await Cart.deleteMany({ user_id: userId });

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCartPage,
  addtoCart,
  updateQuantity,
  deleteCartItem,
  clearCart,
};
