// const { type } = require("express/lib/response");
const mongoose = require("mongoose")
const {v4:uuidv4} = require('uuid'); // for creating a random number as orderID
const OrdersSchema = new mongoose.Schema({


    orderId:{
        type:String, 
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    items:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"Product"
        },
        name: {                 
            type: String,
            required: true
        },
        image: {              
            type:[String],
            required: true
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
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address", // Changed from "address" to "Address" to match model name
        required: true
      },
    paymentMethod:{
        type:String,
        enum : ['CashOnDelivery','Online','Wallet'],
        default:"CashOnDelivery",
        required:true,
    },
    shipping:{
        type:String,//calculate as per the total amount
        default:"Free Shipping"
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
    paymentStatus:{
        type:String,
        enum :['Pending','Paid','Failed','Refunded', 'Refund Pending'],
        default:'Pending',
        required:true
    },
    orderStatus:{
        type:String,
        enum : ['Pending','Placed','Processing','Shipped','Confirmed','Delivered','Cancelled','Return Request','Returned'],
        default: "Placed",
        required:true
    },
    invoiceDate:{
        type:Date,

    },
      paymentFailureReason :{
        type : String,
        default : ''
    },
    cancellationReason: {
        type: String,
        default: ''
    },
    returnReason: {
        type: String,
        default: ''
    },
    orderDate:{
        type:Date,
        default:Date.now

    },
    deliveryDate:{
        type:Date,
    
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    razorpayOrderId:{
        type : String,
        default : ''
    },
    refundId: {
        type: String,
        default: ''
    },

    
},{timestamps:true})

const ordersModel = mongoose.model('Order',OrdersSchema)
module.exports = ordersModel;