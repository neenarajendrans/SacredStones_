const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const Offer = require("../../model/offerModel");
const asyncHandler = require('express-async-handler')


// Load offers page with pagination
const offerPageLoad = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const product = await Product.find({ is_listed:true },'_id name');
        const category = await Category.find({ is_listed:true },'_id name');
        
        const offers = await Offer.find()
        .populate('productId', 'name')
        .populate('categoryId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
            
        const totalOffers = await Offer.countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);
 

        res.render('admin/offerManagement', {
            offers,
            totalPages,
            currentPage: page,
            totalOffers,
            product,
            category
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading offers' });
    }
});

// Acivate Offer
const activateOffer = asyncHandler(async (req, res) => {
    const offerId = req.params.id
    
    const offer = await Offer.updateOne({ _id: offerId }, { $set: { status: true } })
    res.status(201).json({ success: true, message: "Offer Activated" });
  })
  
  const deactivateOffer = asyncHandler(async (req, res) => {
    const offerId = req.params.id
    console.log(offerId);
    
    const offer = await Offer.updateOne({ _id: offerId }, { $set: { status: false } })
    res.status(201).json({ success: true, message: "Offer Deactivated" });
  })

// Add new offer
const addOffer =asyncHandler( async (req, res) => {
    try {
        const {
            type,
            name,
            description,
            offerPercentage,
            validFrom,
            validity,
        } = req.body;
       console.log(req.body);
        // Validation
        if (!name?.trim()) {
            return res.status(400).json({ error: "Offer name is required" });
        }

        if (!description?.trim()) {
            return res.status(400).json({ error: "Description is required" });
        }

        const percentage = Number(offerPercentage);
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
            return res.status(400).json({ error: "Offer percentage must be between 1 and 100" });
        }
        let existingOffer;
        if (type === 'Products') {
            const productId = req.body.productId;
            existingOffer = await Offer.findOne({
                productId: productId,
                status: true,
                validity: { $gt: new Date() }
            });
        } else if (type === 'Category') {
            const categoryId = req.body.categoryId;
            existingOffer = await Offer.findOne({
                categoryId: categoryId,
                status: true,
                validity: { $gt: new Date() }
            });
        }

        if (existingOffer) {
            return res.status(400).json({ 
                error: `An active offer already exists for this ${type.toLowerCase()}` 
            });
        }

        // Create new offer
        const offerData = new Offer({
            name: name,
            description: description,
            offerPercentage: offerPercentage,
            validFrom:validFrom,
            validity: validity,
            type: type, 
           status:true
        });

       // Add type-specific fields
       if (type === 'Products') {
        const productId = req.body.productId;
        offerData.productId = productId;
    } else if (type === 'Category') {
        const categoryId = req.body.categoryId;
        offerData.categoryId = categoryId;

    }

    // Create and save the offer
    const newOffer = new Offer(offerData);
    await newOffer.save();
        res.redirect('/admin/offer')

    } catch (error) {
        console.error('Offer creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || "Error creating offer" 
        });
    }
});

// Delete offer
const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.query;
            console.log(offerId);
        const offer = await Offer.findByIdAndDelete(offerId);
        if (!offer) {
            return res.status(404).json({ error: "Offer not found" });
        }
        res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: "Error deleting offer" 
        });
    }
};


module.exports= {offerPageLoad,deleteOffer,deactivateOffer,activateOffer,addOffer}