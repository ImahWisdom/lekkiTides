# Lekki Tides — booking API

Node.js + Express + TypeScript + MongoDB (Mongoose) backend for the shortlet + boat rental platform. Pairs with `BookingFlow.jsx` on the frontend.

## Setup

```bash
npm install
cp .env.example .env   # fill in MONGODB_URI (Atlas connection string)
npm run seed            # creates the 2 demo properties (villa + boat)
npm run dev              # starts the API on http://localhost:4000
```

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/api/properties?type=shortlet\|boat` | List active properties |
| GET | `/api/properties/:id` | Full pricing config for one property |
| GET | `/api/properties/:id/availability?from=&to=` | Blocked date ranges, for the calendar |
| POST | `/api/bookings` | Create a booking — price is computed server-side, never trusted from the client |
| GET | `/api/bookings/:ref` | Look up a booking by its reference (e.g. `LT-3F8K2Q`) |
| POST | `/api/bookings/:ref/cancel` | Cancel a booking (frees the dates) |
| POST | `/api/payments/:ref/initiate` | Starts a Paystack charge for the deposit or balance, returns `authorizationUrl` to redirect the guest to |
| POST | `/api/payments/:ref/verify` | `:ref` is the bookingRef. Fallback confirmation path — re-verifies whichever payment is still `initiated` directly against Paystack and applies it, exactly like the webhook does. The confirmation page calls this automatically if the webhook hasn't landed after ~12s, so a booking doesn't stay stuck on "pending" when the webhook can't reach this deployment (e.g. localhost, or a webhook URL that isn't configured in the Paystack dashboard yet) |
| POST | `/api/payments/paystack/webhook` | Paystack calls this on `charge.success` — signature-verified, then re-verified server-to-server before marking anything paid |
| GET | `/api/admin/bookings?status=&propertyType=&from=&to=` | List bookings, filterable — requires `x-admin-key` header |
| POST | `/api/admin/bookings/:ref/cancel` | Owner-side cancel — requires `x-admin-key` header |
| GET | `/api/admin/analytics` | Revenue by month, booking source breakdown, occupancy, upcoming check-ins — requires `x-admin-key` header |
| GET | `/api/admin/properties` | List every property (active + inactive), used by the dashboard's Photos tab — requires `x-admin-key` header |
| POST | `/api/admin/properties/:id/images` | Multipart upload (field name `images`, up to 10 files, 8MB each) — streams each file to Cloudinary and appends the resulting URL to that property's `images` array. Requires `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` in `.env` — requires `x-admin-key` header |
| DELETE | `/api/admin/properties/:id/images` | Body `{ "url": "<cloudinary url>" }` — removes that photo from the property — requires `x-admin-key` header |
| PUT | `/api/admin/properties/:id/images/reorder` | Body `{ "images": ["<url>", ...] }` — reorders existing photos (first = cover photo everywhere on the site) — requires `x-admin-key` header |

### Uploading property photos (no coding required)

1. Set the three `CLOUDINARY_*` variables in `.env` — you can reuse the same Cloudinary account/cloud name as NaijaStyle Atelier, or create a separate one.
2. Open `/owner`, unlock the dashboard, and go to the **Photos** tab.
3. Click **Add photos** under either property, pick one or more images, and they upload straight to Cloudinary. The first photo becomes that property's cover photo on the home page and booking page automatically — nothing else to wire up.

### Create a shortlet booking

```json
POST /api/bookings
{
  "propertyId": "<id from /api/properties>",
  "guest": { "name": "Wisdom A.", "email": "wisdom@example.com", "phone": "+2348012345678" },
  "guests": 4,
  "startDate": "2026-07-17",
  "endDate": "2026-07-19",
  "addOnIds": ["breakfast"]
}
```

### Create a boat booking

```json
POST /api/bookings
{
  "propertyId": "<id from /api/properties>",
  "guest": { "name": "Wisdom A.", "email": "wisdom@example.com", "phone": "+2348012345678" },
  "guests": 6,
  "date": "2026-07-18T16:00:00.000Z",
  "durationId": "sunset",
  "addOnIds": ["catering"]
}
```

## How double-bookings are actually prevented

Every booking — shortlet or boat — is normalized to a `startDateTime` / `endDateTime` pair. Before inserting a new booking, `services/availability.ts` runs an overlap query:

```
existing.startDateTime < newEndDateTime  AND  existing.endDateTime > newStartDateTime
```

The check-then-insert happens inside a MongoDB **transaction** (`withAvailabilityLock`), so if two guests try to book the same date at the same moment, only one transaction commits — the other gets a `409` with a clear message. This needs a replica-set deployment, which MongoDB Atlas gives you by default (including the free tier), so no extra setup is required beyond your existing Atlas cluster.

## Paying a booking (real Paystack flow)

1. `POST /api/bookings` creates the booking (`paymentStatus: "pending"`).
2. `POST /api/payments/:ref/initiate` with `{ "type": "deposit" }` — computes the deposit amount server-side, calls Paystack's `transaction/initialize`, stores a `payments` entry with `status: "initiated"`, and returns `authorizationUrl`.
3. Redirect the guest to `authorizationUrl` — that's Paystack's hosted checkout (card, bank transfer, USSD all live there, nothing custom to build).
4. Paystack sends a `charge.success` event to `/api/payments/paystack/webhook`. The handler:
   - Verifies `x-paystack-signature` (HMAC-SHA512 of the *raw* body) against your secret key — rejects anything unsigned or spoofed.
   - Re-verifies the transaction directly against Paystack's API (`transaction/verify/:reference`) rather than trusting the webhook payload alone.
   - Only then marks the matching `payments` entry `success` and flips `booking.paymentStatus` to `deposit_paid` (or `paid_in_full` for a balance payment).
5. Once `deposit_paid`, the same flow repeats with `{ "type": "balance" }` before check-in/departure.

Set `PAYSTACK_SECRET_KEY` to a **test** key while building — Paystack's test mode lets you complete the full flow with dummy card numbers before any real money moves.

## Two emails, two different moments

- **`POST /api/bookings`** sends a lightweight "here's your reference" email immediately, before any payment happens. This is the guest's only record if they close the tab before paying — the booking isn't confirmed yet, but they can find their way back to it via `/find-booking` or the link in this email.
- **A successful deposit payment** (webhook or the `/verify` fallback) sends the full confirmation email with the amount paid and balance due.

**If neither email is arriving:** check `RESEND_API_KEY` and `EMAIL_FROM` are actually set in `.env` (not just `.env.example`) — both `sendBookingReferenceEmail` and `sendBookingConfirmationEmail` silently skip and just log a warning if either is missing, so a booking still succeeds even with email misconfigured. If they *are* set and still nothing arrives, the next most likely cause is Resend's sandbox restriction: on a new Resend account with no verified sending domain, Resend will only actually deliver to the email address you signed up with — anything else fails silently server-side (check your Resend dashboard's Logs tab, not just your inbox). Verifying a domain in Resend removes that restriction.

## Why pricing is never trusted from the frontend

`BookingFlow.jsx` computes a live price so the guest sees instant feedback, but that number is cosmetic. `services/pricing.ts` recomputes the real price from the property's stored rates the moment `/api/bookings` is called — so no request can be tampered with in devtools to pay less than the real rate.

## Owner dashboard auth (read this before deploying)

`/api/admin/*` is protected by a single shared key (`ADMIN_API_KEY`), sent as the `x-admin-key` header. This stops random visitors from hitting owner endpoints, but it is **not** real authentication — there are no owner accounts, no sessions, no 2FA. Treat it as a placeholder. Before this goes live with a real owner logging in from a phone, swap it for real login (checklist item #24).

## Not built yet (flagged on purpose)

- Real owner login + 2FA (currently a shared-secret header, see above)
- Two-way calendar sync with Airbnb/Booking.com (the `externalCalendars` field on `Property` is there to hold iCal feed URLs once that's built)
- Guest comms automation (the "Payment received" WhatsApp/email trigger is marked with a `TODO` in `paymentController.ts`, right where it belongs once that service exists)

