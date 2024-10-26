const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const bcrypt = require("bcrypt");
const message = require("../../config/mailer");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const Cart = require("../../model/cartModel");
const { v4: uuidv4 } = require('uuid');







//@des Get index page
//@route Get /
//@access public
const getIndexPage = asyncHandler(async (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/home");
  }
  res.render("user/index");
});
//@des Get Error page
//@route Get /errorpage
//@access public
const getErrorPage = asyncHandler(async (req, res) => {
  res.render("user/errorPage");
});

//@des Get signup page
//@route Get /signup
//@access public
const getSignupPage = asyncHandler(async (req, res) => {
  const message = req.query.message || null
  if (req.session.user_id) {
    return res.redirect("/home");
  }
  res.render("user/signup",{message:'',message});
});

// Password Hashing
const securePassword = asyncHandler(async (password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return passwordHash;
});


//@des Post Signup / Register User
//@route Post /signup
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;
  const existMail = await User.findOne({ email: email });

  if (existMail) {
    return res.render("user/login", {
      message: "This user already exists",
    });
  } else {
    req.session.userData = req.body;
    req.session.email = email;
    const data = await message.sendVerifyMail(req, req.session.email);
    res.redirect("/otp");
  }
});

//@des Get otp page
//@route Get /otp
//@access User
const getOtpPage = asyncHandler(async (req, res) => {
  res.render("user/otp",{message:''});
});
const getProfile = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;
  console.log(user_id, '00000000000000000000000000000000');

  // Check if user_id is defined
  if (!user_id) {
    console.error('User ID not found in session');
    return res.status(400).send('User not logged in');
  }

  // Find the user in the database
  const user = await User.findById({ _id:req.session.user_id });
  console.log(user, 'User object found in database');

  // Check if user is null or undefined
  if (!user) {
    console.error('User not found in the database');
    return res.status(404).send('User not found');
  }
 console.log(user)
  // Render the profile page with the user object
  res.render("user/userProfile", { message: '', user });
});
const getUserAccount = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;
  console.log(user_id, '00000000000000000000000000000000');

  // Check if user_id is defined
  if (!user_id) {
    console.error('User ID not found in session');
    return res.status(400).send('User not logged in');
  }

  // Find the user in the database
  const user = await User.findById({ _id:req.session.user_id });
  console.log(user, 'User object found in database');

  // Check if user is null or undefined
  if (!user) {
    console.error('User not found in the database');
    return res.status(404).send('User not found');
  }

  // Render the profile page with the user object
  res.render("user/userAccount", { message: '', user });
});

const getResetPassword = asyncHandler(async (req, res) => {
  const message = req.query.message;
  res.render("user/resetPassword",{message:'',message});
});

//@des verify OTP
//@route post /otp
//@access User
const verifyOtp = asyncHandler(async (req, res) => {
  const userData = req.session.userData;
  let googleId = req.body.googleId || uuidv4();
  if (req.body.otp == req.session.otp) {
    console.log(req.body.otp)
    if (userData.is_blocked) {
      return res.redirect("/");
    }

    if (req.session.isForgotPassword) {
      // If it's a forgot password scenario, redirect to reset password page
      req.session.isForgotPassword = false; // Reset the flag
      return res.redirect("/resetpassword"); // Assuming you have a reset password route
    } else {

      // For signup scenario
      const secure_password = await securePassword(userData.password);
      const user = new User({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: secure_password,
        googleId: googleId,
        
        
      });

      const userDataSave = await user.save();
      if (userDataSave && !userDataSave.isAdmin) {
        req.session.user_id = userDataSave._id;
        return res.redirect("/home");
      } else {
        return res.render("user/otp", { message: "Registration Failed" });
      }
    }
  } else {
    return res.render("user/otp", {
      message: "Invalid OTP. Please enter the correct OTP.",
    });
  }
});


//@des Get login page
//@route Get /login
//@access user
const getLoginPage = asyncHandler(async (req, res) => {
  const message = req.query.message || null
  if (req.session.user_id) {
    return res.redirect("/home");
  }
  res.render("user/login", { message: '',message });
});

//@des post login page
//@route post /login
//@access user
const verifyUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userData = await User.findOne({ email: email });
  
  if (userData) {
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (passwordMatch) {
      req.session.user_id = userData._id;
      res.redirect("/home");
    } else {
      return res.redirect("/login?message=Invalid+Password+or+Email");
    }
  } else {
    return res.redirect("/login?message=User+Doesn't+Exist");
  }
});
// resendOTP
//@des logout user
//@route redirect /
//@access user
const resendOTP = asyncHandler(async (req, res) => {
  const data = await message.sendVerifyMail(req, req.session.email);
  res.redirect("/otp");
});

//@des logout user
//@route redirect /
//@access user
const forgotOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userExist = await User.findOne({ email });

  if (userExist) {
    req.session.email = userExist.email; // Set the email in session
    req.session.userData = userExist;
    req.session.user_id = userExist._id; // Use _id for MongoDB ObjectID
    
    await message.sendVerifyMail(req, userExist.email);
    req.session.isForgotPassword = true; // Set the flag for forgot password
    return res.redirect("/otp");
  } else {
    return res.redirect("/signup?message=User+Doesn't+Exist");
  }
});


//@des logout user
//@route redirect /
//@access user
const logout = asyncHandler((req, res) => {
  console.log('inside logout')
  console.log(req.session) 
  req.session.userId = null
  req.session.isAdmin = null
  req.session.destroy();
  res.redirect("/")
})

//@des Get home page
//@route Get /home
//@access authorized User
const getHomePage = asyncHandler(async (req, res) => {
  try {
    const message = req.query.message || null;

    // Extract user ID from session
    const user_id = req?.session?.user_id;

    // Use Promise.all to run all queries concurrently
    const cartQuery = user_id ? Cart.findOne({ user_id }).populate('products.productData_id') : null;

    const [category, products, cart] = await Promise.all([
      Category.find({}),
      Product.find({}),
      cartQuery,
    ]);
    console.log(category,products)
    // Render the home page with the fetched data, including the cart
    res.render("user/home", { category, products, cart, message });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


//@des Get about page
//@route Get /about
//@access authorized User
const getAboutPage = asyncHandler(async (req, res) => {
  res.render("user/about");
});

//@des Get contact page
//@route Get /contact
//@access authorized User
const getContactPage = asyncHandler(async (req, res) => {
  res.render("user/contact");
});

//@des Get Jewellery page
//@route Get /jewellery
//@access authorized User
const getJewelleryPage = asyncHandler(async (req, res) => {
  const product = await Product.find({});
  const category = await Category.find({});
  res.render("user/jewellery", { product, category });
});

//@des Get product details page
//@route Get /productdetails
//@access public
const getProductDetailPage = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.query.id });
  res.render("user/productDetailed", { product });
});
//@des Get filtered-category-page
//@route Get /productdetails
//@access public
const getCategoryFilteredPage = asyncHandler(async (req, res) => {
  try {
    // Get the category from Query Parameters
    const categoryId = req.query.id;
    // Fetch the category (optional, to check if the category exists)
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Fetch products in the specified category
    const product = await Product.find({ category: categoryId });

    // Render the products page or send a JSON response
    res.render("user/categoryDetailed", { category, product });
    // Alternatively, you can use res.json({ category, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  };
});
//@des Get Forgot Password page
//@route Get /forgotemail????????????????????????????
//@access public
const renderForgotPasswordEmail = asyncHandler((req, res) => {
  res.render("user/forgotPasswordEmail")
})
//@des Updation of password and redirecting to home page
//@route POST /updatepassword????????????????????
//@access public
const updatePassword = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;

    if (!req.session.email) {
      console.log("Session expired or invalid request.");
      return res.redirect('/login?message=Session+expired+or+invalid+request');
      
    }

    const email = req.session.email;
    req.session.email = null; // Clear the email from session after using it

    const secure_password = await securePassword(password);

    const result = await User.updateOne({ email }, { $set: { password: secure_password } });

    console.log(`Update result: ${JSON.stringify(result)}`);

    if (result.modifiedCount === 1) {
      console.log("Password changed successfully");
      req.session.message = "Password changed successfully";
      res.redirect('/login');
    } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
      console.log("Password is already up to date");
      req.session.message = "Password is already up to date";
      res.redirect('/login');
    } else {
      console.log("Failed to update password");
      res.redirect('/resetpassword?message=Failed+to+update+password.+Please+try+again.');
      
    }
  } catch (error) {
    console.error('Error during password update:', error);
    res.redirect('/resetpassword?message=An+error+occured+while+updating+the+password.');
  }
});


//@des Get orders page
//@route Get /userorders
//@access public
const renderUserOrders = asyncHandler((req, res) => {
  res.render("user/orders")
})
//@des Get track order page
//@route Get /usertrackorders
//@access public
const renderUserTrackOrder = asyncHandler((req, res) => {
  res.render("user/orderPlaced")
})


module.exports = {
  renderForgotPasswordEmail,
  getIndexPage,
  getHomePage,
  getAboutPage,
  getContactPage,
  getJewelleryPage,
  getLoginPage,
  getSignupPage,
  getOtpPage,
  registerUser,
  verifyUser,
  verifyOtp,
  getProductDetailPage,
  logout,
  resendOTP,
  forgotOTP,
  getResetPassword,
  updatePassword,
  getProfile,
  getUserAccount,
  getCategoryFilteredPage,
  
  renderUserOrders,
  renderUserTrackOrder,
  getErrorPage,
  
  
  // registerGoogleUser: asyncHandler(async (req, res) => {
  //   res.redirect('/home');
  // })
};

// if (req.body.forgotPassword) {
//   if (req.body.otp == req.session.otp) {
//     res.redirect("/resetPassword");
//   } else {
//     return res.render("user/otp", {
//       message: "Invalid OTP. Please enter the correct OTP.",
//     });
//   }
// }