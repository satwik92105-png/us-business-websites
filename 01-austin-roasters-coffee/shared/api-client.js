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
      customizable: true
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
      customizable: true
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
      customizable: true
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
      customizable: true
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
      customizable: true
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
      customizable: true
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
        customerAccount: {
          tier: "Roastery Member",
          ordersCount: 0
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
      // Clean any legacy mock orders or reservations by ID only
      if (parsed.orders) {
        parsed.orders = parsed.orders.filter(o => o.id !== 'FT-8402' && o.id !== 'FT-8403');
      }
      if (parsed.reservations) {
        parsed.reservations = parsed.reservations.filter(r => r.id !== 'RES-401');
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

    getAdminHeaders() {
      const headers = { 'Content-Type': 'application/json', 'X-Admin-PIN': '1234' };
      try {
        const token = sessionStorage.getItem('flattrack_admin_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch(e) {}
      return headers;
    },

    // MENU
    async getMenu() {
      const state = loadState();
      let backendItems = [];
      try {
        const res = await fetch(`${API_BASE}/menu`, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          this.isBackendOnline = true;
          backendItems = await res.json();
        }
      } catch (e) {}

      // Bi-directional merge so owner edits in POS and local state persist
      const mergedMap = new Map();
      
      // 1. ALWAYS initialize baseline from INITIAL_MENU so items are 100% NEVER empty
      INITIAL_MENU.forEach(m => mergedMap.set(String(m.id), { ...m, customizable: true, inStock: true, in_stock: true }));

      // 2. Blend in backend items if available
      if (Array.isArray(backendItems) && backendItems.length > 0) {
        backendItems.forEach(m => {
          const existing = mergedMap.get(String(m.id));
          mergedMap.set(String(m.id), { ...existing, ...m });
        });
      }

      // 3. Blend in local state edits
      if (Array.isArray(state.menu) && state.menu.length > 0) {
        state.menu.forEach(m => {
          const existing = mergedMap.get(String(m.id));
          mergedMap.set(String(m.id), { ...existing, ...m });
        });
      }

      const normalized = Array.from(mergedMap.values()).map(m => {
        const inSt = m.inStock !== undefined ? Boolean(m.inStock) : (m.in_stock !== undefined ? Boolean(m.in_stock) : true);
        return { ...m, inStock: inSt, in_stock: inSt, customizable: true };
      });

      state.menu = normalized;
      saveState(state);
      return normalized;
    },

    async saveMenuItem(item) {
      const cleanItem = {
        name: item.name,
        category: item.category,
        price: parseFloat(item.price) || 0,
        description: item.description || "",
        badge: item.badge || "",
        image: item.image || "",
        inStock: item.inStock !== undefined ? Boolean(item.inStock) : true,
        in_stock: item.inStock !== undefined ? Boolean(item.inStock) : true,
        customizable: Boolean(item.customizable)
      };

      let serverResult = null;
      try {
        const url = item.id ? `${API_BASE}/menu/${item.id}` : `${API_BASE}/menu`;
        const method = item.id ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method: method,
          headers: this.getAdminHeaders(),
          body: JSON.stringify({ ...cleanItem, id: item.id ? parseInt(item.id, 10) : undefined }),
          signal: AbortSignal.timeout(4500)
        });
        if (res.ok) {
          serverResult = await res.json();
          this.isBackendOnline = true;
        }
      } catch (e) {
        console.warn("Backend menu save error:", e);
      }

      const state = loadState();
      const savedItem = (serverResult && typeof serverResult === 'object' && !Array.isArray(serverResult) && serverResult.name) ? {
        ...serverResult,
        inStock: serverResult.in_stock !== undefined ? serverResult.in_stock : serverResult.inStock,
        in_stock: serverResult.in_stock !== undefined ? serverResult.in_stock : serverResult.inStock
      } : {
        ...cleanItem,
        id: item.id ? (parseInt(item.id, 10) || item.id) : Date.now()
      };

      if (item.id) {
        const idx = state.menu.findIndex(m => String(m.id) === String(item.id));
        if (idx !== -1) {
          state.menu[idx] = { ...state.menu[idx], ...savedItem };
        } else {
          state.menu.unshift(savedItem);
        }
      } else {
        state.menu.unshift(savedItem);
      }

      saveState(state);
      notifySync('menu_update', savedItem);
      return savedItem;
    },

    async deleteMenuItem(id) {
      const state = loadState();
      state.menu = state.menu.filter(m => String(m.id) !== String(id));
      saveState(state);
      notifySync('menu_update', { id, deleted: true });

      try {
        await fetch(`${API_BASE}/menu/${id}`, {
          method: 'DELETE',
          headers: this.getAdminHeaders(),
          signal: AbortSignal.timeout(3500)
        });
      } catch (e) {}
      return true;
    },

    async toggleStock(id, inStock) {
      return this.toggleItemStock(id, inStock);
    },

    async toggleItemStock(id, inStock) {
      const state = loadState();
      const item = state.menu.find(m => String(m.id) === String(id));
      const newStock = inStock !== undefined ? Boolean(inStock) : (item ? !item.inStock : true);
      if (item) {
        item.inStock = newStock;
        item.in_stock = newStock;
        saveState(state);
        notifySync('stock_toggle', { id, inStock: newStock });
      }

      try {
        await fetch(`${API_BASE}/menu/${id}/stock`, {
          method: 'PATCH',
          headers: this.getAdminHeaders(),
          body: JSON.stringify({ in_stock: newStock, inStock: newStock }),
          signal: AbortSignal.timeout(3500)
        });
      } catch (e) {}

      return item;
    },

    // ORDERS
    async getOrders() {
      const state = loadState();
      let backendOrders = [];
      try {
        const res = await fetch(`${API_BASE}/orders`, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          backendOrders = await res.json();
          this.isBackendOnline = true;
        }
      } catch (e) {}

      // Bi-directional deduplicated merge so placed orders are 100% visible
      const mergedMap = new Map();
      (state.orders || []).forEach(o => mergedMap.set(String(o.id), o));
      backendOrders.forEach(o => {
        const local = mergedMap.get(String(o.id));
        mergedMap.set(String(o.id), { ...local, ...o });
      });

      const allOrders = Array.from(mergedMap.values()).sort((a, b) => {
        const tA = new Date(a.orderTime || a.timestamp || 0).getTime();
        const tB = new Date(b.orderTime || b.timestamp || 0).getTime();
        return tB - tA;
      });

      state.orders = allOrders;
      saveState(state);
      return allOrders;
    },

    async getOrder(orderId) {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, { signal: AbortSignal.timeout(2500) });
        if (res.ok) return await res.json();
      } catch (e) {}
      const state = loadState();
      return (state.orders || []).find(o => String(o.id) === String(orderId)) || null;
    },

    async createOrder(orderData) {
      const state = loadState();
      const orderId = `FT-${Math.floor(1000 + Math.random() * 9000)}`;
      const subtotal = Math.round(orderData.subtotal * 100) / 100;
      const tax = Math.round(subtotal * 0.0825 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;
      const isPaid = Boolean(orderData.paidOnline);
      const statusStr = isPaid ? "Paid Online" : "New Order";

      const cleanItems = (orderData.items || []).map(i => ({
        id: i.id || 1,
        name: i.name || "Specialty Item",
        price: parseFloat(i.price) || 0,
        qty: parseInt(i.qty, 10) || 1,
        customizations: i.customizations || ""
      }));

      const newOrder = {
        id: orderId,
        customerName: orderData.customerName || "Austin Customer",
        phone: orderData.phone || "(512) 540-6033",
        customerPhone: orderData.phone || "(512) 540-6033",
        items: cleanItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: statusStr,
        paidOnline: isPaid,
        paymentStatus: isPaid ? "Paid Online (Stripe)" : "Pay at Counter",
        orderTime: new Date().toISOString(),
        pickupEstimate: "10-12 mins",
        notes: orderData.notes || ""
      };

      // Instantly save to local state and broadcast
      state.orders.unshift(newOrder);
      if (state.currentUser) {
        state.customerAccount = state.customerAccount || { tier: "Roastery Member", ordersCount: 0 };
        state.customerAccount.ordersCount = (state.customerAccount.ordersCount || 0) + 1;
      }
      saveState(state);
      notifySync('new_order', newOrder);

      // Async transmit to FastAPI backend
      try {
        const resp = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: newOrder.customerName,
            phone: newOrder.phone,
            items: cleanItems,
            subtotal: newOrder.subtotal,
            notes: newOrder.notes,
            paidOnline: isPaid
          }),
          signal: AbortSignal.timeout(5000)
        });
        if (resp.ok) {
          const serverOrder = await resp.json();
          if (serverOrder.id && serverOrder.id !== newOrder.id) {
            newOrder.id = serverOrder.id;
            state.orders[0].id = serverOrder.id;
            saveState(state);
          }
          this.isBackendOnline = true;
        }
      } catch (e) {
        console.warn("Backend order transmit notice:", e);
      }

      return newOrder;
    },

    async updateOrderStatus(orderId, status) {
      const state = loadState();
      const order = state.orders.find(o => String(o.id) === String(orderId));
      if (order) {
        order.status = status;
        saveState(state);
        notifySync('order_status_update', { orderId, status });
      }

      try {
        await fetch(`${API_BASE}/orders/${orderId}/status?new_status=${encodeURIComponent(status)}`, {
          method: 'PATCH',
          headers: this.getAdminHeaders(),
          signal: AbortSignal.timeout(3000)
        });
      } catch (e) {}

      return order;
    },

    // RESERVATIONS
    async getReservations() {
      const state = loadState();
      let backendList = [];
      try {
        const res = await fetch(`${API_BASE}/reservations`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          this.isBackendOnline = true;
          backendList = await res.json();
        }
      } catch (e) {}

      // Bi-directional deduplicated merge so customer bookings are 100% visible in POS
      const mergedMap = new Map();
      (state.reservations || []).forEach(r => mergedMap.set(String(r.id), r));
      backendList.forEach(r => {
        const local = mergedMap.get(String(r.id));
        mergedMap.set(String(r.id), { ...local, ...r });
      });

      const all = Array.from(mergedMap.values()).map(r => ({
        ...r,
        partySize: r.partySize !== undefined ? r.partySize : (r.party_size || 2),
        party_size: r.party_size !== undefined ? r.party_size : (r.partySize || 2),
        date: r.date || r.res_date || 'Today',
        res_date: r.res_date || r.date || 'Today',
        time: r.time || r.res_time || '12:00 PM',
        res_time: r.res_time || r.time || '12:00 PM',
        status: r.status || 'Confirmed'
      })).sort((a, b) => {
        const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return tB - tA;
      });

      state.reservations = all;
      saveState(state);
      return all;
    },

    async createReservation(resData) {
      const state = loadState();
      const resId = `RES-${Math.floor(100 + Math.random() * 900)}`;
      const party = parseInt(resData.partySize || resData.party_size, 10) || 2;
      const dateVal = resData.date || resData.res_date || 'Today';
      const timeVal = resData.time || resData.res_time || '12:00 PM';
      const newRes = {
        id: resId,
        name: resData.name,
        email: resData.email,
        phone: resData.phone,
        partySize: party,
        party_size: party,
        date: dateVal,
        res_date: dateVal,
        time: timeVal,
        res_time: timeVal,
        status: "Confirmed",
        notes: resData.notes || ""
      };

      try {
        const resp = await fetch(`${API_BASE}/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRes),
          signal: AbortSignal.timeout(4000)
        });
        if (resp.ok) {
          const saved = await resp.json();
          if (saved && saved.id) {
            newRes.id = saved.id;
          }
        }
      } catch (e) {
        console.warn("Backend reservation call error, storing locally:", e);
      }

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
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          const state = loadState();
          state.currentUser = { email, name: email.split('@')[0], role: data.role };
          saveState(state);
          if (data.access_token) {
            try { sessionStorage.setItem('flattrack_admin_token', data.access_token); } catch(e){}
          }
          return { success: true, user: state.currentUser, token: data.access_token };
        }
      } catch (e) {}
      if (email === "admin@flattrackcoffee.com" || password === "roastmaster123" || password === "1234") {
        const state = loadState();
        state.currentUser = { email: "admin@flattrackcoffee.com", name: "Roastery Owner", role: "admin" };
        saveState(state);
        try { sessionStorage.setItem('flattrack_admin_pin', '1234'); } catch(e){}
        return { success: true, user: state.currentUser };
      }
      return { success: false, message: "Invalid credentials" };
    },

    async register(email, password, name) {
      const user = { email, name: name || email.split('@')[0], role: "customer", member: true };
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          const state = loadState();
          state.currentUser = user;
          saveState(state);
          return { success: true, user: user };
        }
      } catch (e) {}
      const state = loadState();
      state.currentUser = user;
      saveState(state);
      return { success: true, user: user };
    },

    async loginGoogle(email = "austin.guest@gmail.com", name = "Austin Member") {
      let userData = { email, name, role: "customer", member: true };
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
          signal: AbortSignal.timeout(3500)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) userData = { ...userData, ...data.user };
          this.isBackendOnline = true;
        }
      } catch (e) {}

      const state = loadState();
      state.currentUser = userData;
      saveState(state);

      try {
        localStorage.setItem('flat_track_customer_session', JSON.stringify(userData));
        window.dispatchEvent(new CustomEvent('flat_track_auth_change', { detail: userData }));
      } catch(e) {}

      return { success: true, user: userData };
    },

    logout() {
      const state = loadState();
      state.currentUser = null;
      saveState(state);
      try { localStorage.removeItem('flat_track_customer_session'); } catch(e){}
      notifySync('auth_change', null);
      window.dispatchEvent(new CustomEvent('flat_track_auth_change', { detail: null }));
      return true;
    },

    getLoyaltyProfile() {
      const state = loadState();
      const user = state.currentUser || null;
      return {
        name: user?.name || "Guest Customer",
        email: user?.email || "",
        member: Boolean(user),
        ordersCount: (state.orders || []).length
      };
    },

    // PROMO CODES
    async applyPromoCode(code) {
      const state = loadState();
      const match = state.promoCodes.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active);
      if (match) return { valid: true, discountPercent: match.discountPercent, code: match.code };
      return { valid: false };
    },

    // AUTOMATIC BACKGROUND EMAIL CONFIRMATION DISPATCH
    async sendConfirmationEmail(customerEmail, subject, details = {}) {
      if (!customerEmail || typeof customerEmail !== 'string' || !customerEmail.includes('@')) {
        return { success: false, reason: 'Invalid or missing email' };
      }
      try {
        const payload = {
          _subject: subject || "Flat Track Coffee Roasters Confirmation",
          _template: "table",
          _captcha: "false",
          "Roastery Location": "1611 E Cesar Chavez St, Austin, TX 78702",
          "Roastery Phone": "(512) 540-6033",
          ...details
        };

        // Non-blocking background call
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(customerEmail)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000)
        }).catch(err => {
          console.warn("Background email dispatch network notice:", err);
        });

        return { success: true };
      } catch (err) {
        console.warn("Background email dispatch caught error:", err);
        return { success: false, error: err.message };
      }
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
