const Product = require("../../model/productModel");
const path=require('path');
const fs = require('fs'); 
const Category = require("../../model/categoryModel");
const User=require("../../model/userModel")
const asyncHandler = require('express-async-handler')
// GET CATEGORY
const getCategoryManagement = asyncHandler(async (req, res) => {
   const category = await Category.find({})
    res.render("admin/categoryManagement",{category:category,message:''});
  });

// ADD CATEGORY // not working validation prob + condition foe checking if the category already exits

const addCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const image = req.file.filename; // Assuming you are uploading an image

    // Check if name and description are provided
    if (!name || !description ) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    try {
        // Create a new category instance
        const category = new Category({
            name,
            description,
            image
        });
        const existCategory = await Category.findOne({ name: name});
        if (existCategory) {
          return res.render("admin/addcategory", {
            message: "This category already exists",
          });
          } else { // Save the new category to the database
            await category.save();
            res.redirect('/admin/category')
          }

       
    } catch (err) {
        console.error('Error adding category:', err);
        res.status(500).json({ error: 'Failed to add category' });
    }
});



    
const getAddCategory = asyncHandler(async (req, res) => {
    res.render("admin/addCategory");
  });
const getEditCategory = asyncHandler(async (req, res) => {
  console.log('inside edit catge')
  const category = await Category.findOne({ _id: req.params.id })
    res.render("admin/editcategory",{category});

  });

  const editCategory = asyncHandler( async (req, res) => {
    const { name, description,id } = req.body;
    // const image = req.file.filename; 
    // const {id }= req.params;
    console.log('inside edit cat')
    console.log(req.body)
    const catname = req.body.name.trim().toLowerCase()
    const existingCategory = await Category.findOne({name:catname});
    if(existingCategory){
        req.session.message = "Category exists"
        res.redirect('/admin/categoryManagement')
        return;
    }
    const category = await Category.updateOne({ _id: id }, { $set: { name, description } })
    res.redirect("/admin/category")
})


  const getDeleteCategory = asyncHandler(async (req, res) => {
    res.redirect("admin/category");
  });

  const listCategory = asyncHandler (async (req, res) => {
    const categoryId = req.params.id
    const categoryData = await Category.updateOne({ _id: categoryId }, { $set: { is_listed: true } })
    res.redirect("/admin/category")
})

const unlistCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.id
    const categoryData = await Category.updateOne({ _id: categoryId }, { $set: { is_listed: false } })
    res.redirect("/admin/category")
})

// Function to delete the image
const deleteImage = asyncHandler(async (req, res) => {
  const categoryId = req.query.id;
  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const imagePath = path.join(__dirname, '..', 'public', 'assets', 'imgs', 'categoryIMG', category.image);
  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Failed to delete image' });
    }
  });

  category.image = '';
  await category.save();
  res.status(200).json({ message: 'Image deleted successfully' });
});

// Function to update the image
const updateImage = asyncHandler(async (req, res) => {
  const categoryId = req.query.id;
  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const image = req.file.filename; 
  category.image = image;
  await category.save();
  res.status(200).json({ image });
});


module.exports = {
     getCategoryManagement,
     getDeleteCategory,
     getEditCategory,
     addCategory,
     getAddCategory,
     editCategory,
     listCategory,
     unlistCategory,
     deleteImage, 
     updateImage
}