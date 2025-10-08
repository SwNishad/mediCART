// app.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();
const app = express();

// ✅ Static folder
const publicDir = path.resolve(__dirname, "public");
app.use("/static", express.static(publicDir));
console.log("✅ Serving static from:", publicDir);

// ✅ View engine
app.set("view engine", "ejs");

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Session setup
app.use(
  session({
    secret: "mediCART_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// ✅ Make session available to all EJS files
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Import routes
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes"); // contains checkout + invoice
const adminRoutes = require("./routes/adminRoutes");

// ✅ Attach routes (MUST come before your page routes)
app.use("/api/products", productRoutes);
app.use("/", orderRoutes);
app.use("/", adminRoutes);

// ✅ Import Product model for homepage
const Product = require("./models/Product");

// ✅ Home Page
app.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("home", { products });
  } catch (err) {
    console.error("Error loading home:", err);
    res.status(500).send("Error loading products");
  }
});

// ✅ Shop Page
app.get("/shop", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("shop", { products });
  } catch (err) {
    console.error("Error loading shop:", err);
    res.status(500).send("Error loading shop");
  }
});

// ✅ Cart Page
app.get("/cart", (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  res.render("cart", { cart, total });
});

// ✅ Add to Cart
app.post("/cart/add", async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    const Product = require("./models/Product");
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false });

    if (!req.session.cart) req.session.cart = [];
    req.session.cart.push({
      _id: product._id,
      name: product.name,
      price: product.price * Number(quantity),
      quantity: Number(quantity),
      imageUrl: product.imageUrl,
    });

    console.log("🛒 Cart Updated:", req.session.cart);
    res.json({ success: true, cartCount: req.session.cart.length });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ success: false });
  }
});

// ✅ Remove from Cart
app.post("/cart/remove", (req, res) => {
  const { index } = req.body;
  if (req.session.cart && req.session.cart.length > index) {
    req.session.cart.splice(index, 1);
  }
  res.redirect("/cart");
});

// ✅ Test static
app.get("/test-static", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "css", "home.css"));
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MediCART server running on port ${PORT}`);
});
