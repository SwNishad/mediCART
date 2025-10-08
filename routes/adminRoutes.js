// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Hardcoded Admin Credentials
const ADMIN_USERNAME = 'TASFIA';
const ADMIN_PASSWORD = '2010445';

// Admin session check middleware
function isAdmin(req, res, next) {
  if (req.session && req.session.admin === 'TASFIA') {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Show login page
router.get('/admin/login', (req, res) => {
  res.render('adminLogin', { error: null });
});

// Handle login form submission
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.admin = username;
    res.redirect('/admin/dashboard');
  } else {
    res.render('adminLogin', { error: '❌ Invalid username or password' });
  }
});

// ✅ Admin Dashboard — view all products & add form
router.get('/admin/dashboard', isAdmin, async (req, res) => {
  const products = await Product.find();
  res.render('adminDashboard', { admin: req.session.admin, products });
});

// ✅ Handle adding product from dashboard
router.post('/admin/add-product', isAdmin, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      stock
    });
    await newProduct.save();
    console.log('✅ Product added by admin:', name);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('❌ Error adding product:', err);
    res.status(500).send('Error adding product');
  }
});

// Logout
router.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
