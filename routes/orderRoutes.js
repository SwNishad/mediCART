// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// ✅ Admin middleware
function isAdmin(req, res, next) {
  if (req.session && req.session.admin === "TASFIA") {
    next();
  } else {
    res.redirect("/admin/login");
  }
}

// ✅ Checkout page (uses session cart)
router.get("/checkout", (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  res.render("checkout", { cart, total, session: req.session });
});

// ✅ Handle checkout and generate PDF
router.post("/checkout", async (req, res) => {
  try {
    const { name, address, phone, paymentMethod } = req.body;
    const cart = req.session.cart || [];

    if (cart.length === 0) return res.redirect("/cart");

    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

    // ✅ Create and save order
    const newOrder = new Order({
      items: cart.map((c) => ({
        product: c._id,
        quantity: c.quantity,
      })),
      totalPrice,
      address,
      paymentStatus:
        paymentMethod === "COD"
          ? "Pending (Cash on Delivery)"
          : "Pending (Online)",
    });

    await newOrder.save();

    // ✅ Ensure invoices folder exists
    const invoicesDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

    // ✅ Load a Unicode font (must exist in your project)
    const fontPath = path.join(__dirname, "../public/fonts/NotoSans-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      console.warn("⚠️ Unicode font not found, using default PDFKit font.");
    }

    const invoicePath = path.join(invoicesDir, `invoice-${newOrder._id}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(invoicePath);
    doc.pipe(stream);

    // ✅ Use Unicode-compatible font
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    }

    // ✅ Header
    doc.fontSize(22).text("🧾 MediCART Invoice", { align: "center" });
    doc.moveDown(1.5);

    // ✅ Order details
    doc.fontSize(13);
    doc.text(`Order ID: ${newOrder._id}`);
    doc.text(`Customer: ${name}`);
    doc.text(`Address: ${address}`);
    doc.text(`Phone: ${phone}`);
    doc.moveDown();

    // ✅ Order Summary
    doc.fontSize(16).text("Order Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);

    cart.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.name} — ${item.quantity} x ৳${(
          item.price / item.quantity
        ).toFixed(2)} = ৳${item.price.toFixed(2)}`
      );
    });

    doc.moveDown(1);
    doc.fontSize(14).text(`Total: ৳${totalPrice}`, { align: "right" });
    doc.moveDown(0.5);
    doc.fontSize(13).text(
      `Payment Method: ${
        paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"
      }`
    );
    doc.text(`Status: ${newOrder.paymentStatus}`);
    doc.moveDown(1.5);
    doc.text("Thank you for shopping with MediCART!", { align: "center" });
    doc.end();

    // ✅ Wait until PDF is ready, then show Thank You page
    stream.on("finish", () => {
      req.session.cart = []; // clear cart after checkout
      res.render("thankyou", {
        name,
        total: totalPrice,
        paymentMethod,
        address,
        phone,
        invoiceId: newOrder._id,
      });
    });
  } catch (err) {
    console.error("❌ Error during checkout:", err);
    res.status(500).send("Error during checkout");
  }
});

// ✅ Serve generated invoice PDF
router.get("/invoice/:id", (req, res) => {
  const invoiceFile = `invoice-${req.params.id}.pdf`;
  const invoicePath = path.join(__dirname, "../invoices", invoiceFile);

  if (fs.existsSync(invoicePath)) {
    res.download(invoicePath, `MediCART-Invoice-${req.params.id}.pdf`);
  } else {
    setTimeout(() => {
      if (fs.existsSync(invoicePath)) {
        res.download(invoicePath, `MediCART-Invoice-${req.params.id}.pdf`);
      } else {
        res.status(404).send("Invoice not found or not ready yet.");
      }
    }, 1000);
  }
});

// ✅ Admin: View all orders
router.get("/admin/orders", isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.product");
    res.render("adminOrders", { orders });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).send("Error loading orders");
  }
});

// ✅ Mark Delivered
router.post("/admin/orders/:id/delivered", isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");
    order.paymentStatus = "Delivered ✅";
    await order.save();
    res.redirect("/admin/orders");
  } catch (err) {
    console.error("❌ Error marking delivered:", err);
    res.status(500).send("Error updating order");
  }
});

// ✅ Mark Paid
router.post("/admin/orders/:id/paid", isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Order not found");
    order.paymentStatus = "Paid 💰";
    await order.save();
    res.redirect("/admin/orders");
  } catch (err) {
    console.error("❌ Error marking paid:", err);
    res.status(500).send("Error updating order");
  }
});

module.exports = router;
