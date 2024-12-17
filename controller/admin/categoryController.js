const Product = require("../../model/productModel");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const Category = require("../../model/categoryModel");
const User = require("../../model/userModel");
const asyncHandler = require("express-async-handler");

// GET CATEGORY
const getCategoryManagement = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 7;
  const skip = (page - 1) * limit;
  const category = await Category.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCategories = await Category.countDocuments();
  const totalPages = Math.ceil(totalCategories / limit);

  res.render("admin/categoryManagement", {
    category: category,
    message: "",
    currentPage: page,
    totalPages: totalPages,
    totalCategories: totalCategories,
  });
});

// ADD CATEGORY
const addCategory = asyncHandler(async (req, res) => {
  try {
    if (!req.body.name || !req.body.description) {
      return res.redirect('/admin/errorpage');
    }
    const categoryExists = await Category.findOne({ name: req.body.name });
    if (categoryExists) {
      res.render("admin/errorPage", { message: "Category already exists with this name" });
    }
    // Process image
    let processedImage = null;
    if (req.file) {
      const processedFileName = `processed-${req.file.filename}`;
      const outputPath = path
        .join("public", "assets", "imgs", "categoryIMG", processedFileName)
        .replace(/\\/g, "/");

      try {
        // Process image with sharp
        await sharp(req.file.path)
          .resize(880, 880, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        processedImage = processedFileName;
      } catch (err) {
        console.error(`Error processing image ${req.file.filename}:`, err);
        res.render("admin/errorPage", { message: "Failed to Process the Image" });
      }
    }
    // If no image was processed successfully
    if (!processedImage) {
      res.render("admin/errorPage", { message: "Category image is required" });
    }
    // Create category object
    const categoryData = {
      name: req.body.name,
      description: req.body.description,
      image: processedImage,
      status: req.body.status || "Active", // Default status
    };
    // Save category
    const newCategory = new Category(categoryData);
    const savedCategory = await newCategory.save();
    if (!savedCategory) {
      res.render("admin/errorPage", { message: "Failed to save the category" });
    }
    // Success response - redirect to categories page
    return res.status(201).redirect("/admin/category");
  } catch (error) {
    console.error("Error in addCategory:", error);
    res.render("admin/errorPage", { message: "Server Error" });
  }
});

// GET ADD CATEGORY
const getAddCategory = asyncHandler(async (req, res) => {
  res.render("admin/addCategory");
});
const getEditCategory = asyncHandler(async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id });
    
    // If no category is found, redirect to error page
    if (!category) {
      return res.redirect('/admin/errorpage');
    }
    
    res.render("admin/editCategory", { category });
  } catch (error) {
    // Handle any potential errors (like invalid ObjectId)
    console.error('Error fetching category:', error);
    res.redirect('/admin/errorpage');
  }
});

// UPDATE CATEGORY
const editCategory = asyncHandler(async (req, res) => {
  try {
    const categoryId = req.params.id;
    // Find the category
    let category = await Category.findById(categoryId);
    if (!category) {
      return res.render("admin/errorPage", { message: "Category not found" });
    }
    // Check for duplicate category name (excluding current category)
    const existingCategory = await Category.findOne({
      name: req.body.name.trim().toLowerCase(),
      _id: { $ne: categoryId },
    });
    if (existingCategory) {
      req.session.message = "Category name already exists";
      return res.render("admin/errorPage", { message: "Category already exists" });
    }
    // Update basic category information
    category.name = req.body.name.trim().toLowerCase();
    category.description = req.body.description;
    // Handle image deletion
    if (req.body.deleteCurrentImage === "true" && category.image) {
      // Delete the actual file
      const imagePath = path.join(
        __dirname,
        "../public/assets/imgs/categoryIMG",
        category.image
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        category.image = ""; // Clear the image field
      }
    }
    // Handle new image upload
    if (req.files && req.files.newImage) {
      // If there's an existing image, delete it first
      if (category.image) {
        const oldImagePath = path.join(
          __dirname,
          "../public/assets/imgs/categoryIMG",
          category.image
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // Update with new image
      category.image = req.files.newImage[0].filename;
    }
    // Validate required fields
    if (
      !category.name ||
      (!category.image && req.body.deleteCurrentImage === "true")
    ) {
      req.session.message = "Category name and image are required";
      return res.redirect(`/admin/editcategory/${categoryId}`);
    }
    // Save the updated category
    await category.save();
    req.session.message = "Category updated successfully";
    res.redirect("/admin/category");
  } catch (error) {
    console.error("Error updating category:", error);
    return res.render("admin/errorPage", { message: "Error" });
  }
});

//LIST CATEGORY
const listCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  // Update the category to listed
  await Category.updateOne({ _id: categoryId }, { $set: { is_listed: true } });
  // Update all products in the category to listed
  await Product.updateMany(
    { category: categoryId },
    { $set: { is_listed: true } }
  );
  res.redirect("/admin/category");
});

//UNLIST CATEGORY
const unlistCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  // Update the category to unlisted
  await Category.updateOne({ _id: categoryId }, { $set: { is_listed: false } });
  // Update all products in the category to unlisted
  await Product.updateMany(
    { category: categoryId },
    { $set: { is_listed: false } }
  );
  res.redirect("/admin/category");
});

module.exports = {
  getCategoryManagement,
  getEditCategory,
  addCategory,
  getAddCategory,
  editCategory,
  listCategory,
  unlistCategory,
};
