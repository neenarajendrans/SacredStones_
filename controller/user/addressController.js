const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Address = require("../../model/addressModel");

// Get Manage Address page

const renderUserAddress = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;
  const userData = await User.findById(user_id);
  if (userData) {
    const addressData = await Address.find({ user_id: user_id }).sort({
      createdAt: -1,
    });
    res.render("user/manageAddress", { userData, addressData });
  } else {
    res.redirect("/login");
  }
});

//Get Edit Address page

const renderEditUserAddress = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;

  const userData = await User.findById(user_id);
  const id = req.query.id;
  const address = await Address.findById(id);

  res.render("user/editAddress", { userData, address });
});

// Get Add Address page

const renderAddUserAddress = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;

  const userData = await User.findById(user_id);
  if (userData) {
    res.render("user/addAddress", { userData });
  } else {
    res.redirect("/login");
  }
});

// Add Address

const addNewAddress = asyncHandler(async (req, res) => {
  const user_id = req.session.user_id;
  const userData = await User.findById(user_id);
  if (userData) {
    const {
      fullName,
      phoneNumber,
      pincode,
      locality,
      address,
      city,
      landmark,
      state,
    } = req.body;
    const newAddress = new Address({
      user_id: user_id,
      fullName,
      phoneNumber,
      pincode,
      locality,
      address,
      city,
      landmark,
      state,
      is_listed: true,
    });
    const addressData = await newAddress.save();
    console.log(addressData);
    res.json({ success: true });
  } else {
    res.redirect("/login");
  }
});

// Upadate Address

const editAddress = asyncHandler(async (req, res) => {
  const {
    id,
    fullName,
    phoneNumber,
    pincode,
    locality,
    address,
    city,
    landmark,
    state,
  } = req.body;
  const updateData = await Address.findByIdAndUpdate(
    { _id: id },
    {
      $set: {
        fullName,
        phoneNumber,
        pincode,
        locality,
        address,
        city,
        landmark,
        state,
        is_listed: true,
      },
    }
  );
  console.log(updateData);
  res.json({ success: true });
});

// delete Address

const deleteAddress = asyncHandler(async (req, res) => {
  const id = req.query.id;
  const addressData = await Address.findByIdAndUpdate(
    { _id: id },
    {
      $set: {
        is_listed: false,
      },
    }
  );
  res.redirect("/userAddress");
});

module.exports = {
  renderAddUserAddress,
  renderEditUserAddress,
  renderUserAddress,
  addNewAddress,
  editAddress,
  deleteAddress,
};
