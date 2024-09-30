const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Cart = require('../../model/cartModel');
const Product = require('../../model/productModel');
const { model } = require("mongoose");

const getCartPage = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user_id: req.session.user_id }).populate('products.productData_id');
    const shippingCharge = 0.05;
    res.render('user/cart', { shippingCharge, products: cart ? cart.products : [] });
});

const addtoCart = asyncHandler(async (req, res) => {
    console.log("123")
    console.log(req.body.qty);
    if (!req.session.user_id) {
       return res.redirect('/signup?message=User+Doesn\'t+Exist');
    }
 
    const {productData_id, qty}= req.body;		
    const userId = req.session.user_id;
	

    const product = await Product.findOne({ _id: productData_id }); // Changed to productData_id

    const cart = await Cart.findOne({ user_id: userId});

    if (cart) {
        let productExists = false;
    
        // Check if the product exists and update its quantity if it does
        cart.products.forEach(product => {
            console.log(product)
            if (product.productData_id=== productData_id) {

                productExists = true;
                const newQuantity = product.qty + qty;
    
                if (newQuantity > product.stock) {
                    return res.status(400).json({ status: 400, message: "The requested quantity exceeds available stock." });
                }
    
                product.qty = newQuantity;
            }
        });
    
        // If the product does not exist, add it to the cart
        if (!productExists) {
            cart.products.push({ productData_id: productData_id, qty });
        }
    
        await cart.save();
        res.status(200).json({ status: 200, message: "Product added/updated in cart successfully." });
    }  else {
        console.log('Received data:', { userId, productData_id, qty }); // Log received data

        const newCart = new Cart({
            user_id: userId,
            products: [{ productData_id: productData_id, qty }], // Changed to productData_id
        });
        await newCart.save();
        console.log('New cart data:', newCart); // Log cart data
    }

    res.status(200).json({success:true,message:"Added to Cart"})
});

const increaseQuantity = asyncHandler(async (req, res) => {
    const productData_id = req.params.productData_id;
    const currentQty = parseInt(req.params.qty);
    const updatedQty = currentQty + 1;
    const user_id = req.session.user_id;
    const { stock } = await Product.findOne({ _id: productData_id }, { stock: 1 })
    if (currentQty >= stock) {
        res.status(406).json({ message: "Out of Stock" })
        return;
    }
    const cart = await Cart.findOne({ userId })
    cart.products.forEach(product => {
        if (product.productData_id.toString() === productData_id.toString())
            product.qty = updatedQty
    });
    await cart.save();
    res.status(206).json({ message: updatedQty });

})


const decreaseQuantity = asyncHandler(async (req, res) => {
    const productData_id = req.params.productData_id;
    const currentQty = parseInt(req.params.qty);
    const updatedQty = currentQty - 1; 
    const user_id = req.session.userId;
    const { stock } = await Product.findOne({ _id: productData_id }, { stock: 1 });

    if (updatedQty < 1) { 
        res.status(406).json({ message: "Quantity cannot be less than 0" });
        return;
    }
    const cart = await Cart.findOne({ user_id });
    cart.products.forEach(product => {
        if (product.productData_id.toString() === productData_id.toString())
            product.qty = updatedQty;
    });
    await cart.save();
    res.status(206).json({ message: updatedQty });
});



const deleteCartItem = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user_id: req.session.user_id })
    const index = cart.products.findIndex(product => product.productData_id.toString() === req.params.id.toString())
    cart.products.splice(index, 1)
    await cart.save()
    res.redirect("/cart")
})


module.exports = { getCartPage, addtoCart, decreaseQuantity,increaseQuantity,deleteCartItem };