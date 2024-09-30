const mongoose = require ('mongoose')
const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    offerPrice:{
        type:Number,
        required:true,
    },
    minimumPrice:{
        type:Number,
        required:true,
    },
    createdOn:{
        type:Date,
        required:true,
    },
    expireOn:{
        type:Date,
        required:true,
    }, 
    usedUserCount:{
        type:Number, // this Actually not needed?
        default:0,
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }]
    
    
},{timestamps:true})
const couponModel = mongoose.model('Coupon',couponSchema)
module.exports=couponModel;