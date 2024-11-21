const mongoose = require("mongoose")
const address = new mongoose.Schema({

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
    },
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
    state:{
        type:String,
        required:true,
    },
    is_listed:{
        type:Boolean,
        default:true
    }
   

},{timestamps:true})

const addressModel = mongoose.model('Address',address)
module.exports = addressModel;