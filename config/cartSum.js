const calculateSubtotal = (cart) => {
  console.log(cart, "hello cart");
  let subtotal = 0;
  for (const cartItem of cart) {
    subtotal += cartItem.productData_id.discount_price * cartItem.qty;
  }
  return subtotal;
};

const calculateProductTotal = (cart) => {
  const productTotals = [];
  for (const cartItem of cart) {
    const total = cartItem.productData_id.discount_price * cartItem.qty;
    productTotals.push(total);
  }
  return productTotals;
};
module.exports = {
  calculateSubtotal,
  calculateProductTotal,
};
