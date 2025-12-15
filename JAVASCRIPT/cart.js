// ===============================
//  SIMPLE FRONT-END CART (LOCALSTORAGE)
// ===============================

// 1) PRODUCT CATALOG
//    The keys here must match what you pass to addToCart('phone') etc.
const PRODUCTS = {
  phone: {
    id: "phone",
    name: "Callous Phone",
    price: 925,
  },
  laptop: {
    id: "laptop",
    name: "Callous Book",
    price: 1200,
  },
  router: {
    id: "router",
    name: "Callous Router",
    price: 525,
  },
  accessories: {
    id: "accessories",
    name: "Accessories Pack",
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

// 4) CART COUNT HELPERS (for navbar badge)
function getCartCount() {
  const cart = loadCart();
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (!countEl) return; // no badge on this page
  const count = getCartCount();
  countEl.textContent = count;
}

// 5) ADD TO CART (used by buttons on product / detail pages)
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

  updateCartCount(); // update navbar badge

  alert(`${product.name} added to cart`);
}

// 6) RENDER CART PAGE CONTENT
function renderCartPage() {
  const itemsContainer = document.getElementById("cart-items");
  const totalSpan = document.getElementById("cart-total-amount");
  const emptyBlock = document.getElementById("cart-empty");
  const filledBlock = document.getElementById("cart-filled");

  // If any of these don't exist, this isn't cart.html → just update badge and leave
  if (!itemsContainer || !totalSpan || !emptyBlock || !filledBlock) {
    updateCartCount();
    return;
  }

  const cart = loadCart();
  const productIds = Object.keys(cart);

  if (productIds.length === 0) {
    // cart empty
    emptyBlock.style.display = "block";
    filledBlock.style.display = "none";
    totalSpan.textContent = "0";
    updateCartCount();
    return;
  }

  // cart has items
  emptyBlock.style.display = "none";
  filledBlock.style.display = "grid"; // or block if you prefer

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
          <span>Price: ${item.price}</span>
          <span>
            Qty:
            <button class="qty-btn" data-id="${id}" data-action="dec">-</button>
            <span class="qty">${item.qty}</span>
            <button class="qty-btn" data-id="${id}" data-action="inc">+</button>
          </span>
        </div>
      </div>
      <div class="cart-item-total">
        ${lineTotal}
      </div>
    `;
    itemsContainer.appendChild(row);
  });

  totalSpan.textContent = total.toString();
  updateCartCount(); // keep badge in sync

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

// 7) UPDATE QUANTITY
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

// 8) INIT ON PAGE LOAD
document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();   // renders cart if on cart.html, otherwise just updates badge
});
