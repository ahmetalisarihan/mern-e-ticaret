const Product = require('../models/product');

const allProducts = async (req, res) => {
    const products = await Product.find({});

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
const createProduct = async (req, res) => {
    const product = await Product.create(req.body);

    res.status(201).json({ product });
}

const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    product.remove();
    res.status(200).json({ 
        message: 'Product deleted successfully'
     });
}
const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    prodduct = await Product.findByIdAndUpdate(req.params.id, req.body, {new: true})
    res.status(200).json({ 
        product
     });
}

module.exports = { allProducts, detailProducts, createProduct, deleteProduct, updateProduct};