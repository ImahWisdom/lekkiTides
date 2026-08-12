# Lekki Tides

A shortlet villa + boat rental booking platform for Lekki, Lagos. Guest-facing site, owner dashboard, and API in one project.

```
lekki-tides/
├── backend/     Node.js + Express + TypeScript + MongoDB API
└── frontend/    React + Vite + Tailwind site (guest pages + owner dashboard)
```

## What's actually built

**Guest-facing**
- Live availability calendar, instant quote, dynamic pricing (weekday/weekend, boat peak surcharge, extra-guest fees, add-ons)
- Real Paystack payment (deposit now, balance later) with signature-verified webhook
- Confirmation email on successful payment (via Resend)
- Mobile-first layout with a sticky "Book now" bar
- Google Maps embed on the property/booking pages
- WhatsApp click-to-chat floating button
- Terms of Service, Privacy Policy, Cancellation & Refund Policy pages
- Basic SEO: meta tags, Open Graph tags, LodgingBusiness schema markup, `robots.txt`, `sitemap.xml`

**Owner-facing**
- Bookings list with filters (status, property type) and search
- Cancel a booking (frees the dates immediately)
- Analytics: revenue by month, occupancy %, booking source breakdown, upcoming check-ins
- Locked behind a shared admin key (placeholder — see "Not built yet" below)

**Backend guarantees**
- No double-bookings: an availability check runs inside a MongoDB transaction before every booking is created
- Prices are always recomputed server-side — the frontend's live price is just for guest feedback, never trusted for the actual charge

## Not built yet (be honest with yourself about these before launch)

- **Real owner login + 2FA** — currently a single shared key (`ADMIN_API_KEY`) in an env var, not real accounts or sessions
- **Two-way calendar sync with Airbnb/Booking.com** — the data model has a slot for iCal feed URLs, nothing pulls/pushes them yet
- **WhatsApp automation** (auto "payment received" / "check-in tomorrow" messages) — the click-to-chat button is real, but automated messages need WhatsApp Business API approval from Meta first
- **PDF invoice generator** — receipts currently only exist as the confirmation email
- **Real property photography** — the homepage uses icon placeholders where photos go (marked with `DEV NOTE` comments in `HomePage.jsx`)
- **Real reviews** — the testimonials section has placeholder quotes (also marked with `DEV NOTE` comments)

---

## What you need to get, and where to plug it in

| # | What | Where to get it | Where it goes |
|---|---|---|---|
| 1 | MongoDB Atlas connection string | You already have a cluster pattern from NaijaStyle Atelier — create a new cluster/database the same way at [mongodb.com/atlas](https://mongodb.com/atlas) | `backend/.env` → `MONGODB_URI` |
| 2 | Paystack test keys | Sign up at [paystack.com](https://paystack.com), grab test keys from the dashboard while building | `backend/.env` → `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` |
| 3 | Resend API key + verified sending domain | Sign up at [resend.com](https://resend.com) (same provider as NaijaStyle Atelier), verify a domain you own | `backend/.env` → `RESEND_API_KEY`, `EMAIL_FROM` |
| 4 | An admin key | Make one up — any long random string | `backend/.env` → `ADMIN_API_KEY`, and enter the same value on the dashboard's unlock screen |
| 5 | Google Maps API key (Maps Embed API) | [console.cloud.google.com](https://console.cloud.google.com) — you were already walked through these exact steps | `frontend/.env` → `VITE_GOOGLE_MAPS_API_KEY` |
| 6 | A WhatsApp number | Your own business number, in international format with no `+` (e.g. `2348012345678`) | `frontend/.env` → `VITE_WHATSAPP_NUMBER` |
| 7 | A domain name | Any registrar (Namecheap, Whogohost, etc.) | Point it at wherever you deploy the frontend |
| 8 | Hosting for the backend | Render, Railway, or similar — needs to support Node.js + long-lived processes (not a static host) | Deploy `backend/`, copy the resulting URL into `frontend/.env` → `VITE_API_BASE` |
| 9 | Hosting for the frontend | Vercel, Netlify, or similar static host | Deploy `frontend/`, point your domain at it |
| 10 | SSL/HTTPS | Automatic on virtually every host above — nothing to buy | — |

## Running it locally

```bash
# Backend
cd backend
npm install
cp .env.example .env      # fill in the values from the table above
npm run seed                # creates the 2 demo properties
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env       # fill in the values from the table above
npm run dev                  # http://localhost:5173
```

Visit `http://localhost:5173` — the homepage, both booking flows, and `/owner` all work end to end once both are running and `.env` is filled in. Paystack's test mode lets you complete a full payment with a dummy card before any real money is involved.

## Before you actually launch (checklist)

- [ ] Replace placeholder photos on the homepage with real photography
- [ ] Replace placeholder testimonials once you have real reviews
- [ ] Have a Nigeria-qualified lawyer review the Terms, Privacy, and Cancellation pages — they're a solid starting draft, not legal sign-off
- [ ] Switch Paystack from test keys to live keys (and re-test the whole flow once with a small real payment)
- [ ] Replace the shared admin key with real owner login before anyone but you uses the dashboard
- [ ] Set up MongoDB Atlas automated backups (a config toggle in Atlas, not code)
- [ ] Buy the domain and connect it to both the frontend and backend hosts
