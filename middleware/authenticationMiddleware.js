const User = require("../model/userModel");
const Cart = require('../model/cartModel');
const session = require('express-session')

// User Authentication Middleware
const isLoggedin = async(req, res, next) => {
  
  if (req.session.user_id) {
    return next();
  } else {
    res.redirect("/login");
  }
};

// Cache-Control middleware
const disableCacheMiddleware = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};

// Admin Authentication Middleware
const isAdminLoggedin = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  } else {
    res.redirect("/login");
  }
};

// User Control Middleware
const isBlockedMiddleware = async (req, res, next) => {
  if (req.session.user_id) {
    try {
      const user = await User.findById(req.session.user_id);

      // Check if user exists and is blocked
      if (user && user?.is_blocked) {
        console.log('User is blocked. Redirecting to login.');
        req.session.user_id = null;
        req.session.message = "Your account is blocked. Please contact support.";
        res.redirect("/login");
      } else {
        next();
      }
    } catch (error) {
      console.error('Error finding user:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    // No user_id in session, proceed to next middleware or route
    next();
  }
};


// Admin Logout Middleware
const isAdminLoggedOut = (req, res, next) => {
  if (!req.session.isAdmin) {
    next();
  } else {
    res.redirect("/admin");
  }
};

// Cart Middleware
const loggedInCart = async (req, res, next) => {
  if (req.session.user_id || req.session.isAdmin) {
    res.locals.isLoggedin = true;
    const cart = await Cart.findOne({ user_id: req.session.user_id });
    res.locals.cartQty = cart?.products?.length;
  } else {
    res.locals.isLoggedin = false;
    res.locals.cartQty = null;
  }
  next();
};

// User Logout Middleware
const isLoggedOut = (req, res, next) => {
  if (!req.session.user_id) {
    next();
  } else {
    res.redirect("/");
  }
};

module.exports = {
  isLoggedin,
  disableCacheMiddleware,
  isAdminLoggedin,
  isLoggedOut,
  loggedInCart,
  isAdminLoggedOut,
  isBlockedMiddleware,
 

};
