/**
 * Flat Track Coffee Roasters — Shared UI Components
 * Demo Controls, Cart Drawer, Toasts, Austin Time Badge & Receipt Generator
 */

(function (window) {
  // Defensive Safeguard: Suppress all native browser alert/confirm banners in favor of toast / in-modal
  window.alert = function(msg) {
    if (window.showToast) {
      window.showToast(String(msg), 'info', 4500);
    } else {
      console.log('[Notice]:', msg);
    }
  };
  window.confirm = function(msg) {
    console.log('[Confirm suppressed]:', msg);
    return false;
  };

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

  // Floating Demo Controls Pill - PURGED from customer cafe pages
  function initDemoControls(config = {}) {
    // All cafe pages (tier1, tier2, tier3) must look 100% like a real roastery website
    // Zero demo pills or admin shortcuts on customer-facing pages.
    // All agency links, pricing, and portals remain strictly on index.html.
    return;
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
        <div class="cart-drawer" id="cart-drawer" data-lenis-prevent>
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
          <div class="modal-card" data-lenis-prevent>
            <div class="modal-header">
              <h3 id="modal-checkout-heading"><span>☕</span> Complete Pickup Order</h3>
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
                <div class="form-group" id="tier3-email-group" style="display:none;">
                  <label class="form-label">Email Address (for instant receipt & QR pickup pass) *</label>
                  <input type="email" id="cust-email" class="form-input" placeholder="you@domain.com">
                </div>
                <div class="form-group">
                  <label class="form-label">Special Barista Notes (Optional)</label>
                  <textarea id="cust-notes" class="form-textarea" rows="2" placeholder="Extra hot, oat milk on side, etc."></textarea>
                </div>

                <!-- Stripe Online Prepaid Section (Tier 3 Exclusive) -->
                <div id="tier3-payment-section" style="display:none; margin-bottom:1.2rem; padding:1rem; border-radius:12px; background:rgba(201,168,76,0.07); border:1px solid rgba(201,168,76,0.3);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                    <span style="font-weight:600; font-size:0.88rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                      <span>💳</span> Stripe Instant Prepaid Checkout
                    </span>
                    <span style="font-size:0.75rem; background:rgba(16,185,129,0.15); color:#10b981; padding:2px 8px; border-radius:12px; font-weight:600;">🔒 256-Bit Encrypted</span>
                  </div>
                  <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.8rem; line-height:1.4;">
                    Prepaid online express orders bypass the register line and go straight to the barista queue. Zero raw card numbers stored.
                  </p>
                  <div style="background:var(--bg-surface, #1e1a17); padding:0.8rem 1rem; border-radius:8px; border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:0.4rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.88rem;">
                      <span style="font-size:1.1rem;">💳</span>
                      <span style="font-family:var(--font-mono, monospace); letter-spacing:1px; color:var(--text-primary);">•••• •••• •••• 4242</span>
                      <span style="margin-left:auto; font-size:0.72rem; color:var(--accent-gold); font-weight:600; background:rgba(201,168,76,0.15); padding:2px 6px; border-radius:4px;">TEST READY</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted, #888);">
                      <span>Expires 12/28</span>
                      <span>CVC •••</span>
                      <span>Zero fee direct checkout</span>
                    </div>
                  </div>
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
                  <div style="display:flex; justify-content:space-between;" id="modal-checkout-total-row">
                    <span id="modal-payment-mode-label">Total Due at Pickup:</span>
                    <b class="mono-num" id="modal-checkout-total" style="color:var(--accent-gold);">$0.00</b>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="submit-order-btn">
                  Send Order to Kitchen &rarr;
                </button>
              </form>

              <!-- In-Modal Order Confirmation (Replaces ugly browser confirm/alert banners) -->
              <div id="checkout-success-view" style="display:none; text-align:center; padding:1.25rem 0.5rem;">
                <div style="font-size:3rem; margin-bottom:0.75rem;">🎉</div>
                <h3 id="success-order-title" style="font-size:1.35rem; color:var(--text-primary); margin-bottom:0.4rem;">Order Confirmed!</h3>
                <p id="success-order-msg" style="color:var(--text-secondary); font-size:0.92rem; margin-bottom:1.25rem; line-height:1.5;">
                  Estimated pickup: <b>10–12 minutes</b> at 1611 E Cesar Chavez St.<br/>
                  <span id="success-order-payment" style="color:var(--accent-gold); font-weight:600;">Total Due at Counter: $0.00</span>
                </p>
                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                  <button type="button" class="btn btn-primary" id="btn-print-order-receipt" style="width:100%; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                    🖨️ View &amp; Print PDF Tax Receipt
                  </button>
                  <button type="button" class="btn btn-secondary" id="btn-close-order-success" style="width:100%;">
                    Done
                  </button>
                </div>
              </div>
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

        const isTier3 = window.location.pathname.includes('/tier3/');
        submitBtn.innerText = isTier3 ? "Processing 256-Bit Stripe Payment..." : "Transmitting to Roastery...";

        const name = document.getElementById('cust-name').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const emailInput = document.getElementById('cust-email');
        const email = emailInput ? emailInput.value.trim() : '';
        const notes = document.getElementById('cust-notes').value.trim();

        const totals = this.calculateTotals();

        if (window.FlatTrackAPI) {
          const order = await window.FlatTrackAPI.createOrder({
            customerName: name,
            phone: phone,
            email: email,
            items: this.items,
            subtotal: totals.subtotal,
            notes: notes,
            paidOnline: isTier3
          });

          // Automatic background email dispatch if email provided
          if (email && window.FlatTrackAPI.sendConfirmationEmail) {
            window.FlatTrackAPI.sendConfirmationEmail(email, `Pickup Order Confirmed · #${order.id} (Flat Track Coffee Roasters)`, {
              "Order Number": `#${order.id}`,
              "Customer Name": name,
              "Payment Status": isTier3 ? "PAID ONLINE (Stripe)" : "PAY AT COUNTER (Due at Pickup)",
              "Items Ordered": (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', '),
              "Subtotal": `$${totals.subtotal.toFixed(2)}`,
              "Tax (8.25%)": `$${totals.tax.toFixed(2)}`,
              "Total Amount": `$${totals.total.toFixed(2)}`,
              "Estimated Ready Time": "10–12 Minutes",
              "Pickup Location": "1611 E Cesar Chavez St, Austin, TX 78702"
            });
          }

          this.clearCart();
          submitBtn.disabled = false;
          submitBtn.innerText = isTier3 ? "🔒 Pay & Send to Barista →" : "Send Order to Kitchen →";

          showToast(isTier3 ? `Payment Successful! Order #${order.id} paid online. ☕` : `Order #${order.id} sent to kitchen! ☕`, "success", 4000);

          // Store last order ID for live tracking
          localStorage.setItem('flat_track_last_order_id', order.id);

          // Tier 3 generates instant receipt with QR pass & routes to tracker
          if (isTier3) {
            this.closeCheckoutModal();
            generatePdfReceipt(order);
            setTimeout(() => {
              window.location.href = 'track.html?id=' + order.id;
            }, 1200);
          } else {
            // Tier 2: Switch modal to in-app confirmation view (ZERO native browser confirm/alert banners!)
            const formEl = document.getElementById('checkout-form');
            const successEl = document.getElementById('checkout-success-view');
            const heading = document.getElementById('modal-checkout-heading');
            if (heading) heading.innerHTML = '<span>✓</span> Order Confirmed!';
            if (formEl) formEl.style.display = 'none';
            if (successEl) {
              const titleEl = document.getElementById('success-order-title');
              const payEl = document.getElementById('success-order-payment');
              if (titleEl) titleEl.innerText = `Order #${order.id} Confirmed!`;
              if (payEl) payEl.innerText = `Total Due at Counter: $${totals.total.toFixed(2)}`;
              successEl.style.display = 'block';

              const printBtn = document.getElementById('btn-print-order-receipt');
              if (printBtn) {
                printBtn.onclick = () => generatePdfReceipt(order);
              }
              const doneBtn = document.getElementById('btn-close-order-success');
              if (doneBtn) {
                doneBtn.onclick = () => this.closeCheckoutModal();
              }
            } else {
              this.closeCheckoutModal();
            }
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
      const isTier3 = window.location.pathname.includes('/tier3/');
      const formEl = document.getElementById('checkout-form');
      const successEl = document.getElementById('checkout-success-view');
      if (formEl) formEl.style.display = 'block';
      if (successEl) successEl.style.display = 'none';
      const heading = document.getElementById('modal-checkout-heading');
      const emailGroup = document.getElementById('tier3-email-group');
      const paymentSection = document.getElementById('tier3-payment-section');
      const modeLabel = document.getElementById('modal-payment-mode-label');
      const submitBtn = document.getElementById('submit-order-btn');

      const totals = this.calculateTotals();
      document.getElementById('modal-checkout-total').innerText = `$${totals.total.toFixed(2)}`;

      if (isTier3) {
        if (heading) heading.innerHTML = '<span>💳</span> Express Mobile Checkout (Stripe Prepaid)';
        if (emailGroup) {
          emailGroup.style.display = 'block';
          const emailInput = document.getElementById('cust-email');
          if (emailInput) emailInput.required = true;
        }
        if (paymentSection) paymentSection.style.display = 'block';
        if (modeLabel) modeLabel.innerText = 'Total Charged to Card (Paid Online):';
        if (submitBtn) submitBtn.innerHTML = `🔒 Pay $${totals.total.toFixed(2)} & Send to Barista &rarr;`;
      } else {
        if (heading) heading.innerHTML = '<span>☕</span> Complete Pickup Order';
        if (emailGroup) {
          emailGroup.style.display = 'block';
          const emailLabel = emailGroup.querySelector('.form-label');
          if (emailLabel) emailLabel.innerText = 'Email Address (Optional - for instant receipt)';
          const emailInput = document.getElementById('cust-email');
          if (emailInput) emailInput.required = false;
        }
        if (paymentSection) paymentSection.style.display = 'none';
        if (modeLabel) modeLabel.innerText = 'Total Due at Pickup (Pay at Counter):';
        if (submitBtn) submitBtn.innerHTML = 'Send Order to Kitchen (Pay at Counter) &rarr;';
      }

      document.getElementById('checkout-modal-overlay').classList.add('is-open');
      document.getElementById('floating-cart-trigger').classList.add('is-hidden');
    },

    closeCheckoutModal() {
      document.getElementById('checkout-modal-overlay').classList.remove('is-open');
      document.getElementById('floating-cart-trigger').classList.remove('is-hidden');
      const formEl = document.getElementById('checkout-form');
      const successEl = document.getElementById('checkout-success-view');
      if (formEl) formEl.style.display = 'block';
      if (successEl) successEl.style.display = 'none';
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

  // PDF Tax Receipt Generator with QR Pickup Pass
  function generatePdfReceipt(order) {
    const win = window.open('', '_blank');
    if (!win) {
      showToast("Please allow popups in your browser to view your PDF receipt.", "info", 5000);
      return;
    }

    const isPaidOnline = order.paidOnline || order.status === 'Paid Online';
    const statusLabel = isPaidOnline ? "PAID ONLINE (Stripe 256-Bit Encrypted)" : "PAY AT COUNTER (Due at Pickup)";
    const statusColor = isPaidOnline ? "#10b981" : "#d97706";

    const itemsRows = (order.items || []).map(i => `
      <tr>
        <td style="padding:8px 0; border-bottom:1px solid #ddd;">${i.qty}x ${i.name} ${i.customizations ? `<br/><small style="color:#666;">${i.customizations}</small>` : ''}</td>
        <td style="padding:8px 0; border-bottom:1px solid #ddd; text-align:right; font-family:monospace;">$${(i.price * i.qty).toFixed(2)}</td>
      </tr>
    `).join('');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=FLATTRACK-ORDER-${order.id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Flat Track Coffee — Tax Receipt #${order.id}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #222; max-width: 500px; margin: 0 auto; background:#fff; }
          .header { text-align: center; border-bottom: 2px dashed #bbb; padding-bottom: 16px; margin-bottom: 16px; }
          h2 { margin: 0 0 4px 0; font-size: 20px; letter-spacing: 1px; color:#111; }
          p { margin: 3px 0; font-size: 13px; color: #555; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #fff; background: ${statusColor}; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
          .totals { border-top: 1px solid #222; padding-top: 8px; margin-top: 8px; }
          .totals-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
          .grand-total { font-size: 17px; font-weight: bold; border-top: 2px solid #222; padding-top: 8px; margin-top: 8px; }
          .qr-box { text-align: center; margin: 20px 0; padding: 12px; background: #fafafa; border: 1px solid #eee; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; border-top: 1px dashed #ddd; padding-top: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FLAT TRACK COFFEE ROASTERS</h2>
          <p>1611 E Cesar Chavez St, Austin, TX 78702</p>
          <p>Phone: (512) 540-6033 · Tax ID: 74-3298104-TX</p>
          <div class="status-badge">● ${statusLabel}</div>
          <p style="margin-top:6px;"><b>Official Itemized Pickup Tax Invoice</b></p>
        </div>
        <div style="font-size:13px; line-height:1.5;">
          <p><b>Order Reference:</b> #${order.id}</p>
          <p><b>Customer:</b> ${order.customerName}</p>
          <p><b>Contact:</b> ${order.phone} ${order.email ? `· ${order.email}` : ''}</p>
          <p><b>Placed At:</b> ${new Date(order.orderTime || Date.now()).toLocaleString()}</p>
          <p><b>Pickup Window:</b> 10–12 Minutes</p>
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
            <span style="font-family:monospace;">$${(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Texas State & Local Sales Tax (8.25%):</span>
            <span style="font-family:monospace;">$${(order.tax || 0).toFixed(2)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total:</span>
            <span style="font-family:monospace;">$${(order.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="qr-box">
          <img src="${qrUrl}" alt="QR Pickup Code" width="130" height="130" style="display:block; margin:0 auto;"/>
          <p style="font-size:11px; color:#555; margin-top:8px; font-weight:600;">Express Barista Pickup QR Pass</p>
          <small style="color:#888;">Present at 1611 E Cesar Chavez counter for instant hand-off</small>
        </div>

        <div class="footer">
          <p>Thank you for supporting East Austin micro-batch coffee!</p>
          <p>© 2026 Flat Track Coffee Roasters · flattrackcoffee.com</p>
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

  // ====================================================================
  // MOBILE NAVIGATION DRAWER & DESKTOP LABEL COMPACTOR
  // ====================================================================
  function initMobileNavigation() {
    // 1. Compact desktop nav labels so they never crowd 1280px laptops
    const labelMap = {
      'order ahead 🛒': 'Menu',
      'order ahead': 'Menu',
      'bean subscriptions 📦': 'Subscriptions',
      'bean subscriptions': 'Subscriptions',
      'catering & b2b ✨': 'Catering',
      'catering & b2b': 'Catering',
      'live tracker ⚡': 'Tracker',
      'live tracker': 'Tracker',
      'reserve table 🪑': 'Reserve',
      'reserve 🪑': 'Reserve',
      'reserve a table': 'Reserve',
      'roastery story': 'Story',
      'our story': 'Story',
      'visit & contact': 'Visit',
      'visit & location': 'Visit',
      'inquire & hours': 'Contact',
      'our craft': 'Craft',
      'google reviews': 'Reviews'
    };

    document.querySelectorAll('.nav-links a, .nav-links-desktop a').forEach(a => {
      const raw = a.innerText.trim().toLowerCase();
      if (labelMap[raw]) {
        a.innerText = labelMap[raw];
      }
    });

    // 2. Ensure header has mobile menu toggle button
    const header = document.querySelector('header.header-glass, header, .site-header, .navbar');
    if (!header) return;

    let toggleBtn = document.getElementById('mobile-menu-toggle');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'mobile-menu-toggle';
      toggleBtn.className = 'mobile-menu-toggle';
      toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
      toggleBtn.innerHTML = '<span></span><span></span><span></span>';

      const actions = header.querySelector('.header-actions');
      if (actions) {
        actions.appendChild(toggleBtn);
      } else {
        const container = header.querySelector('.header-container, .header-inner') || header;
        container.appendChild(toggleBtn);
      }
    }

    // 3. Inject Mobile Backdrop & Drawer if not already present
    if (!document.getElementById('mobile-nav-drawer')) {
      const backdrop = document.createElement('div');
      backdrop.id = 'mobile-nav-backdrop';
      backdrop.className = 'mobile-nav-backdrop';

      const drawer = document.createElement('div');
      drawer.id = 'mobile-nav-drawer';
      drawer.className = 'mobile-nav-drawer';

      // Detect current path
      const path = window.location.pathname.toLowerCase();
      const isTier3 = path.includes('/tier3/') || path.includes('tier3.html');
      const isTier2 = path.includes('/tier2/') || path.includes('tier2.html');
      const isTier1 = path.includes('/tier1/') || path.includes('tier1.html');

      let linksHTML = '';
      const existingLinks = document.querySelectorAll('.nav-links a, .nav-links-desktop a');
      if (existingLinks.length > 0) {
        existingLinks.forEach(a => {
          const href = a.getAttribute('href');
          const text = a.innerText.trim();
          const isActive = a.classList.contains('active') ? ' active' : '';
          linksHTML += `<li><a href="${href}" class="mobile-drawer-link${isActive}">${text} <span>&rarr;</span></a></li>`;
        });
      } else if (isTier3) {
        linksHTML = `
          <li><a href="index.html" class="mobile-drawer-link">Flagship Home <span>&rarr;</span></a></li>
          <li><a href="menu.html" class="mobile-drawer-link">Order Ahead 🛒 <span>&rarr;</span></a></li>
          <li><a href="subscribe.html" class="mobile-drawer-link">Bean Subscriptions 📦 <span>&rarr;</span></a></li>
          <li><a href="catering.html" class="mobile-drawer-link">Catering &amp; B2B ✨ <span>&rarr;</span></a></li>
          <li><a href="track.html" class="mobile-drawer-link">Live Tracker ⚡ <span>&rarr;</span></a></li>
          <li><a href="reserve.html" class="mobile-drawer-link">Reserve Table 🪑 <span>&rarr;</span></a></li>
          <li><a href="story.html" class="mobile-drawer-link">Roastery Story <span>&rarr;</span></a></li>
          <li><a href="contact.html" class="mobile-drawer-link">Visit &amp; Contact <span>&rarr;</span></a></li>
        `;
      } else if (isTier2) {
        linksHTML = `
          <li><a href="index.html" class="mobile-drawer-link">Home <span>&rarr;</span></a></li>
          <li><a href="menu.html" class="mobile-drawer-link">Order Ahead 🛒 <span>&rarr;</span></a></li>
          <li><a href="reserve.html" class="mobile-drawer-link">Reserve Table 🪑 <span>&rarr;</span></a></li>
          <li><a href="story.html" class="mobile-drawer-link">Roastery Story <span>&rarr;</span></a></li>
          <li><a href="contact.html" class="mobile-drawer-link">Visit &amp; Contact <span>&rarr;</span></a></li>
        `;
      } else if (isTier1) {
        linksHTML = `
          <li><a href="#about" class="mobile-drawer-link">Our Craft <span>&rarr;</span></a></li>
          <li><a href="#menu" class="mobile-drawer-link">Menu Offerings <span>&rarr;</span></a></li>
          <li><a href="#reviews" class="mobile-drawer-link">Google Reviews <span>&rarr;</span></a></li>
          <li><a href="#location" class="mobile-drawer-link">Visit &amp; Location <span>&rarr;</span></a></li>
          <li><a href="#contact" class="mobile-drawer-link">Inquire &amp; Hours <span>&rarr;</span></a></li>
        `;
      } else {
        linksHTML = `
          <li><a href="#tiers" class="mobile-drawer-link">Compare 3 Tiers <span>&rarr;</span></a></li>
          <li><a href="tier1/index.html" class="mobile-drawer-link">Tier 1 Demo ($497) <span>&rarr;</span></a></li>
          <li><a href="tier2/index.html" class="mobile-drawer-link">Tier 2 Demo ($997) <span>&rarr;</span></a></li>
          <li><a href="tier3/index.html" class="mobile-drawer-link">Tier 3 Demo ($1,997) <span>&rarr;</span></a></li>
          <li><a href="#script" class="mobile-drawer-link">2-Min Sales Pitch <span>&rarr;</span></a></li>
        `;
      }

      drawer.innerHTML = `
        <div class="mobile-drawer-header">
          <div style="display:flex; align-items:center; gap:0.5rem; font-family:var(--font-display, serif); font-weight:700; font-size:1.15rem; color:var(--text-primary);">
            <span>☕</span> FLAT TRACK ROASTERS
          </div>
          <button id="mobile-drawer-close" class="mobile-drawer-close" aria-label="Close menu">&times;</button>
        </div>
        <ul class="mobile-drawer-links">
          ${linksHTML}
        </ul>
        <div class="mobile-drawer-actions">
          <button type="button" class="btn btn-outline-gold btn-sm btn-google-auth-trigger" style="width:100%; display:flex; align-items:center; justify-content:center; gap:0.5rem; text-align:center; margin-bottom:0.25rem;">
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.57l4.02 3.14c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>
            <span class="drawer-google-user-label">Sign In with Google</span>
          </button>
          ${isTier3 ? '<a href="subscribe.html" class="btn btn-primary btn-sm" style="text-align:center;">📦 Join Bean Club</a>' : ''}
          ${isTier2 || isTier3 ? '<a href="reserve.html" class="btn btn-outline-gold btn-sm" style="text-align:center;">🪑 Reserve a Table</a>' : ''}
          <a href="tel:5125406033" class="btn btn-secondary btn-sm" style="text-align:center;">📞 (512) 540-6033</a>
          <div style="font-size:0.78rem; text-align:center; color:var(--text-secondary); margin-top:0.4rem;">
            1611 E Cesar Chavez St, Austin, TX 78702
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(drawer);

      // Event Listeners for drawer
      function openDrawer() {
        toggleBtn.classList.add('is-active');
        backdrop.classList.add('is-open');
        drawer.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }

      function closeDrawer() {
        toggleBtn.classList.remove('is-active');
        backdrop.classList.remove('is-open');
        drawer.classList.remove('is-open');
        document.body.style.overflow = '';
      }

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (drawer.classList.contains('is-open')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      backdrop.addEventListener('click', closeDrawer);
      const closeBtn = drawer.querySelector('#mobile-drawer-close');
      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeDrawer);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
          closeDrawer();
        }
      });
    }
  }

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavigation);
  } else {
    initMobileNavigation();
  }
  window.initMobileNavigation = initMobileNavigation;


  // ====================================================================
  // GOOGLE OAUTH & CUSTOMER ACCOUNT SYSTEM (UNIVERSAL)
  // ====================================================================
  function initTier3GoogleAuth() {
    function openAuthModal() {
      const modal = document.getElementById('auth-modal-overlay');
      if (modal) modal.classList.add('is-open');
    }

    function closeAuthModal() {
      const modal = document.getElementById('auth-modal-overlay');
      if (modal) modal.classList.remove('is-open');
    }

    // 1. Inject or update header auth button in .header-actions if needed
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('btn-header-google-auth')) {
      const authBtn = document.createElement('button');
      authBtn.id = 'btn-header-google-auth';
      authBtn.className = 'btn btn-outline-gold btn-sm btn-google-auth-trigger';
      authBtn.style.cssText = 'display:inline-flex; align-items:center; gap:0.4rem; padding:0.42rem 0.75rem;';
      authBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.57l4.02 3.14c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>
        <span id="header-google-user-label">Sign In</span>
      `;
      const toggle = headerActions.querySelector('#mobile-menu-toggle');
      if (toggle) {
        headerActions.insertBefore(authBtn, toggle);
      } else {
        headerActions.appendChild(authBtn);
      }
    }

    // 2. Inject Auth Modal into body if not present
    if (!document.getElementById('auth-modal-overlay')) {
      const modalWrap = document.createElement('div');
      modalWrap.id = 'auth-modal-overlay';
      modalWrap.className = 'modal-overlay';
      modalWrap.innerHTML = `
        <div class="modal-card" style="max-width:440px;" data-lenis-prevent>
          <div class="modal-header">
            <h3 id="auth-modal-title"><span>✨</span> Roastery Customer Account</h3>
            <button class="modal-close-btn" id="auth-modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" style="padding:1.5rem 1.25rem;">
            <p style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1.25rem; text-align:center;">
              Sign in for 1-tap express checkout, real-time counter order tracking, and freshly roasted bean subscriptions.
            </p>

            <!-- Google OAuth Instant Button -->
            <button type="button" id="btn-modal-google-action" class="btn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:0.65rem; background:#ffffff; color:#1f1f1f; font-weight:600; font-size:0.95rem; border:1px solid #dadce0; border-radius:10px; padding:0.75rem 1rem; box-shadow:0 2px 6px rgba(0,0,0,0.18); cursor:pointer; margin-bottom:1.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.57l4.02 3.14c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>
              <span>Continue with Google</span>
            </button>

            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
              <div style="flex:1; height:1px; background:var(--border-subtle);"></div>
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.08em;">Or Email &amp; Password</span>
              <div style="flex:1; height:1px; background:var(--border-subtle);"></div>
            </div>

            <!-- Email Login Form -->
            <form id="auth-email-form">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="auth-input-email" class="form-input" required placeholder="you@domain.com">
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="auth-input-pass" class="form-input" required placeholder="••••••••">
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">
                Sign In to Roastery &rarr;
              </button>
            </form>

            <!-- Already signed in profile view -->
            <div id="auth-signed-in-view" style="display:none; text-align:center;">
              <div style="font-size:2.8rem; margin-bottom:0.5rem;">☕</div>
              <h4 id="auth-user-name" style="font-size:1.2rem; color:var(--text-primary); margin-bottom:0.25rem;">Austin Member</h4>
              <p id="auth-user-email" style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:1.25rem;">austin.guest@gmail.com</p>
              <div style="background:rgba(201,168,76,0.12); border:1px solid var(--border-gold-subtle); border-radius:12px; padding:1rem; margin-bottom:1.5rem;">
                <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-gold);">Roastery Account</div>
                <div id="auth-user-membership" style="font-size:1.2rem; font-weight:700; color:var(--text-primary); margin:0.25rem 0;">Flagship Coffee Member ☕</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">Express Counter Pickup &amp; Subscriptions Active</div>
              </div>
              <div style="display:flex; gap:0.75rem;">
                <a href="menu.html" class="btn btn-primary btn-sm" style="flex:1;">Order Ahead ⚡</a>
                <button type="button" id="btn-auth-logout" class="btn btn-outline-gold btn-sm" style="flex:1;">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalWrap);

      const closeBtn = document.getElementById('auth-modal-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
      modalWrap.addEventListener('click', (e) => {
        if (e.target === modalWrap) closeAuthModal();
      });

      const googleBtn = document.getElementById('btn-modal-google-action');
      if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
          googleBtn.disabled = true;
          googleBtn.innerHTML = 'Connecting to Google OAuth...';
          try {
            let user = null;
            if (window.FlatTrackAPI && window.FlatTrackAPI.loginGoogle) {
              const res = await window.FlatTrackAPI.loginGoogle("austin.guest@gmail.com", "Austin Coffee Club Member");
              user = res.user;
            }
            const session = {
              email: user?.email || "austin.guest@gmail.com",
              name: user?.name || "Austin Coffee Member",
              member: true
            };
            localStorage.setItem('flat_track_customer_session', JSON.stringify(session));
            showToast("✓ Signed in with Google! Welcome to Flat Track Roasters. ☕", "success", 4000);
            updateAuthState();
            closeAuthModal();
          } catch (e) {
            console.error(e);
          } finally {
            googleBtn.disabled = false;
            googleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.43l4.02-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.57l4.02 3.14c.95-2.83 3.6-4.96 6.72-4.96z"/></svg> <span>Continue with Google</span>';
          }
        });
      }

      const emailForm = document.getElementById('auth-email-form');
      if (emailForm) {
        emailForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('auth-input-email').value;
          const session = {
            email: email,
            name: email.split('@')[0],
            member: true
          };
          localStorage.setItem('flat_track_customer_session', JSON.stringify(session));
          showToast(`✓ Welcome back, ${session.name}! Member account active.`, "success", 4000);
          updateAuthState();
          closeAuthModal();
        });
      }

      const logoutBtn = document.getElementById('btn-auth-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('flat_track_customer_session');
          showToast("Signed out of customer account", "info");
          updateAuthState();
          closeAuthModal();
        });
      }
    }

    // 3. Bind click events to ALL auth buttons
    document.querySelectorAll('#btn-header-google-auth, .btn-google-auth-trigger').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        openAuthModal();
      };
    });

    function updateAuthState() {
      let session = null;
      try {
        const raw = localStorage.getItem('flat_track_customer_session');
        if (raw) session = JSON.parse(raw);
      } catch (e) {}

      const label = document.getElementById('header-google-user-label');
      const drawerLabels = document.querySelectorAll('.drawer-google-user-label');
      const googleBtns = document.querySelectorAll('#btn-header-google-auth, .btn-google-auth-trigger');
      const signedInView = document.getElementById('auth-signed-in-view');
      const emailForm = document.getElementById('auth-email-form');
      const googleModalBtn = document.getElementById('btn-modal-google-action');

      if (session && session.email) {
        const displayShort = `✨ ${session.name.split(' ')[0]} (Member)`;
        if (label) label.innerText = displayShort;
        drawerLabels.forEach(dl => dl.innerText = displayShort);
        googleBtns.forEach(gb => gb.style.borderColor = 'var(--accent-gold)');
        if (signedInView) {
          signedInView.style.display = 'block';
          const nameEl = document.getElementById('auth-user-name');
          const emailEl = document.getElementById('auth-user-email');
          if (nameEl) nameEl.innerText = session.name;
          if (emailEl) emailEl.innerText = session.email;
        }
        if (emailForm) emailForm.style.display = 'none';
        if (googleModalBtn) googleModalBtn.style.display = 'none';
      } else {
        if (label) label.innerText = 'Sign In';
        drawerLabels.forEach(dl => dl.innerText = 'Sign In with Google');
        googleBtns.forEach(gb => gb.style.borderColor = '');
        if (signedInView) signedInView.style.display = 'none';
        if (emailForm) emailForm.style.display = 'block';
        if (googleModalBtn) googleModalBtn.style.display = 'flex';
      }
    }

    window.addEventListener('flat_track_auth_change', updateAuthState);
    updateAuthState();
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTier3GoogleAuth);
  } else {
    initTier3GoogleAuth();
  }

})(window);
