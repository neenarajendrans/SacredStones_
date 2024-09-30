const multer = require('multer');
const path = require('path');

const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('public', 'assets','imgs', 'productIMG'));
    },
    filename: function (req, file, cb) { 
        const date = new Date();
        const day = String(date.getDate()).padStart(2,"0");
        const month = String(date.getMonth()+1).padStart(2,"0");
        const year = String(date.getFullYear())
        const name = `${day}-${month}-${year}-${file.originalname}`;
        cb(null, name);
    }
});


const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('public', 'assets', 'imgs', 'categoryIMG'));
    },
    filename: function (req, file, cb) {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear());
        const name = `${day}-${month}-${year}-${file.originalname}`;
        cb(null, name);
    }
});
const upload = multer({ storage: productStorage });
const categoryUpload = multer({ storage: categoryStorage });




module.exports= {upload,categoryUpload}


