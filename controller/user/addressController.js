const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");
const Address = require("../../model/addressModel")
//@des Get Manage Address page
//@route Get /useraddress
//@access public
const renderUserAddress = asyncHandler(async(req, res) => {
    const user_id = req.session.user_id;
    const userData = await User.findById(user_id);
    if (userData) {
        const addressData = await Address.find({user_id:user_id});
        res.render("user/manageAddress",{ userData,addressData });
      } else {
        res.redirect('/login');
      }
    
  });



//@des Get Edit Address page
//@route get /editaddress
//@access public
const renderEditUserAddress = asyncHandler(async(req, res) => {
    const user_id =  req.session.user_id;
      
    const userData = await User.findById(user_id);
    const id = req.query.id;
    const address = await Address.findById(id);

    res.render("user/editAddress", {  userData,address }); 
    
  })
  //@des Get Add Address page
  //@route get /addaddress
  //@access public
  const renderAddUserAddress = asyncHandler(async(req, res) => {
    const user_id =  req.session.user_id;
      
    const userData = await User.findById(user_id);
    if (userData) {
        res.render("user/addAddress", { userData });
      } else {
        res.redirect('/login');
      }

  });

   //@des POST Address page
  //@route post /addaddress
  //@access public

  const addNewAddress = asyncHandler(async(req,res)=>{
    const user_id = req.session.user_id;
    const userData = await User.findById(user_id);
    if (userData) {
        const{fullName,phoneNumber,pincode,locality,address,city,landmark,state} = req.body;
        const newAddress = new Address({
            user_id:user_id,
            fullName,
            phoneNumber,
            pincode,
            locality,
            address,
            city,
            landmark,
            state,
            is_listed:true
    
        });
        const addressData = await newAddress.save();
        console.log(addressData);
        res.redirect("/userAddress");
      } else {
        res.redirect('/login');
      }
    
  
  });
  //@des POST Edit Address page
  //@route post /editaddress
  //@access public
  const editAddress = asyncHandler(async(req,res)=>{
    
    const{id,fullName,phoneNumber,pincode,locality,address,city,landmark,state} = req.body;
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
            is_listed:true
          },
        }
      );
      console.log(updateData)
      res.redirect("/userAddress");
  });

  //@des delete Address page
  //@route post /deleteaddress
  //@access public

  const deleteAddress = asyncHandler(async(req,res)=>{
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
  })

  
  
      
    


 
  
  

  module.exports = {
    renderAddUserAddress,
    renderEditUserAddress,
    renderUserAddress,
    addNewAddress,
    editAddress,
    deleteAddress,
  }