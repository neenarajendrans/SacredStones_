const mongoose = require("mongoose")
const {v4:uuidv4} = require('uuid'); // for creating a random number as orderID
const ordersSchema = new mongoose.Schema({


    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true

    },
    userId:{
        type:mongoose.mongo.ObjectId,
        required:true,
        ref:"User"
    },
    items:[{
        productId:{
            type:mongoose.mongo.ObjectId,
            required:true,
            ref:"Product"
        },
        qty:{
            type:Number,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        }
    }],
    address:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"address", 
        required:true
      
    },
    paymentMethod:{
        type:String,
        enum:["COD","Card","Wallet"],
        required:true,
    },
    deliveryCharge:{
        type:Number,
        required:true,
    },
    finalAmount:{ // after discound
        type:Number,
        required:true,
    },
    discount:{
        type:Number,
        default:0,
    },
    totalAmount:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        enum: ["Pending","Processing","Placed","Shipped","Delivered","Cancelled","Return Request", "Returned"],
        default: "Placed",
        required:true
    },
    invoiceDate:{
        type:Date,

    },
    productCancellation:{
        cancelStatus:{
            type:Boolean,
            default:false
        },
        description:{
            type:String,
        }
    },
    productReturned:{
        returnStatus:{
            type:Boolean,
            default:false,
        },
        description:{
            type:String,
        }
    },
    createdOn:{
        type:Date,
        default:Date.now

    },
    couponApplied:{
        type:Boolean,
        default:false
    }
    
},{timestamps:true})

const ordersModel = mongoose.model('Orders',ordersSchema)
module.exports = ordersModel;