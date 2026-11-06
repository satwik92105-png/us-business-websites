# Flat Track Coffee Roasters — Three-Tier Hospitality Platform & Sales Showcase

**Client Target:** Flat Track Coffee Roasters  
**Location:** 1611 E Cesar Chavez St, Austin, TX 78702  
**Phone:** (512) 540-6033  
**Live GitHub Pages Demo:** [https://satwik92105-png.github.io/01-austin-roasters-coffee/](https://satwik92105-png.github.io/01-austin-roasters-coffee/)

---

## 🌟 Executive Overview & Commercial Architecture

This repository contains the complete, agency-grade digital platform for **Flat Track Coffee Roasters**, engineered to demonstrate a seamless progression across three distinct commercial tiers:

- **Agency Sales Demo Hub (`index.html`):** Package comparison matrix, ROI payback calculator, and 2-minute word-for-word client closing script.
- **Tier 1 ($497 / $500 one-time):** Single-page luxury editorial storefront (`tier1/index.html`). Includes live Austin CST/CDT open/closed indicator, interactive menu showcase tabs (view-only), roastery craft narrative, working Weekend Pass voucher claim, and Google Maps embed for 1611 E Cesar Chavez St.
- **Tier 2 ($997 / $1,500 one-time):** Multi-page operations hub (`tier2/`) with 0% commission mobile pickup ordering, drink customization modal, table reservation engine (future time slots only), exact 2-decimal rounded tax calculation, and an **Isolated Owner Admin POS Portal** (`tier2/admin.html`) with live multi-tab synchronization via `BroadcastChannel`.
- **Tier 3 ($1,997 / $2,000 one-time):** Flagship enterprise suite (`tier3/`) featuring cinematic scroll animations (parallax hero, ambient steam glow, scroll-linked "Seed to Cup" 4-stage interactive timeline, animated counters), recurring bean subscriptions (`tier3/subscribe.html`), B2B espresso cart & wholesale quote calculator (`tier3/catering.html`), live order tracking stepper (`tier3/track.html`), tablet-ready Kitchen Display Screen (`tier3/kitchen.html`), and Owner BI Analytics (`tier3/admin.html`).

---

## 📁 Modular Project Structure

```text
01-austin-roasters-coffee/
├── index.html                   # Agency Sales Demo Hub & 2-Min Pitch Script
├── tier1.html                   # Backward-compatible redirect to tier1/index.html
├── tier2.html                   # Backward-compatible redirect to tier2/index.html
├── tier3.html                   # Backward-compatible redirect to tier3/index.html
├── owner.html                   # Backward-compatible redirect to tier2/admin.html
├── tier1/
│   └── index.html               # Tier 1 Single-Page Editorial Storefront
├── tier2/
│   ├── index.html               # Tier 2 Home & Featured Coffees
│   ├── menu.html                # Tier 2 Order Ahead & Customization Modal
│   ├── reserve.html             # Tier 2 Table Reservation Engine
│   ├── story.html               # Tier 2 Roastery Craft & Heritage
│   ├── contact.html             # Tier 2 Contact & Google Maps Directions
│   └── admin.html               # Tier 2 Isolated Owner Admin POS Terminal
├── tier3/
│   ├── index.html               # Tier 3 Flagship Hero & Scroll Animations
│   ├── menu.html                # Tier 3 Order Ahead with Roast Points
│   ├── subscribe.html           # Tier 3 3-Step Bean Subscription Engine
│   ├── catering.html            # Tier 3 B2B Espresso Cart Quote Calculator
│   ├── track.html               # Tier 3 Live Counter Stepper & Rewards
│   ├── reserve.html             # Tier 3 Table Reservation Engine
│   ├── story.html               # Tier 3 Sourcing & Roastery Story
│   ├── contact.html             # Tier 3 Visit & Contact
│   ├── admin.html               # Tier 3 Owner BI & Sales Analytics
│   └── kitchen.html             # Tier 3 Tablet Barista KDS Screen
├── shared/
│   ├── styles.css               # Design System: Deep Roastery tokens & Z-Index scale
│   ├── api-client.js            # Dual-Mode Data Layer (FastAPI + BroadcastChannel fallback)
│   └── components.js            # Demo Controls Pill, Cart Drawer, Toasts, PDF Receipts
└── backend/
    ├── requirements.txt         # FastAPI, Uvicorn, SQLAlchemy, PyJWT
    ├── database.py              # SQLite / PostgreSQL Session configuration
    ├── models.py                # Database entities (Menu, Orders, Bookings, Users)
    ├── schemas.py               # Pydantic validation schemas
    ├── auth.py                  # JWT creation & strict require_admin role check
    ├── main.py                  # REST API endpoints & CORS middleware
    ├── test_security.py         # Automated test suite (enforcing 401/403)
    └── run_tests.py             # Test runner
```

---

## 🔐 Demo Owner Credentials

To access the isolated Owner Management Terminal (`tier2/admin.html`) or Owner BI (`tier3/admin.html`):
- **Email:** `admin@flattrackcoffee.com`
- **Password / PIN:** `roastmaster123` or `1234`
*(Note: These credentials are intentionally kept out of the public customer HTML).*

---

## 🚀 Dual-Mode Architecture & Deployment

### 1. Zero-Fail Static Demo (GitHub Pages)
The client frontend functions autonomously without requiring any external server:
- All CRUD modifications (adding items, changing prices, toggling stock to Sold Out, advancing order tickets) persist in browser storage.
- Multi-tab synchronization is powered by the HTML5 `BroadcastChannel('flat_track_live_sync')` API. If you open `tier2/menu.html` in one tab and `tier2/admin.html` in another, changing an item's status in Admin instantly reflects on the Customer Menu without a page reload.

### 2. Production Python FastAPI Backend (`backend/`)
For full production deployment (e.g. Render, Railway, Fly.io):
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch local API server
python main.py
# Server runs at http://localhost:8000 (API docs at http://localhost:8000/docs)

# 4. Execute automated security tests
python run_tests.py
```

---

## ✅ End-to-End Verification Checklist

| Area | Feature | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Global UI** | Dev Telemetry Tickers | **REMOVED** | Top technical PID/gateway tickers deleted. |
| **Global UI** | Unverified Boasts | **REMOVED** | Removed fake speed & tier claims from cafe headers. |
| **Global UI** | Floating Demo Controls | **ACTIVE** | `✨ Demo Controls` pill with tier switcher & `[Hide]` toggle. |
| **Global UI** | Z-Index Scale | **VERIFIED** | Strict scale (Base 1, Nav 1000, Cart 7000, Drawer 8000, Modal 9000, Toast 9999). |
| **Global UI** | Google Maps | **FIXED** | Real iframe embed for 1611 E Cesar Chavez St + working Get Directions. |
| **Tier 1** | Single-Page Editorial | **VERIFIED** | Live Austin CST badge, menu tabs, Weekend Pass modal, contact form. |
| **Tier 2** | Multi-Page Architecture | **VERIFIED** | True multi-page site (`index`, `menu`, `reserve`, `story`, `contact`). |
| **Tier 2** | Dynamic Menu & Cart | **VERIFIED** | Dynamic rendering, drink customization modal, exact 2-decimal tax. |
| **Tier 2** | Reservations | **VERIFIED** | Future time slots only, saves booking to database/state. |
| **Tier 2** | Isolated Owner Admin | **VERIFIED** | Auth-gated, full CRUD menu manager, 1-click stock toggle, live order queue. |
| **Tier 3** | Bean Rush Mini-Game | **REMOVED** | 100% eliminated from all pages and assets. |
| **Tier 3** | Cinematic Animations | **VERIFIED** | Parallax hero, steam glow, staggered reveals, Seed-to-Cup timeline. |
| **Tier 3** | Subscriptions | **VERIFIED** | 3-step live price calculator (Roast -> Grind -> Frequency). |
| **Tier 3** | B2B Catering Quote | **VERIFIED** | Dynamic event calculator for mobile espresso bars and cold brew kegs. |
| **Tier 3** | Live Order Tracker | **VERIFIED** | Real-time sync with KDS stepper (Paid -> Brewing -> Ready -> Enjoyed). |
| **Tier 3** | Tablet KDS & BI | **VERIFIED** | High-contrast KDS with audio chimes and 1-tap status bumps; BI charts & CSV export. |
| **Backend** | Role Security | **VERIFIED** | 401/403 enforced on all unauthorized write endpoints; 6/6 tests passing. |
