const Product = require("../../model/productModel");
const path = require("path");
const Category = require("../../model/categoryModel");
const User = require("../../model/userModel");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const sharp = require("sharp"); //image resize
const fs = require("fs");
// Get product management
const getProductManagement = asyncHandler(async (req, res) => {
  let page = 1;
  if (req.query.page) {
    page = req.query.page;
  }
  const limitno = 7;
  const product = await Product.find({})
    .populate("category")
    .limit(limitno * 1)
    .skip((page - 1) * limitno)
    .sort({ createdAt: -1 });
  console.log(product);
  const count = await Product.find({}).countDocuments();
  let totalPages = Math.ceil(count / limitno);

  res.render("admin/productManagement", { product,totalPages, currentPage: page , message: "" });
});

//add product
const addProduct = asyncHandler(async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.description || !req.body.category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check for product existence
    const productExists = await Product.findOne({ name: req.body.name });
    if (productExists) {
      return res.status(400).json({
        success: false,
        message: "Product already exists with this name",
      });
    }

    // Process images
    const processedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const processedFileName = `processed-${file.filename}`;
        const outputPath = path
          .join("public", "assets", "imgs", "productIMG", processedFileName)
          .replace(/\\/g, "/");

        try {
          // Process image with sharp
          await sharp(file.path)
            .resize(880, 880, {
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

          processedImages.push(processedFileName);
        } catch (err) {
          console.error(`Error processing image ${file.filename}:`, err);
        }
      }
    }

    // If no images were processed successfully
    if (processedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to process any images",
      });
    }

    // Create product object
    const productData = {
      name: req.body.name,
      description: req.body.description,
      images: processedImages,
      gross_weight: Number(req.body.gross_weight),
      gold_purity: Number(req.body.gold_purity),
      category: req.body.category,
      making_charge: Number(req.body.making_charge),
      total_price: Number(req.body.total_price),
      discount_price: Number(req.body.total_price),
      stock: Number(req.body.stock),
      status: "Available",
    };

    // Save product
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    if (!savedProduct) {
      return res.status(400).json({
        success: false,
        message: "Failed to save product",
      });
    }

    // Success response
    return res.status(201).redirect("/admin/products");
  } catch (error) {
    console.error("Error in addProduct:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get add product page
const getAddProduct = asyncHandler(async (req, res) => {
  const category = await Category.find({ is_listed: true });

  console.log({ category });
  res.render("admin/addProduct", { category });
});

// Get edit product page
const getEditProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id });
  console.log(product);
  const category = await Category.find();
  console.log(product);
  console.log(category);
  res.render("admin/editProduct", { product, category });
});

// Updating product
const editProduct = asyncHandler(async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product
    let product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update basic product information
    product.name = req.body.name;
    product.description = req.body.description;
    product.total_price = req.body.total_price;
    product.discount_price = req.body.discount_price;
    product.category = req.body.category;
    product.gold_purity = req.body.gold_purity;
    product.gross_weight = req.body.gross_weight;
    product.making_charge = req.body.making_charge;
    product.stock = req.body.stock;

    // Handle deleted images
    if (req.body.deletedImages) {
      const deletedImages = req.body.deletedImages.split(",");

      // Remove deleted images from the product.images array
      product.images = product.images.filter(
        (img) => !deletedImages.includes(img)
      );

      // Delete the actual files
      deletedImages.forEach((image) => {
        const imagePath = path.join(
          __dirname,
          "../public/assets/imgs/productIMG",
          image
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    // Handle new images (using specific fields for editProductUpload)
    const newImages = [];
    ["newImage_0", "newImage_1", "newImage_2"].forEach((field) => {
      if (req.files && req.files[field]) {
        newImages.push(req.files[field][0].filename);
      }
    });

    // Add new images to the product's image array
    if (newImages.length > 0) {
      product.images = [...product.images, ...newImages];
    }

    // Save the updated product
    await product.save();

    res.redirect("/admin/products"); // Redirect to products list page
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
});
// list product
const listProducts = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const productData = await Product.updateOne(
    { _id: productId },
    { $set: { is_listed: true } }
  );
  res.redirect("/admin/products");
});
//unlist product
const unlistProducts = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const productData = await Product.updateOne(
    { _id: productId },
    { $set: { is_listed: false } }
  );
  res.redirect("/admin/products");
});

module.exports = {
  getProductManagement,

  getEditProduct,
  getAddProduct,
  addProduct,
  editProduct,
  listProducts,
  unlistProducts,
};
