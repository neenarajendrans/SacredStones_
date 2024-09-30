const express = require('express');
const userRoute = express.Router();
const userController = require('../controller/user/userController');
const { isBlockedMiddleware,isLoggedin } = require('../middleware/authenticationMiddleware');
const passport= require('passport')


userRoute.get('/errorpage', userController.getErrorPage);
userRoute.get('/', userController.getIndexPage);
userRoute.get('/home', isLoggedin, userController.getHomePage);
userRoute.get('/about', isLoggedin, userController.getAboutPage);
userRoute.get('/contact', isLoggedin, userController.getContactPage);
userRoute.get('/jewellery',userController.getJewelleryPage);
userRoute.get('/login',userController.getLoginPage);
userRoute.get('/signup', userController.getSignupPage);
userRoute.get('/otp', userController.getOtpPage);
userRoute.get('/productdetail', userController.getProductDetailPage);
userRoute.get('/categoryfiltered', userController.getCategoryFilteredPage);
userRoute.post('/otp', userController.verifyOtp);
userRoute.post('/signup', userController.registerUser);
userRoute.post('/login', userController.verifyUser);
userRoute.get('/logout', userController.logout);
userRoute.get('/resend', userController.resendOTP);
userRoute.get('/userprofile', isLoggedin,userController.getProfile);
userRoute.get('/useraccount', isLoggedin,userController.getUserAccount);
userRoute.get('/orders', isLoggedin,userController.renderUserOrders);
userRoute.get('/wishlist', isLoggedin,userController.getUserAccount);
userRoute.get('/useraddress', isLoggedin,userController.renderUserAddress);
userRoute.get('/editaddress', isLoggedin,userController.renderEditUserAddress);
userRoute.get('/addaddress', isLoggedin,userController.renderAddUserAddress);

// google-auth

userRoute.get("/auth/google", passport.authenticate('google',{scope:['profile','email']}));
userRoute.get("/auth/google/callback", passport.authenticate('google',{failureRedirect:"/"}),(req,res)=>{
    req.session.user_id = req.user._id; 
    res.redirect("/home");
});


userRoute.get("/forgotPasswordEmail", userController.renderForgotPasswordEmail);
userRoute.post("/sendforgotEmail", userController.forgotOTP);
userRoute.get("/resetpassword", userController.getResetPassword);
userRoute.post("/updatepassword", userController.updatePassword);


module.exports = userRoute;
