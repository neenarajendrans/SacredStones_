const express = require('express');
const adminRoute = express.Router();
const adminController = require('../controller/admin/adminController');
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');

const {upload,categoryUpload,editCategoryUpload,editProductUpload} = require('../middleware/multer');
const { isAdminLoggedin } = require('../middleware/authenticationMiddleware');

//@desc Admin Panel
adminRoute.get('/login',adminController.getAdminLoginPage);
adminRoute.post('/login',adminController.adminLogin);
adminRoute.get('/logout',adminController.logout);
adminRoute.get('/errorpage',adminController.ErrorPage);
adminRoute.get('/dashboard',isAdminLoggedin,adminController.getAdminDashboardPage);
//@desc Category Management Routes
adminRoute.get('/category',isAdminLoggedin,categoryController.getCategoryManagement);
adminRoute.get('/addcategory',isAdminLoggedin,categoryController.getAddCategory);
adminRoute.post('/addcategory',categoryUpload.single('image'),categoryController.addCategory);
adminRoute.post('/editcategory/:id',editCategoryUpload,categoryController.editCategory);
adminRoute.get('/editcategory/:id',isAdminLoggedin,categoryController.getEditCategory);
adminRoute.get("/listcategory/:id",isAdminLoggedin,categoryController.listCategory)
adminRoute.get("/unlistcategory/:id",isAdminLoggedin,categoryController.unlistCategory);

//@desc Product Management Routes
adminRoute.get('/products',isAdminLoggedin,productController.getProductManagement);
adminRoute.get('/addproduct',isAdminLoggedin,productController.getAddProduct);
adminRoute.post('/addproduct',upload.array('images',3), productController.addProduct);
adminRoute.get('/editproduct/:id',isAdminLoggedin,productController.getEditProduct);
adminRoute.post('/editproduct/:id', editProductUpload,productController.editProduct)
adminRoute.get("/listproduct/:id",isAdminLoggedin,productController.listProducts)
adminRoute.get("/unlistproduct/:id",isAdminLoggedin,productController.unlistProducts)

//@desc User Management Routes 
adminRoute.get('/usermanagement',isAdminLoggedin,adminController.loadUserManagement)
adminRoute.get('/blockuser',isAdminLoggedin,adminController.blockUser)
adminRoute.get('/unblockuser',isAdminLoggedin,adminController.unblockUser)
// adminRoute.get('/users',adminController.getPermittedUsers)

adminRoute.get("/ordermanagement", isAdminLoggedin, adminController.getOrderManagement);
// adminRoute.get('/unlistUser',isAdminLoggedin,adminController.listUser)






module.exports = adminRoute;