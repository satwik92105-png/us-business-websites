# Functional & Non-Functional Requirements

## Part 1: Visual Design, Aesthetics & Micro-Interactions
- [ ] Remove dev telemetry ticker (`ROASTER PID...`, `PAYMENT GATEWAY...`, etc.).
- [ ] Remove unverified tech boasts (`<0.5s Ultra-Fast`, `Verified 256-bit SSL`, tier labels in cafe headers).
- [ ] Strict 8px spacing system, balanced padding, consistent border radii.
- [ ] Expressive curated emojis (☕, 🥐, 🔥, ✨, 🛒, ⭐, 🎁, 📍, ⚡) + clean SVG icons.
- [ ] Roastery color system with CSS variables:
  - `--bg-primary: #0b0908`
  - `--bg-elevated: #151210`
  - `--bg-glass: rgba(21, 18, 16, 0.78)`
  - `--border-gold-subtle: rgba(201, 168, 76, 0.18)`
  - `--text-primary: #f5f2eb`
  - `--text-secondary: #a8a096`
  - `--accent-gold: #c9a84c`
- [ ] Typography: Playfair Display / Fraunces, Plus Jakarta Sans, JetBrains Mono.
- [ ] Tactile micro-interactions (card lift `-4px`, slow image zoom `scale(1.04)`, button sheen sweep, press `scale(0.98)`).
- [ ] Strict Z-index scale: Base (1), Sticky Nav (1000), Floating Cart (7000, hidden when drawer/modal open), Cart Drawer (8000), Modals (9000), Toasts & Demo Pill (9999).
- [ ] Tier 3 Cinematic Scroll Animations:
  - Parallax Hero & ambient steam/warmth effect.
  - Staggered section reveals (`opacity: 0 -> 1`, `translateY: 28px -> 0`).
  - Interactive "Seed to Cup" progress timeline (4 roasting stages with scroll-linked golden vertical line).
  - Animated number counters & reward celebration shimmer/confetti.

## Part 2: Bug Fixes & Architecture Across Tiers
- [ ] Move tier switcher to dedicated Agency Demo Hub (`index.html`) + floating `✨ Demo Controls` pill (with `[Hide]` toggle).
- [ ] Fix Google Maps embed for 1611 E Cesar Chavez St, Austin, TX 78702 + real "Get Directions" link.
- [ ] Fix reviews honesty: "Sample Customer Reviews (Demo Concept) · Website Concept Demo · © 2026".
- [ ] Fix phone repetition: (512) 540-6033 strictly in Header CTA, Footer, and Contact page.
- [ ] Tier 1 (`tier1/index.html`): Single-page editorial showcase, Austin time open/closed badge, interactive menu tabs (view-only), real form submissions with validation and toasts.
- [ ] Tier 2 (`tier2/` multi-page):
  - Fix browser permission popup bug.
  - Multi-page structure: `index.html`, `menu.html`, `reserve.html`, `story.html`, `contact.html`.
  - Dynamic menu rendering from state/API.
  - Reservation engine with future time slots only, saving to backend.
  - Cart drawer: exact 2-decimal tax (`Math.round(subtotal * 0.0825 * 100) / 100`), unique Order ID, real-time dispatch to Owner Admin.
  - Isolated Owner Admin (`tier2/admin.html`): noindex, email/pass login, CRUD Menu Manager, Live Orders Queue with status stepper (New->Prep->Ready->Picked Up) + audio chime, Table Reservations Manager, Messages Inbox & Settings.
- [ ] Tier 3 (`tier3/` enterprise suite):
  - 100% remove "Bean Rush" mini-game.
  - Remove broken Owner POS links from customer pages.
  - Includes all Tier 2 pages + `subscribe.html` (3-step bean subscription builder), `catering.html` (wholesale & espresso cart quote calculator), `track.html` (live order tracker synced to KDS).
  - Demo Sign-in / Google Auth, Order History, 1-Click Reorder, Loyalty Points & Rewards (🎁), Promo Codes.
  - Payment & Invoicing: Remove raw CC inputs, Stripe Checkout test redirect, branded downloadable PDF Tax Receipt with QR code.
  - Owner BI & KDS (`tier3/admin.html` & `tier3/kitchen.html`): KDS screen with ticket timers and status bump buttons, BI Analytics Dashboard with revenue charts, top items, rush hours, CSV export.

## Part 3: Backend & Dual-Mode Data Layer
- [ ] `shared/api-client.js`: Seamless Dual-Mode client (FastAPI backend + GitHub Pages IndexedDB/localStorage fallback).
- [ ] Multi-tab real-time sync via `BroadcastChannel('flat_track_live_sync')`.
- [ ] Production Python backend (`backend/`): FastAPI, SQLite/PostgreSQL, Pydantic, password hashing, JWT auth, automated security tests.
