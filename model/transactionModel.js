const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    
    userId:{
        type:mongoose.mongo.ObjectId,
        ref:'User',
    },
    amount:{
        type:'number',
    },
    order:{
        type:mongoose.mongo.ObjectId,
        ref:'Order'
    },
    paymentMethod:{
        type:String,
        enum:["COD","Card","Wallet"],
        required:true,
    },
    status:{
        type:String,
        enum:['paid','unpaid','declined'],
        default:'paid'
    },
    type:{
        type:String,
        enum:['Debit','Credit']
    },
    description :{
        type:'String',
    },
},{timestamps:true})

const Transaction = mongoose.model('Transaction',transactionSchema);

module.exports = Transaction;

