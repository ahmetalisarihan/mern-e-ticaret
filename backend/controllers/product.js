const Product = require('../models/product');
const ProductFilter = require('../utils/productFilter');
const cloudinary = require('cloudinary').v2;

const allProducts = async (req, res) => {
    const resultPerPage = 10;
    const productFilter = new ProductFilter(Product.find(), req.query).search().filter().pagination(resultPerPage);
    const products = await productFilter.query;

    res.status(200).json({ products });
}

const adminProducts = async (req, res, next) => {
    const products = await Product.find();

    res.status(200).json({ products });
}

const detailProducts = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ product });
}
//Admin
const createProduct = async (req, res, next) => {
    let images = [];
    if (typeof req.body.images==='string') {
        images.push(req.body.images);
       
    }else{
        images = req.body.images;
    }

    let allImages = [];
    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.uploader.upload(images[i], {
            folder: 'products'
        });
        allImages.push({
            public_id: result.public_id,
            url: result.secure_url
        });
    }
    req.body.images = allImages;
    req.body.user = req.user._id;

    const product = await Product.create(req.body);

    res.status(201).json({ product });
}

const deleteProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.uploader.destroy(product.images[i].public_id);
    }

    await product.remove();
    res.status(200).json({ 
        message: 'Product deleted successfully'
     });
}
const updateProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    let images = [];
    if (typeof req.body.images==='string') {
        images.push(req.body.images);
       
    }else{
        images = req.body.images;
    }

    if(images !== undefined){
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.uploader.destroy(product.images[i].public_id);
        }
    }

    let allImages = [];
    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.uploader.upload(images[i], {
            folder: 'products'
        });
        allImages.push({
            public_id: result.public_id,
            url: result.secure_url
        });
    }
    req.body.images = allImages;

    prodduct = await Product.findByIdAndUpdate(req.params.id, req.body, {new: true , runValidators: true})
    res.status(200).json({ 
        product
     });
}

const createReview = async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
        r => r.name === review.name
    );

    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.name === isReviewed.name) {
                review.comment = comment;
                review.rating = rating;
            }
        });
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'Review added' });
}

module.exports = { allProducts, detailProducts, createProduct, deleteProduct, updateProduct, createReview, adminProducts};