// ===============================
//  SIMPLE FRONT-END CART (LOCALSTORAGE)
//  Used on: index.html, phone.html, laptop.html, router.html, accessories.html, cart.html
// ===============================

// 1) PRODUCT CATALOG
//    The keys (phone, laptop, router, accessories) MUST match the IDs you pass
//    into addToCart('phone') etc.
const PRODUCTS = {
    phone: {
      id: "phone",
      name: "Callous phone",
      price: 899, // in USDT or equivalent
    },
    laptop: {
      id: "laptop",
      name: "CallousBook",
      price: 1499,
    },
    router: {
      id: "router",
      name: "Callous Router",
      price: 499,
    },
    accessories: {
      id: "accessories",
      name: "Callous Accessories Pack",
      price: 99,
    },
  };
  
  // 2) LOCALSTORAGE KEY
  const CART_KEY = "callous_cart";
  
  // 3) LOAD / SAVE HELPERS
  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Failed to parse cart:", e);
      return {};
    }
  }
  
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  
  // 4) ADD TO CART (used by your buttons)
  // Example usage in HTML: <button onclick="addToCart('phone')">Add to cart</button>
  function addToCart(productId) {
    const product = PRODUCTS[productId];
    if (!product) {
      console.warn("Unknown product:", productId);
      return;
    }
  
    const cart = loadCart();
  
    if (!cart[productId]) {
      cart[productId] = {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 0,
      };
    }
  
    cart[productId].qty += 1;
    saveCart(cart);
  
    alert(`${product.name} added to cart`);
  }
  
  // 5) RENDER CART PAGE CONTENT
  // Called automatically on pages that contain the cart elements
  function renderCartPage() {
    const itemsContainer = document.getElementById("cart-items");
    const totalSpan = document.getElementById("cart-total-amount");
    const emptyBlock = document.getElementById("cart-empty");
    const filledBlock = document.getElementById("cart-filled");
  
    // If these elements don't exist, we are not on cart.html → do nothing
    if (!itemsContainer || !totalSpan || !emptyBlock || !filledBlock) {
      return;
    }
  
    const cart = loadCart();
    const productIds = Object.keys(cart);
  
    if (productIds.length === 0) {
      // cart empty
      emptyBlock.style.display = "block";
      filledBlock.style.display = "none";
      return;
    }
  
    // cart has items
    emptyBlock.style.display = "none";
    filledBlock.style.display = "grid";
  
    itemsContainer.innerHTML = "";
    let total = 0;
  
    productIds.forEach((id) => {
      const item = cart[id];
      const lineTotal = item.price * item.qty;
      total += lineTotal;
  
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-main">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">
            <span>Price: ${item.price} USDT</span>
            <span>
              Qty:
              <button class="qty-btn" data-id="${id}" data-action="dec">-</button>
              <span class="qty">${item.qty}</span>
              <button class="qty-btn" data-id="${id}" data-action="inc">+</button>
            </span>
          </div>
        </div>
        <div class="cart-item-total">
          ${lineTotal} USDT
        </div>
      `;
      itemsContainer.appendChild(row);
    });
  
    totalSpan.textContent = total.toString();
  
    // Quantity button listeners
    itemsContainer.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const action = e.target.getAttribute("data-action");
        updateQuantity(id, action === "inc" ? 1 : -1);
        renderCartPage(); // re-render after update
      });
    });
  }
  
  // 6) UPDATE QUANTITY
  function updateQuantity(productId, delta) {
    const cart = loadCart();
    const item = cart[productId];
    if (!item) return;
  
    item.qty += delta;
  
    if (item.qty <= 0) {
      delete cart[productId];
    }
  
    saveCart(cart);
  }
  
  // 7) CHECKOUT USING A SINGLE NOWPAYMENTS PAYMENT LINK (Option B)
  
  // ⚠️ REPLACE THIS with your actual NOWPayments payment link
  const NOWPAYMENTS_LINK = "https://nowpayments.io/payment/?iid=YOUR_PAYMENT_LINK";
  
  function setupCheckoutButton() {
    const btn = document.getElementById("checkout-btn");
    if (!btn) return; // not on cart page
  
    btn.addEventListener("click", () => {
      const cart = loadCart();
      const ids = Object.keys(cart);
  
      if (ids.length === 0) {
        alert("Your cart is empty.");
        return;
      }
  
      const totalSpan = document.getElementById("cart-total-amount");
      const total = totalSpan ? totalSpan.textContent : "?";
  
      const confirmMsg =
        `Your current cart total is ${total} USDT.\n\n` +
        `You will be redirected to our crypto payment page.\n` +
        `Please enter this total amount there when paying.\n\n` +
        `Continue to payment?`;
  
      if (confirm(confirmMsg)) {
        window.open(NOWPAYMENTS_LINK, "_blank", "noopener");
      }
    });
  }
  
  // 8) INIT ON PAGE LOAD
  document.addEventListener("DOMContentLoaded", () => {
    renderCartPage();
    setupCheckoutButton();
  });
  
  
  