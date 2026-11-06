# Implementation Roadmap

- [ ] **Phase 1: Foundation & Shared Architecture**
  - Design system CSS tokens, typography, roastery dark aesthetic, Z-index scale.
  - Dual-mode data layer (`shared/api-client.js`) with IndexedDB/localStorage fallback & `BroadcastChannel` real-time sync.
  - Shared UI components: Toast manager, Floating `✨ Demo Controls` pill, Modal controller, Cart drawer logic, Austin CST open/closed utility.
  - Standalone Agency Sales Demo Hub (`index.html`) with package matrix, ROI breakdown, and pitch script.

- [ ] **Phase 2: Tier 1 Editorial Showcase (`tier1/index.html`)**
  - Single-page luxury roastery layout.
  - Live Austin open/closed indicator.
  - Interactive menu tabs with category emojis (view-only).
  - Story section, Weekend Pass modal/form with validation and toast.
  - Real Google Maps embed for 1611 E Cesar Chavez St and Get Directions button.
  - Contact form with real submission handler.

- [ ] **Phase 3: Tier 2 Multi-Page Operations Hub & Owner Admin (`tier2/`)**
  - Multi-page customer suite: `index.html`, `menu.html`, `reserve.html`, `story.html`, `contact.html`.
  - Dynamic menu rendered from state/API with search & category filters.
  - Drink customization modal (milks, sweetness, espresso shots).
  - Cart drawer with exact tax (`Math.round(subtotal * 0.0825 * 100) / 100`) and live order submission.
  - Reservation engine with future time slots only.
  - Isolated Owner Admin (`tier2/admin.html`): Auth login, Menu CRUD, Live Orders Queue (stepper + chime), Table Bookings, Inquiries, Store Settings.

- [ ] **Phase 4: Tier 3 Enterprise Suite & Cinematic Scroll Animations (`tier3/`)**
  - Cinematic scroll animations: Parallax hero, staggered reveals, scroll-linked "Seed to Cup" 4-stage timeline, number counters.
  - Pages: `index.html`, `menu.html`, `reserve.html`, `story.html`, `contact.html`, `subscribe.html` (3-step subscription engine), `catering.html` (quote calculator), `track.html` (live order tracker).
  - Customer Account & Loyalty: Auth/Demo login, 1-Click Reorder, Roast Points & Rewards, Promo codes.
  - Stripe Checkout test redirect & PDF Tax Invoice generator with QR code.
  - Tier 3 Owner BI & KDS: `tier3/admin.html` (BI analytics, sales charts, CSV export) & `tier3/kitchen.html` (tablet KDS with timers and bump buttons).

- [ ] **Phase 5: Python FastAPI Backend (`backend/`) & Automated Verification**
  - FastAPI app with SQLAlchemy, Pydantic, JWT auth, Argon2 password hashing.
  - CRUD endpoints for menu, orders, reservations, subscribers, contact messages.
  - Automated tests verifying role-based security (401/403 on admin mutations).
  - Root backward compatibility routers (`tier1.html`, `tier2.html`, `tier3.html`, `owner.html`).
  - Git sync and deployment verification.
