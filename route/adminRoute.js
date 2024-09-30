const express = require('express');
const adminRoute = express.Router();
const adminController = require('../controller/admin/adminController');
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');
const userController = require('../controller/user/userController')
const asyncHandler = require('express-async-handler')
const{ upload} = require('../middleware/multer');
const {categoryUpload} = require('../middleware/multer');
//@desc Admin Panel
adminRoute.get('/login',adminController.getAdminLoginPage);
adminRoute.post('/login',adminController.adminLogin);
adminRoute.get('/dashboard',adminController.getAdminDashboardPage);
//@desc Category Management Routes
adminRoute.get('/category',categoryController.getCategoryManagement);
adminRoute.get('/addcategory',categoryController.getAddCategory);
adminRoute.post('/addcategory',categoryUpload.single('image'),categoryController.addCategory);
adminRoute.post('/editcategory',categoryUpload.single('image'),categoryController.editCategory);
adminRoute.get('/editcategory/:id',categoryController.getEditCategory);
adminRoute.get("/listcategory/:id",categoryController.listCategory)
adminRoute.get("/unlistcategory/:id",categoryController.unlistCategory);
adminRoute.delete("/category/delete-image",categoryController.deleteImage);
adminRoute.post("/category/update-image",categoryUpload.single('image'),categoryController.updateImage);

//@desc Product Management Routes
adminRoute.get('/products',productController.getProductManagement);
adminRoute.get('/addproduct',productController.getAddProduct);
adminRoute.post('/addproduct',upload.array('images',3), productController.addProduct);
adminRoute.get('/editproduct/:id',productController.getEditProduct);
adminRoute.post('/editproduct/:id',upload.array('images',3),productController.editProduct)
adminRoute.get("/listproduct/:id",productController.listProducts)
adminRoute.get("/unlistproduct/:id",productController.unlistProducts)
//@desc User Management Routes 
adminRoute.get('/usermanagement',adminController.loadUserManagement)
adminRoute.put('/block/:id',adminController.blockUser)
adminRoute.put('/unblock/:id',adminController.unblockUser)
adminRoute.get('/users',adminController.getPermittedUsers)






module.exports = adminRoute;