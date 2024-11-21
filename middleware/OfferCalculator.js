

const Offer = require('../model/offerModel');
const Product = require('../model/productModel')

// Middleware to calculate final prices with offers
// const calculateProductPrices = async (req, res, next) => {
//     try {
//         // Get products from previous middleware or request
//         const products = Array.isArray(req.products) ? req.products : [req.products];
//         const currentDate = new Date();

//         // Fetch all active offers once
//         const activeOffers = await Offer.find({
//             status: true,
//             validFrom: { $lte: currentDate },
//             validity: { $gte: currentDate }
//         }).lean();

//         // Create maps for quick offer lookup
//         const offerMap = new Map();
        
//         // Only store the highest percentage offer for each product/category
//         activeOffers.forEach(offer => {
//             const key = offer.type === 'Products' ? 
//                 `product_${offer.productId}` : 
//                 `category_${offer.categoryId}`;
            
//             if (!offerMap.has(key) || offerMap.get(key).offerPercentage < offer.offerPercentage) {
//                 offerMap.set(key, offer);
//             }
//         });

//         // Process each product
//         const processedProducts =await products.map(product => {
//             // Ensure product and product.category are defined
//             if (!product || !product.category) {
//                 return product; // Return product as is if it’s missing necessary data
//             }
//             const productId = product._id.toString();
//             const categoryId = product.category._id.toString();
            
//             // Get applicable offers
//             const productOffer = offerMap.get(`product_${productId}`);
//             const categoryOffer = offerMap.get(`category_${categoryId}`);
//             console.log(productOffer+'product offers 111111111111111111111111111')
//             console.log(categoryOffer+'22222222222222222222222222coffer')
//             // Choose the better offer
//             let appliedOffer = null;
//             if (productOffer && categoryOffer) {
//                 appliedOffer = productOffer.offerPercentage >= categoryOffer.offerPercentage ? 
//                     productOffer : categoryOffer;
//             } else {
//                 appliedOffer = productOffer || categoryOffer;
//             }

//             // Calculate final price
//             let finalPrice = product.total_price;
//             let discountAmount = 0;
//             let discountPercentage = 0;

//             if (appliedOffer) {
//                 discountAmount = (finalPrice * appliedOffer.offerPercentage) / 100;
//                 finalPrice -= discountAmount;
//                 discountPercentage = appliedOffer.offerPercentage;
//             }

//             // Round the final price
//             finalPrice = Math.round(finalPrice * 100) / 100;

//             // Update the product's discount_price in the database
//             try {
//                 await Product.findByIdAndUpdate(
//                     productId,
//                     { discount_price: finalPrice },
//                     { new: true }
//                 );
//             } catch (error) {
//                 console.error(`Error updating discount_price for product ${productId}:`, error);
//             }
//             return {
//                 ...product,
//                 finalPrice,
//                 discount_price: finalPrice,
//                 basePrice: product.total_price,
//                 discountAmount: Math.round(discountAmount * 100) / 100,
//                 discountPercentage,
//                 offer: appliedOffer ? {
//                     name: appliedOffer.name,
//                     type: appliedOffer.type,
//                     percentage: appliedOffer.offerPercentage
//                 } : null,
//                 hasOffer: !!appliedOffer
//             };
//         });

//         // Store processed products back in request
//         req.products = Array.isArray(req.products) ? processedProducts : processedProducts[0];
//         next();
//     } catch (error) {
//         next(error);
//     }
// };

// // Helper function to check if a product/category already has an offer
// const checkExistingOffer = async (type, id) => {
//     const currentDate = new Date();
//     const existingOffer = await Offer.findOne({
//         [type === 'Products' ? 'productId' : 'categoryId']: id,
//         type,
//         status: true,
//         validFrom: { $lte: currentDate },
//         validity: { $gte: currentDate }
//     });
//     console.log(existingOffer)
    
//     return existingOffer !== null;
// };

// Middleware to calculate final prices with offers
const calculateProductPrices = async (req, res, next) => {
    try {
        // Get products from previous middleware or request
        const products = Array.isArray(req.products) ? req.products : [req.products];
        const currentDate = new Date();

        // Fetch all active offers once
        const activeOffers = await Offer.find({
            status: true,
            validFrom: { $lte: currentDate },
            validity: { $gte: currentDate }
        }).lean();

        // Create maps for quick offer lookup
        const offerMap = new Map();
        
        // Only store the highest percentage offer for each product/category
        activeOffers.forEach(offer => {
            const key = offer.type === 'Products' ? 
                `product_${offer.productId}` : 
                `category_${offer.categoryId}`;
            
            if (!offerMap.has(key) || offerMap.get(key).offerPercentage < offer.offerPercentage) {
                offerMap.set(key, offer);
            }
        });

        // Process each product
        const processedProducts = await Promise.all(products.map(async product => {
            // Ensure product and product.category are defined
            if (!product || !product.category) {
                return product; // Return product as is if it's missing necessary data
            }
            const productId = product._id.toString();
            const categoryId = product.category._id.toString();
            
            // Get applicable offers
            const productOffer = offerMap.get(`product_${productId}`);
            const categoryOffer = offerMap.get(`category_${categoryId}`);
            
            // Choose the better offer
            let appliedOffer = null;
            if (productOffer && categoryOffer) {
                appliedOffer = productOffer.offerPercentage >= categoryOffer.offerPercentage ? 
                    productOffer : categoryOffer;
            } else {
                appliedOffer = productOffer || categoryOffer;
            }

            // Calculate final price
            let finalPrice = product.total_price;
            let discountAmount = 0;
            let discountPercentage = 0;

            if (appliedOffer) {
                discountAmount = (finalPrice * appliedOffer.offerPercentage) / 100;
                finalPrice -= discountAmount;
                discountPercentage = appliedOffer.offerPercentage;
            }

            // Round the final price
            finalPrice = Math.round(finalPrice * 100) / 100;

            // Update the product's discount_price in the database
            try {
                await Product.findByIdAndUpdate(
                    productId,
                    { discount_price: finalPrice },
                    { new: true }
                );
            } catch (error) {
                console.error(`Error updating discount_price for product ${productId}:`, error);
            }

            return {
                ...product,
                finalPrice,
                discount_price: finalPrice, // Add this to the returned object
                basePrice: product.total_price,
                discountAmount: Math.round(discountAmount * 100) / 100,
                discountPercentage,
                offer: appliedOffer ? {
                    name: appliedOffer.name,
                    type: appliedOffer.type,
                    percentage: appliedOffer.offerPercentage
                } : null,
                hasOffer: !!appliedOffer
            };
        }));

        // Store processed products back in request
        req.products = Array.isArray(req.products) ? processedProducts : processedProducts[0];
        next();
    } catch (error) {
        next(error);
    }
};

// Helper function to check if a product/category already has an offer
const checkExistingOffer = async (type, id) => {
    const currentDate = new Date();
    const existingOffer = await Offer.findOne({
        [type === 'Products' ? 'productId' : 'categoryId']: id,
        type,
        status: true,
        validFrom: { $lte: currentDate },
        validity: { $gte: currentDate }
    });
    
    return existingOffer !== null;
};



module.exports = {
    calculateProductPrices,
    checkExistingOffer
};