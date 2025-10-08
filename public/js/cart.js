document.addEventListener("DOMContentLoaded", () => {
  const addButtons = document.querySelectorAll(".add-to-cart");
  const cartCount = document.getElementById("cart-count");

  addButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productId = btn.getAttribute("data-id");
      const qtyInput = btn.closest(".product-card").querySelector(".qty-input");
      const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

      try {
        const res = await fetch("/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity })
        });

        const data = await res.json();
        if (data.success) {
          alert("✅ Product added to cart!");
          if (cartCount) cartCount.textContent = data.cartCount;
        } else {
          alert("⚠️ Could not add product");
        }
      } catch (err) {
        console.error("Error adding product:", err);
      }
    });
  });
});
