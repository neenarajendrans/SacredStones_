const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Cart = require('../../model/cartModel');
const Product = require('../../model/productModel');
const { model } = require("mongoose");
const {calculateProductTotal,calculateSubtotal}=require('../../config/cartSum')

const getCartPage = asyncHandler(async (req, res) => {

    const userId = req.session.user_id;
    console.log('userId:',userId);
    const userData = await User.findById(userId);
    if (userData) {

        const userCart = await Cart.findOne({ user_id: userId }).populate("products.productData_id");
        let subtotalWithShipping=0
        if (userCart) {
            const cart = userCart ? userCart.products : [];
            const subtotal = calculateSubtotal(cart);
            const productTotal = calculateProductTotal(cart);
            const subtotalWithShipping = subtotal;
            console.log(productTotal,"sub12");
           
            let outOfStockError = false;
            if (cart.length > 0) {
                for (const cartItem of cart) {
                  const product = cartItem.productData_id;
          
                  if (product.stock < cartItem.qty) {
                    outOfStockError = true;
                    break;
                  }
                }
            }
            let maxQuantityErr = false;
                if (cart.length > 0) {
                  for (const cartItem of cart) {
                    const product = cartItem.productData_id;
            
                    if (product.stock > 2) {
                      maxQuantityErr = true;
                      break;
                    }
                  }
                }
                console.log(cart.length, "Ready...............");
                res.render("user/cart", { userData,
                  productTotal,
                  subtotalWithShipping,
                  outOfStockError,
                  maxQuantityErr,
                  cart });
        }else {
            // Handle scenario where user has no cart
            res.render("user/cart", { userData, cart: [],subtotalWithShipping });
        }

    } else {
            res.redirect('/login');
        }
    
});



///Add to cart
const addtoCart = asyncHandler(async (req, res) => {
    console.log("123")
    console.log(req.body.qty);

    // Guest User 
    if (!req.session.user_id) {
       return res.redirect('/signup?message=User+Doesn\'t+Exist');
    }
 
    const userId = req.session.user_id;
    const productId = req.body.productData_id;
    const qty = parseInt(req.body.qty, 10); // what is this 10 for?
    const stock = parseInt(req.body.stock, 10); // what is this 10 for?
      console.log('userId:',userId);
      console.log('product_Id:', productId);
      console.log('qty:', qty);
      console.log('stock:', stock);
	
    if (!userId || !productId || isNaN(qty) || qty <= 0 ) {
        // Handle missing or invalid parameters
        return res.status(400).json({ success: false, error: 'Invalid parameters' });
      }
    
    const product = await Product.findById(productId);
    if (!product || product.stock < qty) {
        return res.status(400).json({ success: false, error: 'Insufficient stock' });
    }

    //check product status
    if(product.status !== 'Available' || !product.is_listed || product.isDeleted){
      return res.status(404).json({success:false, error:"Product not Found"})
    }
    const maxQuantityPerUser = 5;
    const existingCart = await Cart.findOne({ user_id: userId });
    console.log(existingCart);
    
    if (existingCart) {
        const existingCartItem = existingCart.products.find(
          (item) => item.productData_id.toString() === productId
        );

        if (existingCartItem) {
          const newQuantity = existingCartItem.qty + qty;
          
          // Check if the new quantity exceeds maximum limit
          if (newQuantity > maxQuantityPerUser) {
              const availableToAdd = maxQuantityPerUser - existingCartItem.qty;

              return res.status(400).json({ success: false, error: `Cannot add ${qty} more items. you can only add ${availableToAdd} more items to this product` });
          }

          existingCartItem.qty = newQuantity;
      } else {
          if (qty > product.stock) { // ask chat gpt to help to set a limit to the cart item quantity here somewhere
              return res.status(400).json({ success: false, error: 'Requested quantity exceeds available stock' });
          }

          existingCart.products.push({
              productData_id: productId,
              qty: qty,
          });
      }

      // Update the cart total
      existingCart.total = existingCart.products.reduce(
          (total, item) => total + (item.qty || 0),
          0
      );

      await existingCart.save();
    } else {
        const newCart = new Cart({
          user_id: userId,
          products: [{ productData_id: productId, qty: qty }],
          total: qty,
        });
  
        await newCart.save();
      }
  
      res.redirect('/cart');
    // const product = await Product.findOne({ _id: productData_id }); // Changed to productData_id

    // const cart = await Cart.findOne({ user_id: userId});

    // if (cart) {
    //     let productExists = false;
    
    //     // Check if the product exists and update its quantity if it does
    //     cart.products.forEach(product => {
    //         console.log(product)
    //         if (product.productData_id=== productData_id) {

    //             productExists = true;
    //             const newQuantity = product.qty + qty;
    
    //             if (newQuantity > product.stock) {
    //                 return res.status(400).json({ status: 400, message: "The requested quantity exceeds available stock." });
    //             }
    
    //             product.qty = newQuantity;
    //         }
    //     });
    
    //     // If the product does not exist, add it to the cart
    //     if (!productExists) {
    //         cart.products.push({ productData_id: productData_id, qty });
    //     }
    
    //     await cart.save();
    //     res.status(200).json({ status: 200, message: "Product added/updated in cart successfully." });
    // }  else {
    //     console.log('Received data:', { userId, productData_id, qty }); // Log received data

    //     const newCart = new Cart({
    //         user_id: userId,
    //         products: [{ productData_id: productData_id, qty }], // Changed to productData_id
    //     });
    //     await newCart.save();
    //     console.log('New cart data:', newCart); // Log cart data
    // }

    // res.status(200).json({success:true,message:"Added to Cart"})
});

const updateQuantity = asyncHandler(async (req, res) => {


  const productId = req.query.productId;
  const newQuantity = parseInt(req.query.quantity);
  const userId = req.session.user_id;
  console.log(productId,"777777777777777777777777777");
  console.log(userId,"888888888888888888888");
  console.log(newQuantity,"9999999999999999999");

  const existingCart = await Cart.findOne({ user_id: userId });
  if (existingCart) {
    const existingCartItem = existingCart.products.find(
      (item) => item.productData_id.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.qty = newQuantity;
      existingCart.total = existingCart.products.reduce(
        (total, item) => total + (item.qty || 0),
        0
      );

      await existingCart.save();
    }

    res.json({ success: true });
  } else {
    res.json({ success: false, error: "Cart not found" });
  }

});






const deleteCartItem = asyncHandler(async (req, res) => {
    const userId = req.session.user_id;
    const productId = req.query.productId;
    const existingCart = await Cart.findOne({ user_id: userId });
    if (existingCart) {
      const updatedItems = existingCart.products.filter(
        (item) => item.productData_id.toString() !== productId
      );

      existingCart.products = updatedItems;
      existingCart.total = updatedItems.reduce(
        (total, item) => total + (item.qty || 0),
        0
      );

      await existingCart.save();

      res.json({ success: true ,toaster:true});
    } else {
      res.json({ success: false, error: "Cart not found" });
    }
})





module.exports = { getCartPage, addtoCart,updateQuantity , deleteCartItem};