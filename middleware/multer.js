const multer = require('multer');
const path = require('path');

// Create storage configuration for products
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the destination uses forward slashes
        const uploadPath = path.join('public', 'assets', 'imgs', 'productIMG').replace(/\\/g, '/');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Clean the original filename and add timestamp
        const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept only jpeg, jpg, and png
    if (file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

// Configure multer for product uploads
const upload = multer({
    storage: productStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
        files: 3 // Maximum 3 files
    }
});

const editProductUpload = multer({
    storage: productStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,
    }
}).fields([
    { name: 'newImage_0', maxCount: 1 },
    { name: 'newImage_1', maxCount: 1 },
    { name: 'newImage_2', maxCount: 1 }
]);

// Create storage configuration for categories
const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure the destination uses forward slashes
        const uploadPath = path.join('public', 'assets', 'imgs', 'categoryIMG').replace(/\\/g, '/');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Clean the original filename and add timestamp
        const cleanFileName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        cb(null, `${uniqueSuffix}-${cleanFileName}`);
    }
});


const categoryUpload = multer({
    storage: categoryStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
        files: 1 // Maximum 1 files
    }
});

const editCategoryUpload = multer({
    storage: categoryStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    }
}).fields([
    { name: 'newImage', maxCount: 1 }
]);




module.exports= {upload,categoryUpload,editProductUpload,editCategoryUpload}


