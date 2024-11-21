const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");

// Get Adminlogin Page
const getAdminLoginPage = asyncHandler(async (req, res) => {
  let message = null;
  if (req.session.message) {
    message = req.session.message;
    req.session.message = null;
  }
  if (req.session.isAdmin) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/adminLogin", { message: message });
  }
});

// Post Adminlogin Page
const adminLogin = asyncHandler(async (req, res) => {
  console.log("0000000000000", req.body);

  const { email, password } = req.body;
  const adminData = await User.findOne({ email: email });
  console.log(adminData);
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.isAdmin = true;
    req.session.admin_id = adminData._id;

    res.redirect("/admin/dashboard");
  } else {
    req.session.message = " Invalid Credentials ";
    res.redirect("/admin/login");
  }
});

// Get User Management Page
const loadUserManagement = asyncHandler(async (req, res) => {
  let page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  const limitno = 7;
  const users = await User.find({isAdmin: 0})
    .limit(limitno * 1)
    .skip((page - 1) * limitno)
    .sort({ createdAt: -1 })
    .exec(); // for combining chain of promises

  const count = await User.find({
    isAdmin: 0
  }).countDocuments();
  let totalPages = Math.ceil(count / limitno);
  res.render("admin/userManagement", { users, totalPages, currentPage: page });
});

// Block User
const blockUser = asyncHandler(async (req, res) => {
  console.log("inside block user");
  const user_id = req.query.id;
  await User.updateOne({ _id: user_id }, { $set: { is_blocked: true } });
  res.redirect("/admin/usermanagement");
});

// Unblock User
const unblockUser = asyncHandler(async (req, res) => {
  const id = req.query.id;
  await User.updateOne(
    { _id: id },
    {
      $set: {
        is_blocked: false,
      },
    }
  );

  res.redirect("/admin/usermanagement");
});

// Get Admin Dashboard
const getAdminDashboardPage = asyncHandler(async (req, res) => {
  res.render("admin/adminPanel");
});

//Logout Page
const logout = asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Error while Destroying session", err);
      return res.redirect("/admin/errorpage");
    }
    res.redirect("/admin/login");
  });
});

// Error Page
const ErrorPage = asyncHandler(async (req, res) => {
  res.render("admin/errorPage");
});

module.exports = {
  ErrorPage,
  logout,
  getAdminLoginPage,
  getAdminDashboardPage,
  adminLogin,
  loadUserManagement,
  blockUser,
  unblockUser,
};
