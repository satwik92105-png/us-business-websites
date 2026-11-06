/**
 * Flat Track Coffee Roasters — Dual-Mode Data Layer (api-client.js)
 * Seamlessly interfaces with Python FastAPI (/api) or falls back to
 * IndexedDB/localStorage with multi-tab BroadcastChannel real-time sync.
 */

(function (window) {
  const API_BASE = window.FLAT_TRACK_API_URL || "https://01-austin-roasters-coffee.vercel.app/api";
  const CHANNEL_NAME = 'flat_track_live_sync';
  const STORAGE_KEY = 'flattrack_clean_v4';

  // Immediate startup cache wipe of any legacy mock keys
  try {
    const keysToPurge = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== STORAGE_KEY && (k.includes('flat_track') || k.includes('flattrack'))) {
        keysToPurge.push(k);
      }
    }
    keysToPurge.forEach(k => localStorage.removeItem(k));
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
      name: "Rosemary & Gruyere Scone",
      category: "bakery",
      price: 4.75,
      description: "Savory house-baked scone with fresh garden rosemary, aged gruyere cheese, and cracked black pepper.",
      badge: "Savory Pick",
      inStock: true,
      image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&auto=format&fit=crop&q=80",
      customizable: false
    },
    {
      id: 9,
      name: "Dogspeed Blend Whole Bean (12oz)",
      category: "beans",
      price: 19.50,
      description: "Our flagship medium-dark roast. Tasting notes of dark chocolate, toasted pecan, and dried fig.",
      badge: "Signature Beans",
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
        promoCodes: [
          { code: "DOGSPEED15", discountPercent: 15, active: true },
          { code: "AUSTINVIP", discountPercent: 20, active: true }
        ],
        loyalty: {
          points: 320,
          tier: "Roast Aficionado",
          ordersCount: 8,
          rewards: [
            { id: "rew_1", title: "Free Pour-Over or Nitro Cold Brew", cost: 250, unlocked: true },
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
      return JSON.parse(raw);
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
      broadcastChannel.postMessage({ action, payload, timestamp: Date.now() });
    }
  }

  // Dual-mode API Client definition
  const apiClient = {
    // Mode indicator
    isBackendOnline: false,

    async checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(1200) });
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
      if (this.isBackendOnline) {
        try {
          const res = await fetch(`${API_BASE}/menu`);
          if (res.ok) return await res.json();
        } catch (e) { console.warn("Backend failed, using local", e); }
      }
      const state = loadState();
      return state.menu;
    },

    async saveMenuItem(item) {
      if (this.isBackendOnline) {
        try {
          const res = await fetch(`${API_BASE}/menu`, {
            method: item.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          if (res.ok) {
            notifySync('menu_update', item);
            return await res.json();
          }
        } catch (e) { console.warn("Backend mutation failed", e); }
      }
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
      const state = loadState();
      state.menu = state.menu.filter(m => m.id !== id);
      saveState(state);
      notifySync('menu_update', { id, deleted: true });
      return true;
    },

    async toggleStock(id, inStock) {
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
      const state = loadState();
      return state.orders;
    },

    async createOrder(orderData) {
      const state = loadState();
      const orderId = `FT-${Math.floor(1000 + Math.random() * 9000)}`;
      const subtotal = Math.round(orderData.subtotal * 100) / 100;
      const tax = Math.round(subtotal * 0.0825 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const newOrder = {
        id: orderId,
        customerName: orderData.customerName || "Guest",
        phone: orderData.phone || "(512) 555-0100",
        items: orderData.items || [],
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: "New Order",
        orderTime: new Date().toISOString(),
        pickupEstimate: "10-12 mins",
        notes: orderData.notes || ""
      };

      state.orders.unshift(newOrder);
      // Award loyalty points: 10 points per dollar
      state.loyalty.points += Math.floor(subtotal * 10);
      state.loyalty.ordersCount += 1;
      saveState(state);
      notifySync('new_order', newOrder);
      return newOrder;
    },

    async updateOrderStatus(orderId, status) {
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
      const state = loadState();
      return state.reservations;
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
      state.reservations.unshift(newRes);
      saveState(state);
      notifySync('new_reservation', newRes);
      return newRes;
    },

    async updateReservationStatus(id, status) {
      const state = loadState();
      const res = state.reservations.find(r => r.id === id);
      if (res) {
        res.status = status;
        saveState(state);
        notifySync('reservation_status_update', { id, status });
      }
      return res;
    },

    // INQUIRIES & CONTACT
    async createInquiry(data) {
      const state = loadState();
      const inq = {
        id: `INQ-${Date.now()}`,
        name: data.name,
        email: data.email,
        subject: data.subject || "General Inquiry",
        message: data.message,
        date: new Date().toLocaleDateString('en-US')
      };
      state.inquiries.unshift(inq);
      saveState(state);
      notifySync('new_inquiry', inq);
      return inq;
    },

    async getInquiries() {
      const state = loadState();
      return state.inquiries;
    },

    // SUBSCRIPTIONS
    async createSubscription(subData) {
      const state = loadState();
      const sub = {
        id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
        roast: subData.roast,
        grind: subData.grind,
        frequency: subData.frequency,
        bagsCount: subData.bagsCount || 1,
        monthlyPrice: subData.monthlyPrice,
        customerName: subData.customerName,
        email: subData.email,
        created: new Date().toISOString()
      };
      state.subscribers.unshift(sub);
      saveState(state);
      notifySync('new_subscription', sub);
      return sub;
    },

    async getSubscribers() {
      const state = loadState();
      return state.subscribers;
    },

    // PROMO CODES
    async applyPromoCode(code) {
      const state = loadState();
      const promo = state.promoCodes.find(p => p.code.toUpperCase() === code.trim().toUpperCase() && p.active);
      if (promo) {
        return { valid: true, discountPercent: promo.discountPercent, code: promo.code };
      }
      return { valid: false, message: "Invalid or expired promo code" };
    },

    // LOYALTY
    getLoyaltyProfile() {
      const state = loadState();
      return state.loyalty;
    },

    // RESET DEMO DATA
    resetDemoData() {
      localStorage.removeItem(STORAGE_KEY);
      const newState = loadState();
      notifySync('demo_reset', newState);
      return newState;
    },

    // LISTEN FOR LIVE SYNC EVENTS
    onSync(callback) {
      if (broadcastChannel) {
        broadcastChannel.addEventListener('message', (event) => {
          callback(event.data);
        });
      }
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          callback({ action: 'storage_changed', payload: loadState() });
        }
      });
    }
  };

  // Initial check
  apiClient.checkHealth();

  window.FlatTrackAPI = apiClient;
})(window);
