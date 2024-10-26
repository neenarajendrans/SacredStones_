const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");


// @des Get adminlogin page
//@route Get /admin
//@access public

const getAdminLoginPage = asyncHandler(async (req, res) => {
  let message = null
  if(req.session.message){
    message = req.session.message
    req.session.message = null
  }
  if(req.session.isAdmin){
    res.redirect('/admin/dashboard')
  }else{
    res.render("admin/adminLogin",{message:message});
  }
 
});
// @des Get adminlogin page
//@route Get /admin
//@access public
const adminLogin = asyncHandler(async(req, res) => {
  console.log("0000000000000", req.body);
  
  const {email, password}= req.body;
  const adminData = await User.findOne({ email: email });
  console.log(adminData)
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin= true;
    req.session.admin_id = adminData._id;
    
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
  // user search
  let search='';
  if(req.query.search){
    search = req.query.search;
  }
  //pagination
  let page=1;
  if(req.query.page){
    page = req.query.page;
  }
  const limitno = 3
  const users = await User.find({isAdmin:0,$or:[
    {name:{$regex:".*"+search+".*"}},//. * means all character - if came at start or end
    {email:{$regex:".*"+search+".*"}},//. * means all character
  ],
})
.limit(limitno*1)
.skip((page-1)*limitno)
.exec(); // for combining chain of promises
 
const count = await User.find({isAdmin:0,$or:[
  {name:{$regex:".*"+search+".*"}},//. * means all character - if came at start or end
  {email:{$regex:".*"+search+".*"}},//. * means all character
],
}).countDocuments();
let totalPages = Math.ceil(count/limitno)
  res.render("admin/userManagement", { users, totalPages,currentPage:page });
});
// @des Get adminlogin page
//@route Get /admin
//@access public
const blockUser = asyncHandler(async (req, res) => {
  console.log('inside block user')
  const user_id = req.query.id;
  await User.updateOne({ _id: user_id }, { $set: { is_blocked: true } });
 res.redirect('/admin/usermanagement');
});
// @des Get adminlogin page
//@route Get /admin
//@access public

const unblockUser = asyncHandler(async (req, res) => {
  const id = req.query.id;
    await User.updateOne(
          {_id:id},
          {
            $set: {
              is_blocked: false
            },
          }
        );
       
      
      res.redirect("/admin/usermanagement");
  
});

// @des Get adminlogin page
//@route Get /admin
//@access public

const getAdminDashboardPage = asyncHandler(async (req, res) => {
  res.render("admin/adminPanel");
});



//logout page
const logout = asyncHandler(async (req, res) => {
  
    req.session.destroy((err)=>{
      if(err){
        console.log('Error while Destroying session',err);
        return res.redirect('/admin/errorpage')
        
      }
      res.redirect('/admin/login');
    });
    
  
});
// Error Page 
const ErrorPage = asyncHandler(async (req, res) => {
    res.render('admin/errorPage')
});
const Page = asyncHandler(async (req, res) => {
  res.render("admin/adminPanel");
});
const getOrderManagement = asyncHandler(async (req, res) => {
  res.render("admin/orderManagement");
});
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });
// const getAdminDashboardPage = asyncHandler(async (req, res) => {
//   res.render("admin/adminPanel");
// });



module.exports = { getOrderManagement, ErrorPage,logout,getAdminLoginPage, getAdminDashboardPage, adminLogin ,loadUserManagement , blockUser,unblockUser};
