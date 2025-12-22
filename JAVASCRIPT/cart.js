// ===============================
// Callous Solutions — Front-end Cart (LocalStorage)
// Upgrades:
// 1) Pay button UX: "Total copied ✓"
// 2) Reference/Order ID: CS-XXXXXX shown on cart page + modal
// 3) Instructions step: modal before opening NOWPayments
// ===============================

// Put your real NOWPayments payment link here:
const NOWPAYMENTS_LINK = "https://nowpayments.io/payment/?iid=YOUR_PAYMENT_LINK";

// Storage keys
const CART_KEY = "callous_cart";
const ORDER_KEY = "callous_last_order";

// Product catalogue (IDs MUST match addToCart('id'))
const PRODUCTS = {
  phone: { id: "phone", name: "Callous Phone", price: 925 },
  laptop: { id: "laptop", name: "Callous Book", price: 1200 },
  router: { id: "router", name: "Callous Router", price: 525 },
  accessories: { id: "accessories", name: "Accessories", price: 99 },
};

// ---------- Helpers ----------
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Cart parse failed:", e);
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatMoney(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function getCartCount(cartObj) {
  const cart = cartObj || loadCart();
  return Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
}

function getCartTotal(cartObj) {
  const cart = cartObj || loadCart();
  return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartCount() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  el.textContent = String(getCartCount());
}

// ---------- Add to cart ----------
function addToCart(productId) {
  const product = PRODUCTS[productId];
  if (!product) {
    console.warn("Unknown product id:", productId);
    alert("Sorry — that product cannot be added right now.");
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

  updateCartCount();
  renderCartPage();

  alert(`${product.name} added to cart`);
}

window.addToCart = addToCart;

// ---------- Quantity updates ----------
function updateQuantity(productId, delta) {
  const cart = loadCart();
  if (!cart[productId]) return;

  cart[productId].qty += delta;

  if (cart[productId].qty <= 0) {
    delete cart[productId];
  }

  saveCart(cart);
  updateCartCount();
}

// ---------- Render cart page ----------
function renderCartPage() {
  const emptyBlock = document.getElementById("cart-empty");
  const filledBlock = document.getElementById("cart-filled");
  const itemsContainer = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total-amount");

  // Not on cart page — just sync badge
  if (!emptyBlock || !filledBlock || !itemsContainer || !totalEl) {
    updateCartCount();
    return;
  }

  const cart = loadCart();
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    emptyBlock.style.display = "block";
    filledBlock.style.display = "none";
    totalEl.textContent = "0";
    updateCartCount();
    return;
  }

  emptyBlock.style.display = "none";
  filledBlock.style.display = "grid";
  itemsContainer.innerHTML = "";

  ids.forEach((id) => {
    const item = cart[id];
    const lineTotal = item.price * item.qty;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item-left">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta muted">
          <span>Unit: ${formatMoney(item.price)} USDT</span>
          <span class="cart-qty">
            Qty:
            <button class="qty-btn" data-id="${id}" data-action="dec" aria-label="Decrease quantity">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-id="${id}" data-action="inc" aria-label="Increase quantity">+</button>
          </span>
        </div>
      </div>

      <div class="cart-item-right">
        <div class="cart-item-total">${formatMoney(lineTotal)} USDT</div>
        <button class="remove-btn" data-id="${id}">Remove</button>
      </div>
    `;

    itemsContainer.appendChild(row);
  });

  const total = getCartTotal(cart);
  totalEl.textContent = String(formatMoney(total));
  updateCartCount();

  // Qty listeners (stop propagation so they never trigger checkout)
  itemsContainer.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = e.currentTarget.getAttribute("data-id");
      const action = e.currentTarget.getAttribute("data-action");
      updateQuantity(id, action === "inc" ? 1 : -1);
      renderCartPage();
    });
  });

  // Remove listeners (stop propagation so they never trigger checkout)
  itemsContainer.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const id = e.currentTarget.getAttribute("data-id");
      const cartNow = loadCart();
      delete cartNow[id];
      saveCart(cartNow);
      updateCartCount();
      renderCartPage();
    });
  });
}

// ---------- Upgrades: Reference + Instructions Modal ----------
function makeRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "CS-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function cartToSummaryText(cart) {
  const lines = [];
  Object.values(cart).forEach((item) => {
    lines.push(`${item.qty} × ${item.name} — ${formatMoney(item.price * item.qty)} USDT`);
  });
  return lines.join("\n");
}

function ensurePaymentModal() {
  let modal = document.getElementById("payment-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "payment-modal";
  modal.innerHTML = `
    <div class="checkout-overlay" data-close="1"></div>

    <div class="checkout-modal" role="dialog" aria-modal="true" aria-label="Pay with Crypto">
      <div class="checkout-head">
        <div>
          <div class="checkout-title">Pay with Crypto</div>
          <div class="checkout-sub">We’ll open NOWPayments in a new tab.</div>
        </div>
        <button class="checkout-x" data-close="1" aria-label="Close">✕</button>
      </div>

      <div class="checkout-body">
        <div class="checkout-block">
          <div class="checkout-label">Step 1 — Order summary</div>
          <pre class="checkout-summary" id="pay-summary"></pre>
        </div>

        <div class="checkout-block">
          <div class="checkout-label">Step 2 — Total to pay</div>
          <div class="checkout-total">
            <span class="checkout-total-num" id="pay-total"></span>
            <span class="checkout-total-unit">USDT</span>
          </div>
          <div class="checkout-hint">
            We’ll copy this total to your clipboard so you can paste it into NOWPayments if prompted.
          </div>
        </div>

        <div class="checkout-block">
          <div class="checkout-label">Step 3 — Reference</div>
          <div class="checkout-hint">Use this reference in notes/description if available.</div>
          <div style="margin-top:10px; font-weight:800;" id="pay-ref"></div>
        </div>
      </div>

      <div class="checkout-actions">
        <button class="btn" data-close="1">Cancel</button>
        <button class="btn black" id="pay-continue">Copy total &amp; Continue</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute("data-close") === "1") modal.remove();
  });

  document.addEventListener("keydown", (e) => {
    const m = document.getElementById("payment-modal");
    if (m && e.key === "Escape") m.remove();
  });

  return modal;
}

function setupCheckoutButton() {
  const btn = document.getElementById("checkout-btn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cart = loadCart();
    if (!cart || Object.keys(cart).length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const total = getCartTotal(cart);
    const ref = makeRef();
    const summary = cartToSummaryText(cart);

    // Save locally (frontend record)
    localStorage.setItem(
      ORDER_KEY,
      JSON.stringify({ createdAt: new Date().toISOString(), ref, total, items: cart })
    );

    // Show reference line on page
    const refLine = document.getElementById("payment-ref");
    if (refLine) refLine.textContent = `Reference: ${ref}`;

    // Show modal instructions
    const modal = ensurePaymentModal();
    modal.querySelector("#pay-summary").textContent = summary;
    modal.querySelector("#pay-total").textContent = formatMoney(total);
    modal.querySelector("#pay-ref").textContent = ref;

    // Continue
    const goBtn = modal.querySelector("#pay-continue");
    goBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(String(total));
      } catch (_) {}

      // Pay button UX
      const original = btn.textContent.trim();
      btn.textContent = "Total copied ✓";
      btn.classList.add("btn-copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("btn-copied");
      }, 1700);

      window.open(NOWPAYMENTS_LINK, "_blank", "noopener");
      modal.remove();
    };
  });
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCartPage();
  setupCheckoutButton();
});
