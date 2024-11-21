const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    products: [{
        productData_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        qty: {
            type: Number,
            required: true,
            min: 1,

        },
    }],
    total:{
        type:Number,
        default:0,
    },
     date : {
        type : Date,
        default : Date.now
    }
}, { timestamps: true });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
