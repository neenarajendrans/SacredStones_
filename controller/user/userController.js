const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const bcrypt = require("bcrypt");
const message = require("../../config/mailer");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const Cart = require("../../model/cartModel");
const Offer = require("../../model/offerModel");
const Wallet = require("../../model/walletModel");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { calculateProductPrices } = require("../../middleware/OfferCalculator");

// Function to generate referral code
const generateReferralCode = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const codeLength = 8;
  let referalCode;
  let isUnique = false;
  // Keep generating until we find a unique code
  while (!isUnique) {
    referalCode = "";
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referalCode += characters[randomIndex];
    }
    // Check if code already exists
    const existingCode = await User.findOne({ referalCode: referalCode });
    if (!existingCode) {
      isUnique = true;
    }
  }
  return referalCode;
};

// Function to handle referral rewards
const handleWalletTransaction = async (userId, amount, type, description) => {
  try {
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    //check if wallet exists for the user
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      //create a new wallet if doesn't exist
      wallet = await Wallet.create({
        userId,
        balance: 0,
        transactions: [],
      });
    }

    //Add the new transaction to the wallet
    wallet.transactions.push({
      type,
      amount,
      description,
      date: new Date(),
    });
    //Update the wallet balance
    // Update balance
    if (type === "credit") {
      wallet.balance += amount;
    } else if (type === "debit") {
      wallet.balance -= amount;
    }

    //Save the updated wallet
    await wallet.save();
    return wallet;
  } catch (error) {
    console.error("Error in wallet transaction:", error);
    throw error;
  }
};

const handleReferralRewards = async (newUserId, referringUserId) => {
  try {
    console.log("Starting referral reward process for:", {
      newUserId,
      referringUserId,
    });

    // Validate input parameters
    if (!newUserId || !referringUserId) {
      throw new Error("Missing required user IDs for referral reward");
    }

    // Verify both users exist before proceeding
    const [newUser, referringUser] = await Promise.all([
      User.findById(newUserId),
      User.findById(referringUserId),
    ]);

    if (!newUser || !referringUser) {
      throw new Error("One or both users not found");
    }
    console.log("Both users found, processing rewards");
    // Process rewards for both users in parallel
    const [referringUserWallet, newUserWallet] = await Promise.all([
      // Credit 100 rupees to the referring user's wallet
      handleWalletTransaction(
        referringUserId,
        100,
        "credit",
        `Referral reward for inviting ${newUser.fullName}`
      ),
      // Credit 50 rupees to the new user's wallet
      handleWalletTransaction(
        newUserId,
        50,
        "credit",
        `Welcome bonus for joining through ${referringUser.fullName}'s referral`
      ),
    ]);
    console.log("Wallet transactions completed:", {
      referringUserWallet: referringUserWallet?.balance,
      newUserWallet: newUserWallet?.balance,
    });

    if (!referringUserWallet || !newUserWallet) {
      throw new Error("Failed to update one or both user wallets");
    }
    // Update the new user's referral status
    const updatedNewUser = await User.findByIdAndUpdate(
      newUserId,
      {
        $set: {
          redeemed: true,
          redeemedUsers: referringUserId,
        },
      },
      { new: true }
    );
    return { updatedNewUser, referringUserWallet, newUserWallet };
  } catch (error) {
    console.error("Error handling referral rewards:", error);
    throw error;
  }
};

// Get index page
const getIndexPage = asyncHandler(async (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/home");
  }
  res.render("user/index");
});

// Get Error page
const getErrorPage = asyncHandler(async (req, res) => {
  res.render("user/errorPage");
});

// Get signup page
const getSignupPage = asyncHandler(async (req, res) => {
  const message = req.query.message || null;
  if (req.session.user_id) {
    return res.redirect("/home");
  }
  res.render("user/signup", { message: "", message });
});

// Password Hashing
const securePassword = asyncHandler(async (password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return passwordHash;
});

// Post Signup / Register User
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;
  console.log(req.body);
  const existMail = await User.findOne({ email: email }); //email is used for checking for unique email
  if (existMail) {
    return res.render("user/login", {
      message: "This user already exists",
    });
  } else {
    req.session.userData = req.body; //if the user is unique the email with otp is send
    req.session.email = email;
    req.session.referredBy = req.body?.referredBy;
    const data = await message.sendVerifyMail(req, req.session.email);
    res.redirect("/otp");
  }
});

// Get otp page
const getOtpPage = asyncHandler(async (req, res) => {
  res.render("user/otp", { message: "" });
});

// Get user profile
const getUserAccount = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;
  console.log(user_id, "00000000000000000000000000000000");
  // Check if user_id is defined
  if (!user_id) {
    console.error("User ID not found in session");
    return res.status(400).send("User not logged in");
  }
  // Find the user in the database
  const user = await User.findById({ _id: req.session.user_id });
  console.log(user, "User object found in database");
  // Check if user is null or undefined
  if (!user) {
    console.error("User not found in the database");
    return res.status(404).send("User not found");
  }
  // Render the profile page with the user object
  res.render("user/userAccount", { message: "", user });
});

const getResetPassword = asyncHandler(async (req, res) => {
  const message = req.query.message;
  res.render("user/resetPassword", { message: "", message });
});

// verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
  const userData = req.session.userData;
  const referredBy = req.session?.referredBy;
  const email = req.session.email;
  console.log(referredBy);
  //generating fake googleId
  let googleId = req.body.googleId || uuidv4();
  if (req.body.otp == req.session.otp) {
    console.log(req.body.otp);
    if (userData.is_blocked) {
      return res.redirect("/");
    }
    if (req.session.isForgotPassword) {
      // If it's a forgot password scenario, redirect to reset password page
      req.session.isForgotPassword = false; // Reset the flag
      return res.redirect("/resetpassword"); // Assuming you have a reset password route
    } else {
      // Generate unique referral code for new user
      const newUserReferralCode = await generateReferralCode();
      console.log("Generated new referral code:", newUserReferralCode);
      // If user was referred by someone, validate the referral code
      let referringUser = null;
      if (referredBy && referredBy.trim() !== "") {
        console.log("Checking referral code:", referredBy);
        referringUser = await User.findOne({ referalCode: referredBy });
        console.log("referring user found:", referringUser);
        if (!referringUser) {
          console.log("Invalid referral code provided:", referredBy);
          return res
            .status(400)
            .json({ success: false, message: "Invalid referral code" });
        }
        // Check if referring user is not the same as new user
        if (referringUser.email === email) {
          console.log("User tried to use their own referral code");
          return res.status(400).json({
            success: false,
            message: "Cannot use your own referral code",
          });
        }
      }
      // Store referring user's ID in session if exists
      if (referringUser) {
        req.session.referringUserId = referringUser._id;
        console.log("Stored referring user ID in session:", referringUser._id);
      }
      // For signup scenario
      const secure_password = await securePassword(userData.password);
      const user = new User({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: secure_password,
        googleId: googleId,
        referalCode: newUserReferralCode,
      });
      const userDataSave = await user.save();
      // Create initial wallet for new user with 0 balance
      const newUserWallet = await handleWalletTransaction(
        userDataSave._id,
        0,
        "credit",
        "Initial wallet creation"
      );
      // Update user with wallet reference
      userDataSave.wallet = newUserWallet._id;
      await userDataSave.save();
      console.log("wallet created for user");
      // Handle referral rewards if applicable
      if (req.session.referringUserId) {
        try {
          console.log("Processing referral rewards...");
          const rewardResult = await handleReferralRewards(
            userDataSave._id,
            req.session.referringUserId
          );
          console.log("Referral rewards processed:", rewardResult);
        } catch (error) {
          console.error("Error processing referral rewards:", error);
        }
      }
      if (userDataSave && !userDataSave.isAdmin) {
        req.session.user_id = userDataSave._id; // setting user id in session
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
// Get login page
const getLoginPage = asyncHandler(async (req, res) => {
  const message = req.query.message || null;
  if (req.session.user_id) {
    return res.redirect("/home");
  }
  res.render("user/login", { message: "", message });
});

// post login page
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
const resendOTP = asyncHandler(async (req, res) => {
  const data = await message.sendVerifyMail(req, req.session.email);
  res.redirect("/otp");
});

// forgot password otp
const forgotOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) {
    if (!userExist?.password) {
      return res.redirect(
        "/signup?message=You+can+login+through+your+google+account"
      );
    }
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

// logout user
const logout = asyncHandler(async (req, res) => {
  try {
    console.log("Inside logout");
    console.log("Current session:", req.session);

    // Check if session exists
    if (req.session && req.session.user_id) {
      // Clear specific session properties
      req.session.user_id = null;
      req.session.isAdmin = null;

      // Use a promise-based approach for session destruction
      await new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Clear session cookie
      res.clearCookie('connect.sid'); // Adjust cookie name if different
      
      // Redirect to home page after successful logout
      res.redirect("/");
    } else {
      // If no session exists, directly redirect
      res.redirect("/signup");
    }
  } catch (error) {
    console.error("Logout error:", error);
    
    // Comprehensive error handling
    res.status(500).redirect("/errorpage");
  }
});
// get home page
const getHomePage = asyncHandler(async (req, res) => {
  try {
    const message = req.query.message || null;
    const user_id = req?.session?.user_id;

    // Find active offers for categories
    const currentDate = new Date();
    const categoryOffers = await Offer.find({
      type: 'Category',
      status: true,
      validFrom: { $lte: currentDate },
      validity: { $gte: currentDate }
    }).populate('categoryId');

    const cartQuery = user_id 
      ? Cart.findOne({ user_id }).populate("products.productData_id")
      : null;

    const [category, products, cart] = await Promise.all([
      Category.find({}),
      Product.find({}),
      cartQuery,
    ]);

    // Create a map of category offers for easy lookup
    const categoryOffersMap = categoryOffers.reduce((acc, offer) => {
      if (offer.categoryId) {
        acc[offer.categoryId._id] = offer;
      }
      return acc;
    }, {});

    // Render the home page with the fetched data, including category offers
    res.render("user/home", { 
      category, 
      products, 
      cart, 
      message,
      categoryOffers: categoryOffersMap 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Get about page
const getAboutPage = asyncHandler(async (req, res) => {
  res.render("user/about");
});



// Get Jewellery page/product listing page
const getJewelleryPage = asyncHandler(async (req, res) => {
  // Pagination parameters
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  // Filter parameters
  let userpresent = false;
  const searchQuery = req.query.search?.trim() || "";
  const category = req.query.category;
  const sortBy = req.query.sortBy || "new-arrivals";
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = req.query.maxPrice
    ? parseFloat(req.query.maxPrice)
    : Number.MAX_VALUE;
  // Build query
  const baseQuery = {
    is_listed: true,
    isDeleted: false,
  };
  // Add search conditions
  if (searchQuery) {
    baseQuery.$or = [
      { name: { $regex: new RegExp(searchQuery, "i") } },
      { description: { $regex: new RegExp(searchQuery, "i") } },
    ];
  }
  // Add category filter
  if (category) {
    baseQuery.category = category;
  }
  // Add price filter
  baseQuery.discount_price = {
    $gte: minPrice,
    $lte: maxPrice,
  };
  // Sort configuration
  const sortConfig = {
    popularity: { popularity: -1 },
    "price-low-high": { discount_price: 1 },
    "price-high-low": { discount_price: -1 },
    "new-arrivals": { createdAt: -1 },
    "a-z": { name: 1 },
    "z-a": { name: -1 },
  };
  try {
    // Execute queries in parallel
    const [products, totalProducts, categories] = await Promise.all([
      Product.find(baseQuery)
        .sort(sortConfig[sortBy] || sortConfig["new-arrivals"])
        .skip(skip)
        .limit(limit)
        .populate("category")
        .lean(),
      Product.countDocuments(baseQuery),
      Category.find({ is_listed: true }).lean(),
    ]);
    // Store products in request for middleware
    req.products = products;
    // Calculate prices with offers (middleware will process this)
    await calculateProductPrices(req, res, () => {});
    const processedProducts = req.products;
    // Calculate pagination
    const totalPages = Math.ceil(totalProducts / limit);
    // Add search to user's history if logged in
    if(req.session.user_id){
      userpresent = true;
    }
    if (req.session.user_id && searchQuery) {
      
      const userId = req.session.user_id;
      await User.findByIdAndUpdate(userId, {
        $push: {
          searchHistory: {
            query: searchQuery,
            category: category,
            timestamp: new Date(),
          },
        },
      });
    }
    
    // Prepare response
    const responseData = {
      products: processedProducts,
      userpresent,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        searchQuery,
        category,
        sortBy,
        minPrice,
        maxPrice,
      },
      categories,
    };
    res.render("user/jewellery", responseData);
  } catch (error) {
    console.error("Error in getJewelleryPage:", error.message);
  }
});

// Get product details page
const getProductDetailPage = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.query.id });

  res.render("user/productDetailed", { product });
});

// Get filtered-category-page
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
  }
});

// Get Forgot Password page
const renderForgotPasswordEmail = asyncHandler((req, res) => {
  res.render("user/forgotPasswordEmail");
});

// Updation of password and redirecting to home page
const updatePassword = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    if (!req.session.email) {
      console.log("Session expired or invalid request.");
      return res.redirect("/login?message=Session+expired+or+invalid+request");
    }
    const email = req.session.email;
    req.session.email = null; // Clear the email from session after using it
    const secure_password = await securePassword(password);
    const result = await User.updateOne(
      { email },
      { $set: { password: secure_password } }
    );
    console.log(`Update result: ${JSON.stringify(result)}`);
    if (result.modifiedCount === 1) {
      console.log("Password changed successfully");
      req.session.message = "Password changed successfully";
      res.redirect("/login");
    } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
      console.log("Password is already up to date");
      req.session.message = "Password is already up to date";
      res.redirect("/login");
    } else {
      console.log("Failed to update password");
      res.redirect(
        "/resetpassword?message=Failed+to+update+password.+Please+try+again."
      );
    }
  } catch (error) {
    console.error("Error during password update:", error);
    res.redirect(
      "/resetpassword?message=An+error+occured+while+updating+the+password."
    );
  }
});

// Get orders page
const renderUserOrders = asyncHandler(async (req, res) => {
  res.render("user/orders");
});

// Get track order page
const renderUserTrackOrder = asyncHandler(async (req, res) => {
  res.render("user/orderPlaced");
});

//Get edit profile
const getEditProfile = asyncHandler(async (req, res) => {
  const user = await User.findById({ _id: req.session.user_id });
  console.log(user);
  res.render("user/editprofile", { user });
});

//edit user
const editUser = asyncHandler(async (req, res) => {
  const user = await User.findById({ _id: req.session.user_id });
  console.log(user);
  const { fullName, email, phoneNumber } = req.body;
  const updateData = await User.findByIdAndUpdate(
    { _id: req.session.user_id },
    {
      $set: {
        fullName,
        email,
        phoneNumber,
      },
    }
  );
  console.log(updateData + "3333333333333333333333 updated profile");
  res.json({ success: true });
});
module.exports = {
  editUser,
  getEditProfile,
  renderForgotPasswordEmail,
  getIndexPage,
  getHomePage,
  getAboutPage,
 
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
  getUserAccount,
  getCategoryFilteredPage,
  renderUserOrders,
  renderUserTrackOrder,
  getErrorPage,
};
