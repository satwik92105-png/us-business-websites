/**
 * Flat Track Coffee Roasters — Shared UI Components
 * Demo Controls, Cart Drawer, Toasts, Austin Time Badge & Receipt Generator
 */

(function (window) {
  // Global Toast Manager
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('global-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'global-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : '✨';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 20);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 320);
    }, duration);
  }

  // Live Austin CST/CDT Open/Closed Status
  function initAustinTimeBadge(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    function update() {
      // Calculate Austin Time (America/Chicago)
      const now = new Date();
      const austinString = now.toLocaleString("en-US", { timeZone: "America/Chicago" });
      const austinTime = new Date(austinString);
      const hours = austinTime.getHours();
      const minutes = austinTime.getMinutes();
      const timeDecimal = hours + minutes / 60;

      // Cafe Hours: 6:30 AM (6.5) to 6:00 PM (18.0)
      const isOpen = timeDecimal >= 6.5 && timeDecimal < 18.0;

      if (isOpen) {
        el.className = "status-indicator";
        el.innerHTML = `🟢 <b>Open Now</b> · Closes 6:00 PM CST`;
      } else {
        el.className = "status-indicator closed";
        el.innerHTML = `⚪ <b>Closed Now</b> · Opens 6:30 AM CST`;
      }
    }

    update();
    setInterval(update, 60000);
  }

  // Floating Demo Controls Pill
  function initDemoControls(config = {}) {
    const currentTier = config.tier || 'tier1';
    const isAdmin = config.isAdmin || false;

    // Detect root path adjustment
    const inSubdir = window.location.pathname.includes('/tier1/') || 
                     window.location.pathname.includes('/tier2/') || 
                     window.location.pathname.includes('/tier3/');
    const pfx = inSubdir ? '../' : './';

    const pillWrap = document.createElement('div');
    pillWrap.className = 'demo-pill-container';
    pillWrap.id = 'demo-pill-container';

    pillWrap.innerHTML = `
      <div class="demo-menu-dropdown" id="demo-menu-dropdown">
        <div class="demo-dropdown-header">
          <span>✨ Flat Track Showcase</span>
          <button id="hide-demo-pill-btn" style="color:var(--text-muted); font-size:0.75rem; cursor:pointer;" title="Hide Controls">[Hide]</button>
        </div>
        <a href="${pfx}index.html" class="demo-dropdown-item">
          📊 <b>Agency Sales Hub & Pitch</b>
        </a>
        <a href="${pfx}tier1/index.html" class="demo-dropdown-item ${currentTier === 'tier1' ? 'active' : ''}">
          ☕ <b>Tier 1:</b> Digital Storefront ($500)
        </a>
        <a href="${pfx}tier2/index.html" class="demo-dropdown-item ${currentTier === 'tier2' && !isAdmin ? 'active' : ''}">
          🛒 <b>Tier 2:</b> Operations Hub ($1,500)
        </a>
        <a href="${pfx}tier2/admin.html" class="demo-dropdown-item ${currentTier === 'tier2' && isAdmin ? 'active' : ''}">
          🔐 <b>Tier 2:</b> Owner POS Portal
        </a>
        <a href="${pfx}tier3/index.html" class="demo-dropdown-item ${currentTier === 'tier3' && !isAdmin ? 'active' : ''}">
          👑 <b>Tier 3:</b> Flagship Enterprise ($2,000)
        </a>
        <a href="${pfx}tier3/admin.html" class="demo-dropdown-item ${currentTier === 'tier3' && isAdmin ? 'active' : ''}">
          📈 <b>Tier 3:</b> Owner BI & KDS
        </a>
        <div style="border-top: 1px solid var(--border-subtle); margin: 0.25rem 0;"></div>
        <button class="demo-dropdown-item demo-action-btn" id="demo-sim-order-btn">
          ⚡ <b>Simulate Incoming Order</b>
        </button>
        <button class="demo-dropdown-item demo-action-btn" id="demo-reset-data-btn" style="color:#ef4444;">
          🔄 <b>Reset Demo Database</b>
        </button>
      </div>
      <button class="demo-pill-btn" id="demo-pill-toggle">
        <span>✨ Demo Controls</span>
      </button>
    `;

    document.body.appendChild(pillWrap);

    const toggleBtn = document.getElementById('demo-pill-toggle');
    const dropdown = document.getElementById('demo-menu-dropdown');
    const hideBtn = document.getElementById('hide-demo-pill-btn');
    const simOrderBtn = document.getElementById('demo-sim-order-btn');
    const resetDataBtn = document.getElementById('demo-reset-data-btn');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!pillWrap.contains(e.target)) {
        dropdown.classList.remove('is-open');
      }
    });

    hideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pillWrap.style.display = 'none';
      showToast("Demo controls hidden. Press Shift+D to restore.", "info", 4000);
    });

    window.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        pillWrap.style.display = pillWrap.style.display === 'none' ? 'block' : 'none';
      }
    });

    simOrderBtn.addEventListener('click', async () => {
      dropdown.classList.remove('is-open');
      if (window.FlatTrackAPI) {
        const simOrder = await window.FlatTrackAPI.createOrder({
          customerName: "Test Order Guest",
          phone: "(512) 555-0199",
          items: [
            { name: "Single-Origin Ethiopian Pour-Over", qty: 1, price: 6.50 },
            { name: "Artisan Butter Croissant", qty: 2, price: 4.50 }
          ],
          subtotal: 15.50,
          notes: "Extra napkins please"
        });
        showToast(`⚡ Order ${simOrder.id} simulated! Sent to Kitchen POS.`, "success");
      }
    });

    resetDataBtn.addEventListener('click', () => {
      if (confirm("Reset demo data to default clean state?")) {
        if (window.FlatTrackAPI) {
          window.FlatTrackAPI.resetDemoData();
          showToast("Demo data reset to factory state!", "success");
          setTimeout(() => window.location.reload(), 600);
        }
      }
    });
  }

  // Cart Drawer Manager (Tier 2 & Tier 3)
  const CartManager = {
    items: [],
    discountPercent: 0,
    promoCodeApplied: null,

    init() {
      this.loadCart();
      this.injectCartHTML();
      this.bindEvents();
      this.updateUI();
    },

    loadCart() {
      try {
        const raw = localStorage.getItem('flat_track_cart');
        this.items = raw ? JSON.parse(raw) : [];
      } catch (e) {
        this.items = [];
      }
    },

    saveCart() {
      localStorage.setItem('flat_track_cart', JSON.stringify(this.items));
      this.updateUI();
    },

    addItem(product, customizations = "") {
      const existing = this.items.find(i => i.id === product.id && i.customizations === customizations);
      if (existing) {
        existing.qty += 1;
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          customizations: customizations
        });
      }
      this.saveCart();
      showToast(`Added ${product.name} to cart 🛒`, "success", 2000);
      this.openDrawer();
    },

    updateQty(index, delta) {
      if (!this.items[index]) return;
      this.items[index].qty += delta;
      if (this.items[index].qty <= 0) {
        this.items.splice(index, 1);
      }
      this.saveCart();
    },

    clearCart() {
      this.items = [];
      this.discountPercent = 0;
      this.promoCodeApplied = null;
      this.saveCart();
    },

    injectCartHTML() {
      if (document.getElementById('cart-drawer-overlay')) return;

      const html = `
        <button class="floating-cart-trigger" id="floating-cart-trigger" aria-label="Open Cart">
          🛒
          <span class="cart-count-badge" id="floating-cart-count">0</span>
        </button>

        <div class="cart-drawer-overlay" id="cart-drawer-overlay"></div>
        <div class="cart-drawer" id="cart-drawer">
          <div class="cart-header">
            <h3><span>🛒</span> Your Order</h3>
            <button class="cart-close-btn" id="cart-close-btn">&times;</button>
          </div>
          
          <div class="cart-items-wrap" id="cart-items-wrap">
            <!-- Dynamic items -->
          </div>

          <div class="cart-footer">
            <div style="display:flex; gap:0.5rem; margin-bottom:0.4rem;">
              <input type="text" id="promo-code-input" placeholder="Promo code (e.g. DOGSPEED15)" class="form-input" style="padding:0.45rem 0.75rem; font-size:0.8rem; text-transform:uppercase;">
              <button class="btn btn-secondary btn-sm" id="apply-promo-btn">Apply</button>
            </div>
            <div id="promo-status-msg" style="font-size:0.75rem; color:var(--accent-gold); display:none;"></div>

            <div class="cart-summary-row">
              <span>Subtotal</span>
              <span class="mono-num" id="cart-subtotal">$0.00</span>
            </div>
            <div class="cart-summary-row" id="cart-discount-row" style="display:none; color:var(--status-success);">
              <span>Discount</span>
              <span class="mono-num" id="cart-discount">-$0.00</span>
            </div>
            <div class="cart-summary-row">
              <span>Estimated Tax (8.25%)</span>
              <span class="mono-num" id="cart-tax">$0.00</span>
            </div>
            <div class="cart-summary-row total-row">
              <span>Total</span>
              <span class="mono-num" id="cart-total" style="color:var(--accent-gold); font-size:1.3rem;">$0.00</span>
            </div>
            <button class="btn btn-primary btn-lg" id="checkout-drawer-btn" style="width:100%; margin-top:0.4rem;">
              Proceed to Pickup Details &rarr;
            </button>
          </div>
        </div>

        <!-- Checkout / Pickup Modal -->
        <div class="modal-overlay" id="checkout-modal-overlay">
          <div class="modal-card">
            <div class="modal-header">
              <h3><span>☕</span> Complete Pickup Order</h3>
              <button class="modal-close-btn" id="checkout-modal-close">&times;</button>
            </div>
            <div class="modal-body">
              <form id="checkout-form">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input type="text" id="cust-name" class="form-input" required placeholder="Your Full Name">
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number (for pickup SMS) *</label>
                  <input type="tel" id="cust-phone" class="form-input" required placeholder="(512) 555-0199">
                </div>
                <div class="form-group">
                  <label class="form-label">Special Barista Notes (Optional)</label>
                  <textarea id="cust-notes" class="form-textarea" rows="2" placeholder="Extra hot, oat milk on side, etc."></textarea>
                </div>
                <div style="background:var(--bg-surface); padding:1rem; border-radius:10px; margin-bottom:1.2rem; font-size:0.85rem; border:1px solid var(--border-subtle);">
                  <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                    <span>Pickup Location:</span>
                    <b>1611 E Cesar Chavez St, Austin, TX</b>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                    <span>Estimated Ready Time:</span>
                    <b style="color:var(--accent-gold);">10–12 Minutes</b>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span>Total Due at Pickup:</span>
                    <b class="mono-num" id="modal-checkout-total" style="color:var(--accent-gold);">$0.00</b>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="submit-order-btn">
                  Send Order to Kitchen &rarr;
                </button>
              </form>
            </div>
          </div>
        </div>
      `;

      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    },

    bindEvents() {
      const trigger = document.getElementById('floating-cart-trigger');
      const closeBtn = document.getElementById('cart-close-btn');
      const overlay = document.getElementById('cart-drawer-overlay');
      const checkoutBtn = document.getElementById('checkout-drawer-btn');
      const modalOverlay = document.getElementById('checkout-modal-overlay');
      const modalClose = document.getElementById('checkout-modal-close');
      const checkoutForm = document.getElementById('checkout-form');
      const promoBtn = document.getElementById('apply-promo-btn');

      trigger.addEventListener('click', () => this.openDrawer());
      closeBtn.addEventListener('click', () => this.closeDrawer());
      overlay.addEventListener('click', () => this.closeDrawer());

      checkoutBtn.addEventListener('click', () => {
        if (this.items.length === 0) {
          showToast("Your cart is empty! Add an item first.", "error");
          return;
        }
        this.closeDrawer();
        this.openCheckoutModal();
      });

      modalClose.addEventListener('click', () => this.closeCheckoutModal());
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) this.closeCheckoutModal();
      });

      promoBtn.addEventListener('click', async () => {
        const input = document.getElementById('promo-code-input');
        const msg = document.getElementById('promo-status-msg');
        const code = input.value.trim();
        if (!code) return;

        if (window.FlatTrackAPI) {
          const res = await window.FlatTrackAPI.applyPromoCode(code);
          if (res.valid) {
            this.discountPercent = res.discountPercent;
            this.promoCodeApplied = res.code;
            msg.style.display = 'block';
            msg.innerText = `✓ Promo ${res.code} applied (${res.discountPercent}% OFF)`;
            showToast(`Promo ${res.code} applied!`, "success");
            this.updateUI();
          } else {
            msg.style.display = 'block';
            msg.style.color = '#ef4444';
            msg.innerText = `⚠ Invalid promo code`;
          }
        }
      });

      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-order-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = "Transmitting to Roastery...";

        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const notes = document.getElementById('cust-notes').value.trim();

        const totals = this.calculateTotals();

        if (window.FlatTrackAPI) {
          const order = await window.FlatTrackAPI.createOrder({
            customerName: name,
            phone: phone,
            items: this.items,
            subtotal: totals.subtotal,
            notes: notes
          });

          this.clearCart();
          this.closeCheckoutModal();
          submitBtn.disabled = false;
          submitBtn.innerText = "Send Order to Kitchen →";

          showToast(`Order #${order.id} sent to kitchen! ☕`, "success", 4000);

          // Store last order ID for live tracking
          localStorage.setItem('flat_track_last_order_id', order.id);

          // Trigger Receipt Prompt
          if (confirm(`Order #${order.id} Confirmed!\n\nEstimated pickup: 10-12 mins at 1611 E Cesar Chavez St.\n\nWould you like to print or save your itemized PDF Tax Receipt?`)) {
            generatePdfReceipt(order);
          }

          // If on Tier 3, redirect or prompt to track
          if (window.location.pathname.includes('/tier3/')) {
            setTimeout(() => {
              window.location.href = 'track.html?id=' + order.id;
            }, 1200);
          }
        }
      });
    },

    openDrawer() {
      document.getElementById('cart-drawer-overlay').classList.add('is-open');
      document.getElementById('cart-drawer').classList.add('is-open');
      // Hide floating trigger while drawer is open to respect strict Z-Index rule
      document.getElementById('floating-cart-trigger').classList.add('is-hidden');
    },

    closeDrawer() {
      document.getElementById('cart-drawer-overlay').classList.remove('is-open');
      document.getElementById('cart-drawer').classList.remove('is-open');
      document.getElementById('floating-cart-trigger').classList.remove('is-hidden');
    },

    openCheckoutModal() {
      const totals = this.calculateTotals();
      document.getElementById('modal-checkout-total').innerText = `$${totals.total.toFixed(2)}`;
      document.getElementById('checkout-modal-overlay').classList.add('is-open');
      document.getElementById('floating-cart-trigger').classList.add('is-hidden');
    },

    closeCheckoutModal() {
      document.getElementById('checkout-modal-overlay').classList.remove('is-open');
      document.getElementById('floating-cart-trigger').classList.remove('is-hidden');
    },

    calculateTotals() {
      let rawSubtotal = this.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
      let discount = 0;
      if (this.discountPercent > 0) {
        discount = rawSubtotal * (this.discountPercent / 100);
      }
      const subtotal = Math.max(0, rawSubtotal - discount);
      // Strict 2-decimal rounded tax: Math.round(subtotal * 0.0825 * 100) / 100
      const tax = Math.round(subtotal * 0.0825 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      return { rawSubtotal, discount, subtotal, tax, total };
    },

    updateUI() {
      const count = this.items.reduce((acc, i) => acc + i.qty, 0);
      const badge = document.getElementById('floating-cart-count');
      if (badge) badge.innerText = count;

      const wrap = document.getElementById('cart-items-wrap');
      if (!wrap) return;

      if (this.items.length === 0) {
        wrap.innerHTML = `
          <div class="cart-empty-state">
            <div class="empty-icon">☕</div>
            <p><b>Your order is empty</b></p>
            <p style="font-size:0.85rem; margin-top:0.3rem;">Explore our specialty espresso, drip, and bakery items.</p>
          </div>
        `;
      } else {
        wrap.innerHTML = this.items.map((item, idx) => `
          <div class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-title">${item.name}</div>
              ${item.customizations ? `<div class="cart-item-customizations">${item.customizations}</div>` : ''}
              <div class="cart-item-price mono-num">$${(item.price * item.qty).toFixed(2)}</div>
            </div>
            <div class="cart-qty-ctrls">
              <button class="cart-qty-btn" onclick="CartManager.updateQty(${idx}, -1)">&minus;</button>
              <span class="cart-qty-val">${item.qty}</span>
              <button class="cart-qty-btn" onclick="CartManager.updateQty(${idx}, 1)">&plus;</button>
            </div>
          </div>
        `).join('');
      }

      const totals = this.calculateTotals();
      document.getElementById('cart-subtotal').innerText = `$${totals.rawSubtotal.toFixed(2)}`;
      
      const discountRow = document.getElementById('cart-discount-row');
      if (totals.discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('cart-discount').innerText = `-$${totals.discount.toFixed(2)}`;
      } else {
        discountRow.style.display = 'none';
      }

      document.getElementById('cart-tax').innerText = `$${totals.tax.toFixed(2)}`;
      document.getElementById('cart-total').innerText = `$${totals.total.toFixed(2)}`;
    }
  };

  // PDF Tax Receipt Generator
  function generatePdfReceipt(order) {
    const win = window.open('', '_blank');
    if (!win) {
      alert("Please allow popups to view and print your PDF receipt.");
      return;
    }

    const itemsRows = order.items.map(i => `
      <tr>
        <td style="padding:8px 0; border-bottom:1px solid #ddd;">${i.qty}x ${i.name} ${i.customizations ? `<br/><small style="color:#666;">${i.customizations}</small>` : ''}</td>
        <td style="padding:8px 0; border-bottom:1px solid #ddd; text-align:right; font-family:monospace;">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Flat Track Coffee — Tax Receipt #${order.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #222; max-width: 500px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #bbb; padding-bottom: 20px; margin-bottom: 20px; }
          h2 { margin: 0 0 5px 0; font-size: 20px; letter-spacing: 1px; }
          p { margin: 3px 0; font-size: 13px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .totals { border-top: 1px solid #222; padding-top: 10px; margin-top: 10px; }
          .totals-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #222; padding-top: 8px; margin-top: 8px; }
          .barcode { text-align: center; margin-top: 30px; font-family: monospace; letter-spacing: 4px; font-size: 22px; padding: 10px; background: #f4f4f4; }
          .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #777; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FLAT TRACK COFFEE ROASTERS</h2>
          <p>1611 E Cesar Chavez St, Austin, TX 78702</p>
          <p>Phone: (512) 540-6033 · Tax ID: 74-3298104-TX</p>
          <p style="margin-top:8px;"><b>Official Itemized Pickup Tax Receipt</b></p>
        </div>
        <div>
          <p><b>Order ID:</b> #${order.id}</p>
          <p><b>Customer:</b> ${order.customerName}</p>
          <p><b>Phone:</b> ${order.phone}</p>
          <p><b>Placed At:</b> ${new Date(order.orderTime || Date.now()).toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; text-align:left;">
              <th style="padding-bottom:5px;">Item</th>
              <th style="padding-bottom:5px; text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span style="font-family:monospace;">$${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Texas State & Local Sales Tax (8.25%):</span>
            <span style="font-family:monospace;">$${order.tax.toFixed(2)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Paid (USD):</span>
            <span style="font-family:monospace;">$${order.total.toFixed(2)}</span>
          </div>
        </div>
        <div class="barcode">
          *${order.id}*
        </div>
        <div class="footer">
          <p>Thank you for supporting East Austin micro-batch roasting!</p>
          <p>Present this ticket at the counter for express pickup.</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  }

  // Scroll Animation Observer (Tier 3)
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  // Exports
  window.showToast = showToast;
  window.initAustinTimeBadge = initAustinTimeBadge;
  window.initDemoControls = initDemoControls;
  window.CartManager = CartManager;
  window.generatePdfReceipt = generatePdfReceipt;
  window.initScrollAnimations = initScrollAnimations;
})(window);
