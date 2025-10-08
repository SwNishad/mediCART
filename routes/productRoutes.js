// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Add a new product (POST)
router.post('/add', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      stock,
    });

    await newProduct.save();
    res.status(201).json({ message: '✅ Product added successfully!', product: newProduct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to add product' });
  }
});

// Get all products (GET)
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to fetch products' });
  }
});

module.exports = router;
