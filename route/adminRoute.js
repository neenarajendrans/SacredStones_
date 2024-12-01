const express = require('express');
const adminRoute = express.Router();
const adminController = require('../controller/admin/adminController');
const categoryController = require('../controller/admin/categoryController');
const productController = require('../controller/admin/productController');
const orderController = require('../controller/admin/orderController');
const salesController = require('../controller/admin/salesController');
const couponController = require('../controller/admin/couponController');
const offerController = require('../controller/admin/offerController');
const salesReportController = require('../controller/admin/salesController');
const returnController = require('../controller/admin/returnController');


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


// Order Mananagemet Route
adminRoute.get("/ordermanagement", isAdminLoggedin, orderController.getOrderPage);
adminRoute.get('/orders/:orderId', isAdminLoggedin,orderController.getOrderDetails);
adminRoute.post('/order/update/:id', isAdminLoggedin,orderController.updateOrderStatus); 
adminRoute.post('/order/cancel/:id', isAdminLoggedin, orderController.cancelOrder);

//salesReport mgmt
adminRoute.get('/sales-report', salesReportController.getSalesReport);
adminRoute.get('/download-report', salesReportController.downloadReport);



//Offer Management
adminRoute.get('/offer',offerController.offerPageLoad)//offerpage
adminRoute.post('/offer', offerController.addOffer);//createoffer
adminRoute.get('/activateoffer/:id', offerController.activateOffer);
adminRoute.get('/deactivateoffer/:id', offerController.deactivateOffer);
adminRoute.delete('/offer', offerController.deleteOffer);//deleteoffer

//Return Request Management
adminRoute.get('/return', returnController.getRequestPage);
adminRoute.post('/returnapprove/:orderId', returnController.approveReturnRequest);


// Coupon Management
adminRoute.get('/coupon',couponController.getCouponManagement)
adminRoute.post('/createCoupons', couponController.createCoupon);
adminRoute.post('/deleteCoupons/:id', couponController.deleteCoupon);


module.exports = adminRoute;