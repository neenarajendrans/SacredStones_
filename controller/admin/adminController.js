const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Admin = require("../../model/adminModel");

// @des Get adminlogin page
//@route Get /admin
//@access public

const getAdminLoginPage = asyncHandler(async (req, res) => {
  let message = null
  if(req.session.message){
    message = req.session.message
    req.session.message = null
  }
  res.render("admin/adminLogin",{message:message});
});
// @des Get adminlogin page
//@route Get /admin
//@access public
const adminLogin = asyncHandler(async(req, res) => {
  console.log("0000000000000", req.body);
  const {email, password}= req.body;
  const admin = await Admin.find({})
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin= true;
    console.log(admin,"1111111111111111111111111111")
    res.redirect("/admin/dashboard");
  }else{
    req.session.message = " Invalid Credentials "
    res.redirect('/admin/login')
  }
});
// @des Get adminlogin page
//@route Get /admin
//@access public
const loadUserManagement = asyncHandler(async (req, res) => {

    console.log("inside load user managemnentg")
  const users = await User.find({});
  console.log(users);
  res.render("admin/userManagement", { users });
});
// @des Get adminlogin page
//@route Get /admin
//@access public
const blockUser = asyncHandler(async (req, res) => {
  console.log('inside block user')
  const user_id = req.params.id;
  const userData = await User.updateOne({ _id: user_id }, { $set: { is_blocked: true } });
  console.log(userData,"user blocked 00000000000000000000")
  res.status(200).json({ success: true });
});//session clear at block
// @des Get adminlogin page
//@route Get /admin
//@access public

const unblockUser = asyncHandler(async (req, res) => {
  const user_id = req.params.id;
  const userData = await User.updateOne({ _id: user_id }, { $set: { is_blocked: false } });
  console.log(userData,"user unblocked 00000000000000000000111111111")
  res.status(200).json({ success: true });
});

// @des Get adminlogin page
//@route Get /admin
//@access public

const getAdminDashboardPage = asyncHandler(async (req, res) => {
  res.render("admin/adminPanel");
});


const getPermittedUsers = asyncHandler(async (req, res) => {
  const user = await User.find({})
  res.json({user});
});
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });



module.exports = { getAdminLoginPage,getPermittedUsers, getAdminDashboardPage, adminLogin ,loadUserManagement, blockUser , unblockUser};
