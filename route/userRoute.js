const express = require('express');
const userRoute = express.Router();
const userController = require('../controller/user/userController');
const productController = require('../controller/user/productController');
const addressController = require('../controller/user/addressController');
const { isLoggedin } = require('../middleware/authenticationMiddleware');
const passport= require('passport')
const {isBlocked} = require("../middleware/accessAuthentication")


userRoute.get('/', userController.getIndexPage);
userRoute.get('/home', isBlocked,isLoggedin, userController.getHomePage);
userRoute.get('/about', isBlocked,isLoggedin, userController.getAboutPage);
userRoute.get('/contact',isBlocked, isLoggedin, userController.getContactPage);
userRoute.get('/jewellery',userController.getJewelleryPage);
userRoute.get('/login',userController.getLoginPage);
userRoute.get('/signup', userController.getSignupPage);
userRoute.get('/otp', userController.getOtpPage);
userRoute.get('/productdetail', userController.getProductDetailPage);
userRoute.get('/categoryfiltered',isBlocked,isLoggedin, userController.getCategoryFilteredPage);
userRoute.post('/otp', userController.verifyOtp);
userRoute.post('/signup', userController.registerUser);
userRoute.post('/login', userController.verifyUser);
userRoute.get('/logout', isBlocked,userController.logout);
userRoute.get('/resend', userController.resendOTP);
userRoute.get('/userprofile',isBlocked, isLoggedin,userController.getProfile);
userRoute.get('/useraccount', isBlocked,isLoggedin,userController.getUserAccount);
userRoute.get('/orders', isBlocked,isLoggedin,userController.renderUserOrders);
userRoute.get('/wishlist',isBlocked, isLoggedin,userController.getUserAccount);
userRoute.get('/useraddress',isBlocked, isLoggedin,addressController.renderUserAddress);
userRoute.get('/editaddress',isBlocked, isLoggedin,addressController.renderEditUserAddress);
userRoute.get('/addaddress',isBlocked, isLoggedin,addressController.renderAddUserAddress);
userRoute.post('/addaddress',isBlocked, isLoggedin,addressController.addNewAddress);
userRoute.post('/editaddress', isBlocked,isLoggedin,addressController.editAddress);
userRoute.get('/deleteaddress',isBlocked, isLoggedin,addressController.deleteAddress);

//sort
// userRoute.get('/sort',isBlocked, isLoggedin,userController.sort);

// google-auth


userRoute.get("/auth/google", passport.authenticate('google',{scope:['profile','email']}));
userRoute.get("/auth/google/callback", passport.authenticate('google',{failureRedirect:"/"}),(req,res)=>{
    req.session.user_id = req.user._id; 
    res.redirect("/home");
});

// Forgot Password
userRoute.get("/forgotPasswordEmail", userController.renderForgotPasswordEmail);
userRoute.post("/sendforgotEmail", userController.forgotOTP);
userRoute.get("/resetpassword", userController.getResetPassword);
userRoute.post("/updatepassword", userController.updatePassword);

//Error Pages
userRoute.get('/errorpage', userController.getErrorPage);


module.exports = userRoute;
