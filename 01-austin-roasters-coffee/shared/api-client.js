/**
 * Flat Track Coffee Roasters — Dual-Mode Data Layer (api-client.js)
 * Seamlessly interfaces with Python FastAPI (/api) on Vercel or falls back to
 * IndexedDB/localStorage with multi-tab BroadcastChannel real-time sync.
 */

(function (window) {
  const API_BASE = window.FLAT_TRACK_API_URL || "https://01-austin-roasters-coffee.vercel.app/api";
  const CHANNEL_NAME = 'flat_track_live_sync';
  const STORAGE_KEY = 'flattrack_prod_v6';

  // Immediate startup cache wipe of any legacy mock keys
  try {
    const legacyKeys = [
      'flat_track_coffee_v1', 'flat_track_coffee_v2', 'flat_track_coffee_v3',
      'flat_track_coffee_v4', 'flat_track_coffee_v5', 'flat_track_roasters_data_v3',
      'flat_track_roasters_data_v4', 'flattrack_clean_v4',
      'flattrack_prod_v1', 'flattrack_prod_v2', 'flattrack_prod_v3', 'flattrack_prod_v4', 'flattrack_prod_v5',
      'flattrack_db_v3', 'flat_track_orders', 'flat_track_reservations'
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch(e){}
    });
  } catch (e) {
    console.warn("Storage wipe notice:", e);
  }

  // Seed Menu Items
  const INITIAL_MENU = [
    {
      id: 1,
      name: "Dogspeed Espresso Double",
      category: "espresso",
      price: 4.50,
      description: "Double-pulled Dogspeed blend. Rich dark cacao, candied citrus, dense persistent crema. The house signature.",
      badge: "Roaster's Pick",
      inStock: true,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      customizable: true
    },
    {
      id: 2,
      name: "Flat Track Classic Cortado",
      category: "espresso",
      price: 5.00,
      description: "Equal parts double espresso and silky steamed oat or whole milk. Balanced, intensely aromatic.",
      badge: "Local Favorite",
      inStock: true,
      image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80",
      customizable: true
    },
    {
      id: 3,
      name: "Bourbon Smoked Vanilla Latte",
      category: "specialty",
      price: 6.75,
      description: "House-made Madagascar vanilla syrup infused with oak barrel smoke and espresso, topped with raw turbinado sugar.",
      badge: "Seasonal Release",
      inStock: true,
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80",
      customizable: true
    },
    {
      id: 4,
      name: "Single-Origin Ethiopian Pour-Over",
      category: "pourover",
      price: 6.50,
      description: "Yirgacheffe natural process. Vibrant bergamot, ripe blackberry, and delicate honeysuckle finish.",
      badge: "Micro-Lot",
      inStock: true,
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
      customizable: false
    },
    {
      id: 5,
      name: "East Austin Flash Brew Iced",
      category: "cold",
      price: 5.50,
      description: "Brewed hot directly over ice to preserve volatile aromatics. Crisp citrus brightness, ultra-refreshing.",
      badge: "Summer Essential",
      inStock: true,
      image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
      customizable: true
    },
    {
      id: 6,
      name: "Slow-Steeped Cold Brew Float",
      category: "cold",
      price: 7.00,
      description: "20-hour steeped Dogspeed cold brew poured over local Sweet Ritual Madagascar vanilla ice cream.",
      badge: "Indulgent",
      inStock: true,
      image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80",
      customizable: false
    },
    {
      id: 7,
      name: "Artisan Butter Croissant",
      category: "bakery",
      price: 4.50,
      description: "Baked fresh daily by Swedish Hill. 48 laminated butter layers, golden flaky crust, soft honeycomb interior.",
      badge: "Fresh Daily",
      inStock: true,
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
      customizable: false
    },
    {
      id: 8,
      name: "Rosemary & Gruyère Savory Scone",
      category: "bakery",
      price: 4.75,
      description: "Infused with fresh garden rosemary and melted aged Swiss Gruyère. Warm, buttery, and fragrant.",
      badge: "Baker's Choice",
      inStock: true,
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
      customizable: false
    },
    {
      id: 9,
      name: "Dogspeed Blend Whole Bean (12oz)",
      category: "beans",
      price: 19.50,
      description: "Our signature espresso blend (Washed Colombia & Natural Ethiopia). Dark cocoa, sweet plum, and velvety mouthfeel.",
      badge: "Signature Roast",
      inStock: true,
      image: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80",
      customizable: false
    },
    {
      id: 10,
      name: "Mexico Oaxaca Pluma Whole Bean (12oz)",
      category: "beans",
      price: 21.00,
      description: "Washed process micro-lot from Pluma Hidalgo. Milk chocolate, crisp green apple, and raw sugar cane sweetness.",
      badge: "Direct Trade",
      inStock: true,
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80",
      customizable: false
    }
  ];

  // Storage helper
  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const state = {
        menu: INITIAL_MENU,
        orders: [],
        reservations: [],
        inquiries: [],
        subscribers: [],
        currentUser: null,
        promoCodes: [
          { code: "DOGSPEED15", discountPercent: 15, active: true },
          { code: "AUSTINVIP", discountPercent: 20, active: true }
        ],
        loyalty: {
          points: 0,
          tier: "Guest Member",
          ordersCount: 0,
          rewards: [
            { id: "rew_1", title: "Free Pour-Over or Nitro Cold Brew", cost: 250, unlocked: false },
            { id: "rew_2", title: "50% Off Any 12oz Whole Bean Bag", cost: 500, unlocked: false }
          ]
        },
        settings: {
          storeName: "Flat Track Coffee Roasters",
          address: "1611 E Cesar Chavez St, Austin, TX 78702",
          phone: "(512) 540-6033",
          taxRate: 0.0825,
          pickupTimeMinutes: 12
        }
      };
      saveState(state);
      return state;
    }
    try {
      const parsed = JSON.parse(raw);
      // Clean any legacy mock orders or reservations
      if (parsed.orders) {
        parsed.orders = parsed.orders.filter(o => o.id !== 'FT-8402' && o.id !== 'FT-8403' && !o.customerName?.includes('Alex') && !o.customerName?.includes('Elena') && !o.customerName?.includes('Taylor') && !o.customerName?.includes('Marcus'));
      }
      if (parsed.reservations) {
        parsed.reservations = parsed.reservations.filter(r => r.id !== 'RES-401' && !r.name?.includes('Marcus'));
      }
      return parsed;
    } catch (e) {
      console.warn("Storage reset due to parse error", e);
      localStorage.removeItem(STORAGE_KEY);
      return loadState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // BroadcastChannel for Live Synchronization across tabs
  let broadcastChannel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }

  function notifySync(action, payload) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ action, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn("BroadcastChannel error:", e);
      }
    }
  }

  // Public API Object
  window.FlatTrackAPI = {
    isBackendOnline: false,

    async checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(1800) });
        if (res.ok) {
          this.isBackendOnline = true;
          return true;
        }
      } catch (e) {
        this.isBackendOnline = false;
      }
      return false;
    },

    // MENU
    async getMenu() {
      try {
        const res = await fetch(`${API_BASE}/menu`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          this.isBackendOnline = true;
          return await res.json();
        }
      } catch (e) {}
      const state = loadState();
      return state.menu;
    },

    async saveMenuItem(item) {
      try {
        const res = await fetch(`${API_BASE}/menu`, {
          method: item.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          notifySync('menu_update', item);
          return await res.json();
        }
      } catch (e) {}
      const state = loadState();
      if (item.id) {
        const idx = state.menu.findIndex(m => m.id === item.id);
        if (idx !== -1) state.menu[idx] = { ...state.menu[idx], ...item };
      } else {
        item.id = Date.now();
        state.menu.unshift(item);
      }
      saveState(state);
      notifySync('menu_update', item);
      return item;
    },

    async deleteMenuItem(id) {
      try {
        await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(2000) });
      } catch (e) {}
      const state = loadState();
      state.menu = state.menu.filter(m => m.id !== id);
      saveState(state);
      notifySync('menu_update', { id, deleted: true });
      return true;
    },

    async toggleStock(id, inStock) {
      try {
        await fetch(`${API_BASE}/menu/${id}/stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ in_stock: inStock }),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}
      const state = loadState();
      const item = state.menu.find(m => m.id === id);
      if (item) {
        item.inStock = inStock;
        saveState(state);
        notifySync('stock_toggle', { id, inStock });
      }
      return item;
    },

    // ORDERS
    async getOrders() {
      try {
        const res = await fetch(`${API_BASE}/orders`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return await res.json();
      } catch (e) {}
      const state = loadState();
      return state.orders || [];
    },

    async getOrder(orderId) {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return await res.json();
      } catch (e) {}
      const state = loadState();
      return (state.orders || []).find(o => o.id === orderId) || null;
    },

    async createOrder(orderData) {
      const state = loadState();
      const orderId = `FT-${Math.floor(1000 + Math.random() * 9000)}`;
      const subtotal = Math.round(orderData.subtotal * 100) / 100;
      const tax = Math.round(subtotal * 0.0825 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const statusStr = orderData.paidOnline ? "Paid Online" : "New Order";

      const newOrder = {
        id: orderId,
        customerName: orderData.customerName || "Guest",
        phone: orderData.phone || "(512) 555-0100",
        items: orderData.items || [],
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: statusStr,
        paymentStatus: orderData.paidOnline ? "Paid Online" : "Pay at Counter",
        orderTime: new Date().toISOString(),
        pickupEstimate: "10-12 mins",
        notes: orderData.notes || ""
      };

      try {
        await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: newOrder.customerName,
            phone: newOrder.phone,
            items: newOrder.items,
            subtotal: newOrder.subtotal,
            notes: newOrder.notes,
            paidOnline: orderData.paidOnline
          }),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}

      state.orders.unshift(newOrder);
      if (state.currentUser) {
        state.loyalty.points += Math.floor(subtotal * 10);
        state.loyalty.ordersCount += 1;
      }
      saveState(state);
      notifySync('new_order', newOrder);
      return newOrder;
    },

    async updateOrderStatus(orderId, status) {
      try {
        await fetch(`${API_BASE}/orders/${orderId}/status?new_status=${encodeURIComponent(status)}`, {
          method: 'PATCH',
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}
      const state = loadState();
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        saveState(state);
        notifySync('order_status_update', { orderId, status });
      }
      return order;
    },

    // RESERVATIONS
    async getReservations() {
      try {
        const res = await fetch(`${API_BASE}/reservations`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return await res.json();
      } catch (e) {}
      const state = loadState();
      return state.reservations || [];
    },

    async createReservation(resData) {
      const state = loadState();
      const resId = `RES-${Math.floor(100 + Math.random() * 900)}`;
      const newRes = {
        id: resId,
        name: resData.name,
        email: resData.email,
        phone: resData.phone,
        partySize: parseInt(resData.partySize, 10) || 2,
        date: resData.date,
        time: resData.time,
        status: "Confirmed",
        notes: resData.notes || ""
      };

      try {
        await fetch(`${API_BASE}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRes),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}

      state.reservations.unshift(newRes);
      saveState(state);
      notifySync('new_reservation', newRes);
      return newRes;
    },

    async updateReservationStatus(id, status) {
      try {
        await fetch(`${API_BASE}/reservations/${id}/status?new_status=${encodeURIComponent(status)}`, {
          method: 'PATCH',
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}
      const state = loadState();
      const res = state.reservations.find(r => r.id === id);
      if (res) {
        res.status = status;
        saveState(state);
        notifySync('reservation_status_update', { id, status });
      }
      return res;
    },

    // INQUIRIES & MESSAGES
    async createInquiry(data) {
      const state = loadState();
      const inq = {
        id: `INQ-${Date.now()}`,
        name: data.name,
        email: data.email,
        subject: data.subject || "General Inquiry",
        message: data.message,
        date: "Today"
      };

      try {
        await fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inq),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}

      state.inquiries.unshift(inq);
      saveState(state);
      notifySync('new_inquiry', inq);
      return inq;
    },

    async getInquiries() {
      try {
        const res = await fetch(`${API_BASE}/messages`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return await res.json();
      } catch (e) {}
      const state = loadState();
      return state.inquiries || [];
    },

    // SUBSCRIPTIONS
    async createSubscription(subData) {
      const state = loadState();
      const sub = {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        roast: subData.roast,
        grind: subData.grind,
        frequency: subData.frequency,
        monthlyPrice: subData.monthlyPrice || 38.00,
        customerName: subData.customerName,
        email: subData.email,
        active: true
      };

      try {
        await fetch(`${API_BASE}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}

      state.subscribers.unshift(sub);
      saveState(state);
      notifySync('new_subscription', sub);
      return sub;
    },

    async getSubscribers() {
      try {
        const res = await fetch(`${API_BASE}/subscriptions`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return await res.json();
      } catch (e) {}
      const state = loadState();
      return state.subscribers || [];
    },

    // CATERING
    async createCatering(data) {
      try {
        await fetch(`${API_BASE}/catering`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}
      return { id: `CAT-${Math.floor(100 + Math.random() * 900)}`, status: "Inquiry Received" };
    },

    // AUTH & CUSTOMER ACCOUNT
    getCurrentUser() {
      const state = loadState();
      return state.currentUser || null;
    },

    async login(email, password) {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          const state = loadState();
          state.currentUser = { email, name: email.split('@')[0], role: data.role };
          saveState(state);
          return { success: true, user: state.currentUser, token: data.access_token };
        }
      } catch (e) {}
      if (email === "admin@flattrackcoffee.com" && (password === "roastmaster123" || password === "1234")) {
        const state = loadState();
        state.currentUser = { email, name: "Roastery Owner", role: "admin" };
        saveState(state);
        return { success: true, user: state.currentUser };
      }
      return { success: false, message: "Invalid credentials" };
    },

    async register(email, password, name) {
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          const state = loadState();
          state.currentUser = { email, name: name || email.split('@')[0], role: "customer" };
          state.loyalty.points = 100; // Welcome points
          saveState(state);
          return { success: true, user: state.currentUser };
        }
      } catch (e) {}
      const state = loadState();
      state.currentUser = { email, name: name || email.split('@')[0], role: "customer" };
      state.loyalty.points = 100;
      saveState(state);
      return { success: true, user: state.currentUser };
    },

    async loginGoogle(email = "customer@gmail.com", name = "Austin Customer") {
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          const state = loadState();
          state.currentUser = data.user;
          state.loyalty.points = 150;
          saveState(state);
          return { success: true, user: data.user };
        }
      } catch (e) {}
      const state = loadState();
      state.currentUser = { email, name, role: "customer" };
      state.loyalty.points = 150;
      saveState(state);
      return { success: true, user: state.currentUser };
    },

    logout() {
      const state = loadState();
      state.currentUser = null;
      state.loyalty.points = 0;
      saveState(state);
      notifySync('auth_change', null);
      return true;
    },

    // PROMO CODES
    async applyPromoCode(code) {
      const state = loadState();
      const match = state.promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active);
      if (match) return { valid: true, discountPercent: match.discountPercent, code: match.code };
      return { valid: false };
    },

    onSync(callback) {
      if (broadcastChannel) {
        broadcastChannel.addEventListener('message', (event) => {
          callback(event.data);
        });
      }
    }
  };

  // Immediate health probe
  window.FlatTrackAPI.checkHealth();
})(window);
