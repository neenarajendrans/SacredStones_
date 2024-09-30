const mongoose = require("mongoose")
const addressSchema = new mongoose.Schema({

    fullName:{
        type:String,
        required:true,
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    phoneNumber:{
        type:Number,
        required:true,
    },
    pincode:{
        type:Number,
        required:true
    },//is this correct or we have to use a single address array and inside it all the other details like pin locatity ...?
    locality:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true,
    },
    landmark:{
        type:String,
        required:true,
    },

},{timestamps:true})

const addressModel = mongoose.model('address',addressSchema)
module.exports = addressModel;