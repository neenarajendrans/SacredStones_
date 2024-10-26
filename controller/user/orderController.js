const asyncHandler = require("express-async-handler");
const Address = require("../../model/addressModel");
const User = require("../../model/userModel");
const Cart = require('../../model/cartModel');
const Product = require('../../model/productModel');
const {calculateProductTotal,calculateSubtotal}=require('../../config/cartSum')
const Order = require("../../model/orderModel");


//@des Get Checkout page
//@route Get /order/checkout
//@access public

const getCheckOutPage = asyncHandler(async (req, res) => {
    const userId = req.session.user_id;
  
    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ user_id: userId })
      .populate({
        path: "products.productData_id",
        model: "Product",
      })
      .exec();
console.log(cart,"cart page");

if (!cart) {
  console.log("Cart not found.");
}
const cartItems = cart.products || [];
const subtotal = calculateSubtotal(cartItems);
const productTotal = calculateProductTotal(cartItems);
const subtotalWithShipping = subtotal ;
const addressData = await Address.find({ user_id: userId });
  res.render("user/checkOut",{userData,addressData,cart:cartItems,productTotal,subtotalWithShipping});
  });


//@des post Checkout page
//@route post /order/checkout
//@access public


const checkOutPost = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;

  const { address, paymentMethod } = req.body;

  const user = await User.findById(userId);

  const cart = await Cart.findOne({ user_id: userId })
    .populate({
      path: "products.productData_id",
      model: "Product",
    })
    .populate("user_id");

  if (!user || !cart) {
    return res.status(500).json({ success: false, error: "User or cart not found" });
  }

  if (!cart || cart.products.length === 0) {
    return res.status(400).json({ error: "Your cart is empty" });
  }

  if (!address) {
    return res.status(400).json({ error: 'Billing address not selected' });
  }

  const cartItems = cart.products || [];

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + (item.productData_id.discount_price * item.qty || 0),
    0
  );

  console.log(totalAmount, "akkkkkl");

  const order = new Order({
    user_id: userId,
    address: address,
    orderDate: new Date(),
    orderstatus: "Pending",
    paymentMethod: paymentMethod,
    paymentStatus: "Pending",
    deliveryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
    totalAmount: totalAmount,
    items: cartItems.map((cartItem) => ({
      product: cartItem.productData_id,
      qty: cartItem.qty,
      price: cartItem.productData_id.discount_price,
    })),
  });

  await order.save();

  // Store the cart items for stock update before clearing the cart
  const originalCartItems = [...cartItems];

  // Clear the user's cart after the order is placed
  cart.products = []; // Clearing items
  cart.total = 0; // Resetting totalAmount

  await cart.save(); // Save the updated cart

  // Update product quantities based on original cart items
  await Promise.all(originalCartItems.map(item =>
    Product.findByIdAndUpdate(
      item.productData_id._id, 
      { $inc: { stock: -item.qty } } // Update the stock field instead of qty
    )
  ));

  res.status(200).json({ success: true, message: 'Order placed successfully' });
});




//@des Get orderDatail page
//@route Get /order/ordersuccess
//@access public

const loadOrderDetails = asyncHandler(async (req, res) => {
  const userId =  req.session.user_id;

  const userData = await User.findById(userId);
  const order = await Order.find({ user_id: userData._id })
  .populate('user_id')
  .populate({
    path: 'items.product',
    model: 'Product',
  })


console.log(order," Details");
  if (userData) {
   
      res.render("user/orders",{ userData,order });
    } else {
      res.redirect('/login');
    }
});

// single order page-------------------------

const singleOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.session.user_id;
  const orderId = req.params.id;

  const userData = await User.findById(userId);
  const order = await Order.findById(orderId)
    .populate("user_id")
    .populate({
      path: "address",  // The field name in your schema is 'address'
      model: "Address", // The model name is 'address', all lowercase
    })
    .populate({
      path: "items.product",
      model: "Product",
    });

  console.log(order, "wow");

  res.render("user/orderDetailed", { userData, order });
});




    







module.exports={getCheckOutPage,checkOutPost,loadOrderDetails, singleOrderDetails}