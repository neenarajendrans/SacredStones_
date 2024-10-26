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
    res.redirect("/admin/login");
  }
};




// // Admin Logout Middleware
// const isAdminLoggedOut = (req, res, next) => {
//   if (!req.session.isAdmin) {                   Is these two middleware required 
//     next();
//   } else {
//     res.redirect("/admin/login");
//   }
// };



// // User Logout Middleware
// const isLoggedOut = (req, res, next) => {
//   if (!req.session.user_id) {
//     next();
//   } else {
//     res.redirect("/");
//   }
// };

module.exports = {
  isLoggedin,
  disableCacheMiddleware,
  isAdminLoggedin,
 
 
 

};
