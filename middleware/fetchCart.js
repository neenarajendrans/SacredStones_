const Cart = require("../model/cartModel");

const fetchCartData = async (req, res, next) => {
  try {
    if (req.session && req.session.user_id) {
      const cart = await Cart.findOne({
        user_id: req.session.user_id,
      }).populate("products.productData_id");
      res.locals.cart = cart;
    } else {
      res.locals.cart = null;
    }
    next();
  } catch (error) {
    console.error("Error fetching cart data:", error);
    next();
  }
};

module.exports = fetchCartData;
