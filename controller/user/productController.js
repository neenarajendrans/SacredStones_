const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const asyncHandler = require("express-async-handler");
const User = require("../../model/userModel");





//sort

const sortProduct = asyncHandler(async(req,res)=>{
    const sortOption = req.body.sortby;
    let sortedData;
            
    switch(sortOption){
        
        case 'priceLowToHigh':
            sortedData = await Product.find({}).sort({discount_price: 1});
            break;
        case 'priceHighToLow':
            sortedData = await Product.find({}).sort({discount_price: -1});
            break;
        case 'newArrivals': 
            sortedData = await Product.find({}).sort({createdOn: -1});
            break;
        case 'nameAZ':
            sortedData = await Product.find({}).sort({name: 1});
            break;
        case 'nameZA':
            sortedData = await Product.find({}).sort({name: -1});
            break;
        default:
            res.json({ success: false, message: 'Invalid sort option' });
            return;
       
    }
    
    res.json({success: true, data: sortedData}); 
})
// sorting products 
const sortProducts = async (req, res) => {

    try {
        
        const sortOption = req.body.sortby;
        let sortedData;
                
        switch(sortOption){
            
            case 'priceLowToHigh':
                sortedData = await Product.find({}).sort({prdctPrice: 1});
                break;
            case 'priceHighToLow':
                sortedData = await Product.find({}).sort({prdctPrice: -1});
                break;
            case 'newArrivals': 
                sortedData = await Product.find({}).sort({createdOn: -1});
                break;
            case 'nameAZ':
                sortedData = await Product.find({}).sort({prdctName: 1});
                break;
            case 'nameZA':
                sortedData = await Product.find({}).sort({prdctName: -1});
                break;
            default:
                res.json({ success: false, message: 'Invalid sort option' });
                return;
           
        }
        
        res.json({success: true, data: sortedData});

    } catch (error) {
        res.render("404");
    }

}