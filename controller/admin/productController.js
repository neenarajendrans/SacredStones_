const Product = require("../../model/productModel");
const path=require('path')
const Category = require("../../model/categoryModel");
const User=require("../../model/userModel");
const asyncHandler = require('express-async-handler')

// add product

  const getProductManagement = asyncHandler(async (req, res) => {

    const product = await Product.find({}).populate('category')
    console.log(product)
    
      res.render("admin/productManagement",{product,messaage:''});
    });


const addProduct = asyncHandler(async(req,res)=>{
    console.log(req.body)
    console.log("00000000",req.files)
   
    
    let product = new Product({
        name:req.body.name,
        description:req.body.description,
        images:req.files.map(file => {
          return file.filename
      }),

        gross_weight:req.body.gross_weight,
        gold_purity:req.body.gold_purity,
        category:req.body.category,
        making_charge:req.body.making_charge,
        total_price:req.body.total_price,
        discount_price:req.body.discount_price,
        stock:req.body.stock

    });


    product = await product.save();
    if(!product)
      return res.status(404).send('The category cannot be created');

  
  res.redirect('/admin/products')
})

const getAddProduct = asyncHandler(async (req, res) => {
    const category = await Category.find({})
   
    console.log({category})
    res.render("admin/addProduct",{category});
  });

  const getEditProduct= asyncHandler(async (req, res) => {
 const product = await Product.findOne({ _id: req.params.id })
 console.log(product)
    const category = await Category.find()
    console.log(product);
    console.log(category)
    res.render("admin/editProduct", { product, category })
  });


  const editProduct = asyncHandler(async (req, res) => {
    //  const { name, description,} = req.body
    console.log(req.body)
    let product = await Product.findOne({_id: req.params.id});

    console.log({product})

    let images;
    console.log(req.files)
    if (req.files?.length > 0) {
        images = req.files.map(file => { 
            return file.filename
        })
        // product.images.push(...images)
        product.images = images;
    }



    console.log(req.files)
    // gross_weight:req.body.gross_weight,
    // gold_purity:req.body.gold_purity,
    // category:req.body.category,
    // making_charge:req.body.making_charge,
    // total_price:req.body.total_price,
    // discount_price:req.body.discount_price,
    // stock:req.body.stock

    product.name = req.body.name;
    product.description = req.body.description;
    product.gross_weight = req.body.gross_weight;
    product.gold_purity = req.body.gold_purity;
    product.category = req.body.category;
    product.making_charge = req.body.making_charge;
    product.total_price= parseInt(req.body.total_price);
    product.language = req.body.language;
    product.discount_price= parseInt(req.body.discount_price);
    product.stock = parseInt(req.body.stock);
   

    await product.save();

    res.redirect("/admin/products")
})

const listProducts = asyncHandler(async (req, res) => {
  const productId = req.params.id
  const productData = await Product.updateOne({ _id: productId }, { $set: { is_listed: true } })
  res.redirect("/admin/products")
})

const unlistProducts = asyncHandler(async (req, res) => {
  const productId = req.params.id
  const productData = await Product.updateOne({ _id: productId }, { $set: { is_listed: false } })
  res.redirect("/admin/products")
})


module.exports={getProductManagement,
    getEditProduct,
    getAddProduct,
    addProduct,
    editProduct,
    listProducts,
    unlistProducts
}