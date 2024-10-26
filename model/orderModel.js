// const { type } = require("express/lib/response");
const mongoose = require("mongoose")
// const {v4:uuidv4} = require('uuid'); // for creating a random number as orderID
const OrdersSchema = new mongoose.Schema({


    // orderId:{
    //     type:String,
    //     default:()=>uuidv4(),
    //     unique:true

    // },
    user_id:{
        type:mongoose.mongo.ObjectId,
        required:true,
        ref:"User"
    },
    items:[{
        product:{
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
        required:true,
    },
    shipping:{
        type:String,
        default:"Free Shipping"
    },
    // finalAmount:{ // after discound
    //     type:Number,
    //     required:true,
    // },
    // discount:{
    //     type:Number,
    //     default:0,
    // },
    totalAmount:{
        type:Number,
        required:true,
    },
    paymentStatus:{
        type:String,
        default:'pending',
    },
    orderStatus:{
        type:String,
        default: "Placed",
        required:true
    },
    reason:{
        type:String,
    },
    // invoiceDate:{
    //     type:Date,

    // },
    // productCancellation:{
    //     cancelStatus:{
    //         type:Boolean,
    //         default:false
    //     },
    //     description:{
    //         type:String,
    //     }
    // },
    // productReturned:{
    //     returnStatus:{
    //         type:Boolean,
    //         default:false,
    //     },
    //     description:{
    //         type:String,
    //     }
    // },
    orderDate:{
        type:Date,
        default:Date.now

    },
    deliveryDate:{
        type:Date,
        

    },
    // couponApplied:{
    //     type:Boolean,
    //     default:false
    // }
    
},{timestamps:true})

const ordersModel = mongoose.model('Order',OrdersSchema)
module.exports = ordersModel;