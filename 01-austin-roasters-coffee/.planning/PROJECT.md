# Flat Track Coffee Roasters — 3-Tier Web Suite Rebuild

## Vision & Mandate
Rebuild the three-tier hospitality website suite for **Flat Track Coffee Roasters** (1611 E Cesar Chavez St, Austin, TX 78702) into an agency-grade, visually magnetic, high-converting digital platform.

The suite showcases three distinct commercial tiers:
1. **Tier 1 ($497 / $500):** Single-page editorial digital storefront.
2. **Tier 2 ($997 / $1,500):** Multi-page customer operations hub + isolated Owner Admin portal with 0% commission direct ordering, real-time table booking, and live kitchen dispatch.
3. **Tier 3 ($1,997 / $2,000):** Enterprise flagship suite featuring cinematic scroll animations, bean subscriptions, B2B catering quote engine, live order tracking stepper, customer loyalty accounts, Stripe test checkout, PDF tax receipts, and tablet KDS + BI analytics.

Plus:
- **Standalone Agency Sales Demo Hub (`index.html`)**: Complete with tier comparison matrix, ROI payback calculator, and 2-minute client pitch script.
- **Floating `✨ Demo Controls` Pill**: In bottom-left corner with quick switching between tiers and admin portals, plus a `[Hide]` toggle for client presentations.
- **Dual-Mode Data Layer (`shared/api-client.js`)**: Real FastAPI backend support (`/backend`) + automatic zero-fail static GitHub Pages fallback using IndexedDB/localStorage and `BroadcastChannel` real-time multi-tab synchronization.

## Tech Stack Boundaries
- **Frontend Core:** Modern HTML5, CSS Custom Properties, Vanilla ES6+ JavaScript.
- **Design System:** Deep Espresso Roast (`#0b0908`), Warm Charcoal (`#151210`), Glass (`rgba(21, 18, 16, 0.78)` + blur 16px), Warm Cream (`#f5f2eb`), Toasted Oat (`#a8a096`), Burnished Gold (`#c9a84c`).
- **Typography:** Playfair Display / Fraunces (Headings), Plus Jakarta Sans / Inter (Body), JetBrains Mono (Prices, numbers, tabular data).
- **Animations:** High-performance CSS scroll-driven animations + IntersectionObserver / GSAP, respecting `prefers-reduced-motion`.
- **Backend:** Python FastAPI, Pydantic, SQLite (demo) / PostgreSQL (production), JWT auth, Argon2 password hashing.
- **Persistence:** Dual-mode API client with GitHub Pages fallback (`BroadcastChannel('flat_track_live_sync')` + IndexedDB/localStorage).
