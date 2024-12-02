const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const bcrypt = require("bcrypt");

// Get otp page
const getCurrentPasswordPage = asyncHandler(async (req, res) => {
    const message = req.query.message || null;
    res.render("user/currentPassword", { message: " ",message });
  });

 
const verifyPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userData = await User.findById({ _id: req.session.user_id });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        res.redirect("/newpassword");
      } else {
        return res.redirect("/currentpassword?message=Invalid+Password");
      }
    } else {
      return res.redirect("/currentpassword?message=User+Doesn't+Exist");
    }
  });

  const getNewPasswordPage = asyncHandler(async (req, res) => {
    const message = req.query.message || null;
    res.render("user/newPassword", { message: " ",message });
  });

  // Password Hashing
const securePassword = asyncHandler(async (password) => {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  });

  const changePassword = asyncHandler(async (req, res) => {
    try {
      const { password, confirmPassword } = req.body;
  
      // Additional server-side validation
      if (password !== confirmPassword) {
        return res.json({ 
          success: false, 
          message: 'Passwords do not match' 
        });
      }
  
      const secure_password = await securePassword(password);
      const result = await User.updateOne(
        { _id: req.session.user_id }, // Use the user ID from the session
        { $set: { password: secure_password } }
      );
  
      if (result.modifiedCount === 1) {
        return res.json({ 
          success: true, 
          message: 'Password changed successfully' 
        });
      } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
        return res.json({ 
          success: false, 
          message: 'Password is already up to date' 
        });
      } else {
        return res.json({ 
          success: false, 
          message: 'Failed to update password' 
        });
      }
    } catch (error) {
      console.error("Error during password update:", error);
      return res.json({ 
        success: false, 
        message: 'An error occurred while updating the password' 
      });
    }
  });
  module.exports = {getCurrentPasswordPage,verifyPassword,getNewPasswordPage,getNewPasswordPage,changePassword}