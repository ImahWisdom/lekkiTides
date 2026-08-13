import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, Check, MapPin, ShieldCheck, Ticket, AlertTriangle, Wifi, WifiOff, ArrowLeft, ImageOff, Home, Anchor } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import MapEmbed from "../components/MapEmbed";
import PhotoGallery from "../components/PhotoGallery";
import { usePageMeta } from "../lib/usePageMeta";
import { API_BASE } from "../lib/api";

// ---------------------------------------------------------------------------
// Design tokens — "Lekki Tides" (placeholder brand for the shortlet + boat site)
// Palette: deep lagoon teal (surfaces/headers), warm sandbar (page bg),
// sunset amber (primary accent/CTA), coral (warnings), deep ink (text).
// Type: Fraunces (display) / Inter (body) / IBM Plex Mono (prices, refs).
// Signature element: the price summary renders as a dock ticket stub with
// a torn dashed edge before the total.
//
// This is the booking flow for ONE specific property (:type/:id) — there can
// be several shortlets or several boats, each with their own pricing and
// photos, browsed first from /book/:type (PropertyListingPage).
// API_BASE comes from VITE_API_BASE (see .env.example) via src/lib/api.js.
// ---------------------------------------------------------------------------

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');";

const money = (n) => "₦" + Math.round(n || 0).toLocaleString("en-NG");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MS_DAY = 86400000;
// "Today" for the date strip and availability window. This must be the
// actual current date — guests are booking real dates, not a fixed demo
// value. Zeroed to midnight so date comparisons (sameDay, weekend checks)
// stay consistent regardless of what time of day the page loads.
const ANCHOR = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function addDays(d, n) {
  return new Date(d.getTime() + n * MS_DAY);
}
function dayShort(d) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}
function isWeekendNight(d) {
  const dow = d.getDay();
  return dow === 5 || dow === 6;
}
function isPeakDay(d) {
  const dow = d.getDay();
  return dow === 0 || dow === 5 || dow === 6;
}
function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}
function fmtShort(d) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function StepLabel({ n, label }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0B3D3C] text-[#F7F0E2] text-[11px] font-semibold flex items-center justify-center"
        style={{ fontFamily: "IBM Plex Mono, monospace" }}
      >
        {n}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6455]">{label}</span>
    </div>
  );
}

// Used only if the API can't be reached, so the page still demos something.
const OFFLINE_BLOCKED_OFFSETS = new Set([3, 4, 11, 17, 18]);

const DATE_STRIP = Array.from({ length: 21 }, (_, i) => ({
  date: addDays(ANCHOR, i),
  offset: i,
}));

const FALLBACK_SHORTLET = {
  name: "3-Bed Waterfront Villa — Ikate, Lekki",
  weekdayRate: 85000,
  weekendRate: 120000,
  includedGuests: 4,
  maxGuests: 6,
  extraGuestFee: 5000,
  addOns: [
    { id: "early", label: "Early check-in (10am)", price: 15000, perNight: false },
    { id: "pickup", label: "Airport pickup", price: 20000, perNight: false },
    { id: "breakfast", label: "Daily breakfast", price: 10000, perNight: true },
  ],
  location: { address: "Ikate, Lekki, Lagos", lat: 6.4419, lng: 3.4736 },
};

const FALLBACK_BOAT = {
  name: "42ft Cruiser — Landmark Marina",
  capacity: 8,
  includedGuests: 6,
  extraGuestFee: 5000,
  durations: [
    { id: "2hr", label: "2 hr harbour run", hours: 2, price: 150000 },
    { id: "4hr", label: "4 hr island hop", hours: 4, price: 250000 },
    { id: "sunset", label: "Sunset cruise (3 hr)", hours: 3, price: 300000 },
  ],
  addOns: [
    { id: "fuel", label: "Extended fuel range", price: 25000, perNight: false },
    { id: "catering", label: "Onboard catering", price: 35000, perNight: false },
    { id: "photo", label: "Photographer", price: 40000, perNight: false },
  ],
  location: { address: "Landmark Marina, Victoria Island, Lagos", lat: 6.4304, lng: 3.4304 },
};

export default function BookingPage() {
  const { type, id } = useParams();
  const mode = type === "boat" ? "boat" : "shortlet";

  // --- live data from the backend ---
  const [apiProperty, setApiProperty] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking"); // 'checking' | 'connected' | 'offline' | 'not_found'
  const [blockedRanges, setBlockedRanges] = useState([]);

  // --- booking config the guest is building ---
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [boatDate, setBoatDate] = useState(null);
  const [duration, setDuration] = useState(null);
  const [guests, setGuests] = useState(2);
  const [addOnState, setAddOnState] = useState({});
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "", phone: "" });

  // --- checkout state ---
  const [bookingRef, setBookingRef] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [paying, setPaying] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Fetch this specific property from the real API on mount.
  useEffect(() => {
    let cancelled = false;
    setApiStatus("checking");
    fetch(`${API_BASE}/api/properties/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("not_found");
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setApiProperty(data.property);
        setApiStatus("connected");
      })
      .catch((err) => {
        if (cancelled) return;
        setApiStatus(err.message === "not_found" ? "not_found" : "offline");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Normalize whichever property is active (live from the API, or the
  // fallback config when the API can't be reached) into one flat shape the
  // rest of the component reads.
  const property = useMemo(() => {
    if (apiProperty) {
      return mode === "shortlet"
        ? {
            id: apiProperty._id,
            name: apiProperty.name,
            weekdayRate: apiProperty.shortlet.weekdayRate,
            weekendRate: apiProperty.shortlet.weekendRate,
            includedGuests: apiProperty.shortlet.includedGuests,
            maxGuests: apiProperty.shortlet.maxGuests,
            extraGuestFee: apiProperty.shortlet.extraGuestFee,
            addOns: apiProperty.addOns,
            images: apiProperty.images ?? [],
            location: apiProperty.location,
          }
        : {
            id: apiProperty._id,
            name: apiProperty.name,
            capacity: apiProperty.boat.capacity,
            includedGuests: apiProperty.boat.includedGuests,
            extraGuestFee: apiProperty.boat.extraGuestFee,
            durations: apiProperty.boat.durations,
            addOns: apiProperty.addOns,
            images: apiProperty.images ?? [],
            location: apiProperty.location,
          };
    }
    const fallback = mode === "shortlet" ? FALLBACK_SHORTLET : FALLBACK_BOAT;
    return { id: null, images: [], ...fallback };
  }, [apiProperty, mode]);

  // Keep the selected boat duration valid once real durations load.
  useEffect(() => {
    if (mode === "boat" && duration && property.durations?.length) {
      const stillValid = property.durations.some((d) => d.id === duration);
      if (!stillValid) setDuration(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.durations, mode]);

  // Pull real blocked date ranges for the selected property from the API.
  useEffect(() => {
    if (apiStatus !== "connected" || !property.id) return;
    const from = ANCHOR;
    const to = addDays(ANCHOR, 21);
    fetch(`${API_BASE}/api/properties/${property.id}/availability?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => setBlockedRanges(data.blocked ?? []))
      .catch(() => setBlockedRanges([]));
  }, [apiStatus, property.id]);

  const dateStrip = useMemo(() => {
    return DATE_STRIP.map((d) => {
      let blocked;
      if (apiStatus === "connected") {
        blocked = blockedRanges.some((r) => d.date >= new Date(r.start) && d.date < new Date(r.end));
      } else {
        blocked = OFFLINE_BLOCKED_OFFSETS.has(d.offset);
      }
      return { ...d, blocked };
    });
  }, [blockedRanges, apiStatus]);

  const capacity = mode === "shortlet" ? property.maxGuests : property.capacity;
  const overCapacity = guests > capacity;

  function pickDate(d) {
    if (d.blocked) return;
    if (mode === "boat") {
      setBoatDate(d.date);
      return;
    }
    if (!start || (start && end)) {
      setStart(d.date);
      setEnd(null);
    } else if (d.date > start) {
      setEnd(d.date);
    } else {
      setStart(d.date);
      setEnd(null);
    }
  }

  const nights = useMemo(() => {
    if (!start || !end) return 0;
    return Math.round((end - start) / MS_DAY);
  }, [start, end]);

  const lineItems = useMemo(() => {
    const items = [];
    if (mode === "shortlet") {
      if (nights > 0) {
        let weekdayCount = 0;
        let weekendCount = 0;
        for (let i = 0; i < nights; i++) {
          const night = addDays(start, i);
          if (isWeekendNight(night)) weekendCount++;
          else weekdayCount++;
        }
        if (weekdayCount > 0)
          items.push({
            label: `${weekdayCount} weekday night${weekdayCount > 1 ? "s" : ""} × ${money(property.weekdayRate)}`,
            amount: weekdayCount * property.weekdayRate,
          });
        if (weekendCount > 0)
          items.push({
            label: `${weekendCount} weekend night${weekendCount > 1 ? "s" : ""} × ${money(property.weekendRate)}`,
            amount: weekendCount * property.weekendRate,
          });
        const extra = Math.max(0, guests - property.includedGuests);
        if (extra > 0 && !overCapacity)
          items.push({
            label: `${extra} extra guest${extra > 1 ? "s" : ""} × ${nights} night${nights > 1 ? "s" : ""}`,
            amount: extra * property.extraGuestFee * nights,
          });
      }
      (property.addOns ?? []).forEach((a) => {
        if (addOnState[a.id]) {
          const amount = a.perNight ? a.price * Math.max(nights, 1) : a.price;
          items.push({ label: a.label, amount });
        }
      });
    } else {
      if (boatDate && duration && property.durations?.length) {
        const chosen = property.durations.find((d) => d.id === duration);
        if (chosen) {
          const peak = isPeakDay(boatDate);
          const base = peak ? Math.round(chosen.price * 1.2) : chosen.price;
          items.push({
            label: `${chosen.label}${peak ? " (weekend rate)" : ""}`,
            amount: base,
          });
          const extra = Math.max(0, guests - property.includedGuests);
          if (extra > 0 && !overCapacity)
            items.push({
              label: `${extra} extra passenger${extra > 1 ? "s" : ""}`,
              amount: extra * property.extraGuestFee,
            });
        }
      }
      (property.addOns ?? []).forEach((a) => {
        if (addOnState[a.id]) items.push({ label: a.label, amount: a.price });
      });
    }
    return items;
  }, [mode, nights, start, guests, addOnState, boatDate, duration, overCapacity, property]);

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const deposit = Math.round(subtotal * 0.5);
  const balance = subtotal - deposit;
  const hasSelection = mode === "shortlet" ? nights > 0 : !!boatDate && !!duration;
  const canPrice = hasSelection && !overCapacity && subtotal > 0;
  const emailTrimmed = guestInfo.email.trim();
  const emailLooksInvalid = emailTrimmed.length > 0 && !EMAIL_RE.test(emailTrimmed);
  const hasGuestInfo = guestInfo.name.trim() && emailTrimmed && !emailLooksInvalid && guestInfo.phone.trim();
  const readyToPay = canPrice && hasGuestInfo && !redirectUrl;

  const missingStepMessage = (() => {
    if (redirectUrl) return null;
    if (overCapacity) return mode === "shortlet" ? "Reduce your guest count to continue." : "Reduce your passenger count to continue.";
    if (!hasSelection) {
      if (mode === "shortlet") return "Pick a check-in and check-out date to continue.";
      if (!boatDate) return "Pick a cruise date to continue.";
      return "Pick a trip duration to continue.";
    }
    if (mode === "shortlet" && start && !end) return "Now pick a check-out date.";
    if (emailLooksInvalid) return "That email address doesn't look right — please double-check it.";
    if (!hasGuestInfo) return "Add your name, email and WhatsApp number to continue.";
    return null;
  })();

  function toggleAddOn(id) {
    setAddOnState((s) => ({ ...s, [id]: !s[id] }));
  }

  async function handlePay() {
    if (!readyToPay) return;
    setPaying(true);
    setApiError(null);

    try {
      if (!property.id) {
        throw new Error(
          `Can't reach the API at ${API_BASE}. This button calls POST /api/bookings then POST /api/payments/:ref/initiate on your backend — run it locally (npm run dev in /backend) or point API_BASE at your deployed URL.`
        );
      }

      const payload = {
        propertyId: property.id,
        guest: guestInfo,
        guests,
        addOnIds: Object.keys(addOnState).filter((id) => addOnState[id]),
      };
      if (mode === "shortlet") {
        payload.startDate = toISODate(start);
        payload.endDate = toISODate(end);
      } else {
        payload.date = boatDate.toISOString();
        payload.durationId = duration;
      }

      const bookingRes = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || "Could not create this booking.");
      setBookingRef(bookingData.booking.bookingRef);

      const payRes = await fetch(`${API_BASE}/api/payments/${bookingData.booking.bookingRef}/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "deposit" }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Could not start payment.");

      setRedirectUrl(payData.authorizationUrl);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setPaying(false);
    }
  }

  usePageMeta(
    apiProperty ? `Book ${apiProperty.name}` : mode === "shortlet" ? "Book a Shortlet Villa" : "Book a Boat Cruise",
    mode === "shortlet"
      ? "Check real availability and pay a secure deposit for this waterfront villa in Lekki."
      : "Check real availability and pay a secure deposit for this Lagos boat cruise."
  );

  if (apiStatus === "not_found") {
    return (
      <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full bg-[#F7F0E2] flex flex-col">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div style={{ fontFamily: "Fraunces, serif" }} className="text-xl font-semibold text-[#12262A] mb-2">
            We couldn't find that listing
          </div>
          <p className="text-sm text-[#6B6455] mb-4">It may have been removed or the link is out of date.</p>
          <Link to={`/book/${mode}`} className="text-sm font-semibold text-[#0B3D3C] underline">
            Browse {mode === "shortlet" ? "shortlet villas" : "boat cruises"} →
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full bg-[#F7F0E2] pb-28 lg:pb-10">
      <style>{FONT_IMPORT}</style>

      <Nav />
      <div className="bg-[#0F4C4A] text-[#B7D2CF] px-5 md:px-10 py-1.5 flex items-center justify-center gap-1.5 text-xs">
        {apiStatus === "connected" ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span>
          {apiStatus === "checking" && "Connecting to API…"}
          {apiStatus === "connected" && "Live · connected to booking API"}
          {apiStatus === "offline" && `Demo data · API at ${API_BASE} unreachable`}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6">
        <Link
          to={`/book/${mode}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6455] hover:text-[#0B3D3C] mb-4"
        >
          <ArrowLeft size={13} />
          {mode === "shortlet" ? "See other shortlet villas" : "See other boat cruises"}
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ---------------- LEFT: booking config ---------------- */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0B3D3C] mb-1">
            {mode === "shortlet" ? <Home size={13} /> : <Anchor size={13} />}
            {mode === "shortlet" ? "Shortlet villa" : "Boat cruise"}
          </div>
          <h1 style={{ fontFamily: "Fraunces, serif" }} className="text-2xl md:text-[28px] font-semibold text-[#12262A] mb-1">
            {property.name}
          </h1>
          {property.location?.address && (
            <div className="flex items-center gap-1.5 text-sm text-[#6B6455] mb-4">
              <MapPin size={14} />
              <span>{property.location.address}</span>
            </div>
          )}

          {property.images?.length > 0 ? (
            <PhotoGallery images={property.images} alt={property.name} className="mb-6" />
          ) : (
            <div className="mb-6 w-full aspect-[16/10] rounded-xl border border-[#E3DBC9] bg-[#EFE9DA] flex items-center justify-center text-[#B0A98F]">
              <ImageOff size={28} />
            </div>
          )}

          <MapEmbed
            address={property.location?.address ?? (mode === "shortlet" ? "Lekki, Lagos" : "Victoria Island, Lagos")}
            lat={property.location?.lat}
            lng={property.location?.lng}
            className="mb-6"
          />

          {/* Date strip */}
          <div className="mb-6">
            <StepLabel n={1} label={mode === "shortlet" ? "Select check-in, then check-out" : "Select cruise date"} />
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {dateStrip.map((d) => {
                const isStart = mode === "shortlet" && start && sameDay(d.date, start);
                const isEnd = mode === "shortlet" && end && sameDay(d.date, end);
                const inRange = mode === "shortlet" && start && end && d.date > start && d.date < end;
                const isBoatSel = mode === "boat" && boatDate && sameDay(d.date, boatDate);
                const selected = isStart || isEnd || isBoatSel;
                const weekend = mode === "shortlet" ? isWeekendNight(d.date) : isPeakDay(d.date);
                return (
                  <button
                    key={d.offset}
                    disabled={d.blocked}
                    onClick={() => pickDate(d)}
                    className={
                      "flex-shrink-0 w-[64px] rounded-xl border px-2 py-2 text-center transition-colors " +
                      (d.blocked
                        ? "border-[#E3DBC9] bg-[#EFE9DA] text-[#B9B2A0] cursor-not-allowed"
                        : selected
                        ? "border-[#0B3D3C] bg-[#0B3D3C] text-[#F7F0E2]"
                        : inRange
                        ? "border-[#0B3D3C] bg-[#DCEAE8] text-[#0B3D3C]"
                        : "border-[#E3DBC9] bg-white text-[#12262A] hover:border-[#0B3D3C]")
                    }
                  >
                    <div className="text-[10px] opacity-70">{dayShort(d.date)}</div>
                    <div className="text-sm font-semibold">{d.date.getDate()}</div>
                    {d.blocked ? (
                      <div className="text-[9px] mt-0.5">Booked</div>
                    ) : (
                      <div className="text-[9px] mt-0.5" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                        {weekend ? "peak" : "std"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {mode === "shortlet" && start && !end && (
              <div className="text-xs text-[#0B3D3C] mt-2">Check-in {fmtShort(start)} — now pick a check-out date</div>
            )}
          </div>

          {/* Boat duration selector */}
          {mode === "boat" && (
            <div className="mb-6">
              <StepLabel n={2} label="Duration" />
              <div className="grid grid-cols-3 gap-2">
                {(property.durations ?? []).map((d) => {
                  const active = duration === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDuration(d.id)}
                      className={
                        "rounded-xl border px-3 py-2.5 text-left transition-colors " +
                        (active ? "border-[#0B3D3C] bg-[#0B3D3C] text-[#F7F0E2]" : "border-[#E3DBC9] bg-white text-[#12262A]")
                      }
                    >
                      <div className="text-xs font-medium">{d.label}</div>
                      <div
                        className={"text-[13px] mt-1 " + (active ? "text-[#CFE3E1]" : "text-[#6B6455]")}
                        style={{ fontFamily: "IBM Plex Mono, monospace" }}
                      >
                        {money(d.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guest count */}
          <div className="mb-6">
            <StepLabel n={mode === "boat" ? 3 : 2} label={mode === "shortlet" ? "Guests" : "Passengers"} />
            <div className="flex items-center gap-4 bg-white border border-[#E3DBC9] rounded-xl px-4 py-2.5 w-fit">
              <Users size={16} className="text-[#6B6455]" />
              <button
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                className="w-7 h-7 rounded-full border border-[#E3DBC9] text-[#12262A] font-medium"
              >
                −
              </button>
              <span className="w-5 text-center font-medium text-[#12262A]">{guests}</span>
              <button
                onClick={() => setGuests((g) => g + 1)}
                className="w-7 h-7 rounded-full border border-[#E3DBC9] text-[#12262A] font-medium"
              >
                +
              </button>
              <span className="text-xs text-[#6B6455]">
                {mode === "shortlet"
                  ? `${property.includedGuests} included, up to ${property.maxGuests}`
                  : `${property.includedGuests} included, boat fits ${property.capacity}`}
              </span>
            </div>
            {overCapacity && (
              <div className="mt-2 text-xs font-medium text-[#993C1D] bg-[#FAECE7] border border-[#F0997B] rounded-lg px-3 py-2 inline-block">
                {mode === "shortlet"
                  ? `This villa sleeps ${property.maxGuests} max — please reduce guest count.`
                  : `This boat is rated for ${property.capacity} passengers max — please reduce your party size.`}
              </div>
            )}
          </div>

          {/* Add-ons */}
          <div className="mb-6">
            <StepLabel n={mode === "boat" ? 4 : 3} label="Add-ons (optional)" />
            <div className="grid sm:grid-cols-2 gap-2">
              {(property.addOns ?? []).map((a) => {
                const checked = !!addOnState[a.id];
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAddOn(a.id)}
                    className={
                      "flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors " +
                      (checked ? "border-[#0B3D3C] bg-[#DCEAE8]" : "border-[#E3DBC9] bg-white")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={
                          "w-4 h-4 rounded flex items-center justify-center border " +
                          (checked ? "bg-[#0B3D3C] border-[#0B3D3C]" : "border-[#B9B2A0]")
                        }
                      >
                        {checked && <Check size={11} color="#F7F0E2" />}
                      </div>
                      <span className="text-sm text-[#12262A]">{a.label}</span>
                    </div>
                    <span className="text-xs text-[#6B6455]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                      +{money(a.price)}
                      {a.perNight ? "/nt" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guest details */}
          <div className="mb-2">
            <StepLabel n={mode === "boat" ? 5 : 4} label="Your details" />
            <div className="grid sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Full name"
                value={guestInfo.name}
                onChange={(e) => setGuestInfo((g) => ({ ...g, name: e.target.value }))}
                className="rounded-xl border border-[#E3DBC9] bg-white px-3.5 py-2.5 text-sm text-[#12262A] outline-none focus:border-[#0B3D3C]"
              />
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo((g) => ({ ...g, email: e.target.value }))}
                  className={
                    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#12262A] outline-none " +
                    (emailLooksInvalid ? "border-[#D9765A] focus:border-[#D9765A]" : "border-[#E3DBC9] focus:border-[#0B3D3C]")
                  }
                />
                {emailLooksInvalid && <p className="text-[11px] text-[#993C1D] mt-1">Doesn't look like a valid email.</p>}
              </div>
              <input
                type="tel"
                placeholder="WhatsApp number"
                value={guestInfo.phone}
                onChange={(e) => setGuestInfo((g) => ({ ...g, phone: e.target.value }))}
                className="rounded-xl border border-[#E3DBC9] bg-white px-3.5 py-2.5 text-sm text-[#12262A] outline-none focus:border-[#0B3D3C]"
              />
            </div>
          </div>
        </div>

        {/* ---------------- RIGHT: dock ticket summary ---------------- */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="relative bg-white border border-[#E3DBC9] rounded-2xl overflow-hidden">
            <div className="bg-[#0B3D3C] text-[#F7F0E2] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket size={16} />
                <span style={{ fontFamily: "Fraunces, serif" }} className="font-semibold">
                  Booking summary
                </span>
              </div>
              <span className="text-[11px] text-[#B7D2CF]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                {bookingRef ?? "not booked yet"}
              </span>
            </div>

            <div className="px-5 pt-4 pb-2 text-sm text-[#12262A]">
              <div className="font-medium">{property.name}</div>
              <div className="text-[#6B6455] mt-1">
                {mode === "shortlet"
                  ? nights > 0
                    ? `${fmtShort(start)} → ${fmtShort(end)} · ${nights} night${nights > 1 ? "s" : ""}`
                    : "No dates selected yet"
                  : boatDate
                  ? duration
                    ? `${fmtShort(boatDate)} · ${(property.durations ?? []).find((d) => d.id === duration)?.label ?? ""}`
                    : `${fmtShort(boatDate)} · pick a duration below`
                  : "No date selected yet"}
              </div>
              <div className="text-[#6B6455]">
                {guests} {mode === "shortlet" ? "guest" : "passenger"}
                {guests > 1 ? "s" : ""}
              </div>
            </div>

            <div className="px-5 py-3 space-y-1.5">
              {lineItems.length === 0 && (
                <div className="text-xs text-[#928C7C] italic">Line items will appear as you build your booking.</div>
              )}
              {lineItems.map((li, i) => (
                <div key={i} className="flex justify-between text-[13px] text-[#3A4038]">
                  <span>{li.label}</span>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{money(li.amount)}</span>
                </div>
              ))}
            </div>

            <div className="mx-5 border-t border-dashed border-[#C9BFA5]" />

            <div className="px-5 py-3 space-y-1.5">
              <div className="flex justify-between text-sm text-[#12262A]">
                <span>Subtotal</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#0B3D3C]">
                <span>Deposit due now (50%)</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{money(deposit)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#6B6455]">
                <span>Balance due at check-in</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{money(balance)}</span>
              </div>
            </div>

            <div className="px-5 pb-5 pt-1">
              {apiError && (
                <div className="mb-2 flex gap-1.5 rounded-lg border border-[#F0997B] bg-[#FAECE7] px-3 py-2 text-xs text-[#993C1D]">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              {redirectUrl ? (
                <a
                  href={redirectUrl}
                  className="hidden lg:flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold bg-[#E7A63C] text-[#3A2A0C] hover:bg-[#D89530]"
                >
                  Continue to secure payment →
                </a>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={!readyToPay || paying}
                  className={
                    "hidden lg:block w-full rounded-xl py-3 text-sm font-semibold transition-colors " +
                    (readyToPay
                      ? "bg-[#E7A63C] text-[#3A2A0C] hover:bg-[#D89530]"
                      : "bg-[#EFE9DA] text-[#B0A98F] cursor-not-allowed")
                  }
                >
                  {paying ? "Creating booking…" : `Pay deposit · ${money(deposit || 0)}`}
                </button>
              )}
              {missingStepMessage && !paying && (
                <div className="hidden lg:block text-center text-[11px] text-[#B0763A] mt-2">{missingStepMessage}</div>
              )}
              <div className="hidden lg:flex items-center justify-center gap-1.5 text-[11px] text-[#928C7C] mt-2">
                <ShieldCheck size={12} />
                <span>Paystack &middot; card, bank transfer, USSD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton message={`Hi! I have a question about ${property.name}.`} />

      {/* Mobile sticky book bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E3DBC9] px-4 py-2.5 flex flex-col gap-1.5">
        {missingStepMessage && !paying && !redirectUrl && (
          <div className="text-[11px] text-[#B0763A] text-center">{missingStepMessage}</div>
        )}
        <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] text-[#6B6455]">Deposit due now</div>
          <div style={{ fontFamily: "IBM Plex Mono, monospace" }} className="text-base font-semibold text-[#0B3D3C]">
            {money(deposit || 0)}
          </div>
        </div>
        {redirectUrl ? (
          <a
            href={redirectUrl}
            className="flex-1 text-center rounded-xl py-3 text-sm font-semibold bg-[#E7A63C] text-[#3A2A0C]"
          >
            Continue to pay
          </a>
        ) : (
          <button
            onClick={handlePay}
            disabled={!readyToPay || paying}
            className={
              "flex-1 rounded-xl py-3 text-sm font-semibold " +
              (readyToPay ? "bg-[#E7A63C] text-[#3A2A0C]" : "bg-[#EFE9DA] text-[#B0A98F]")
            }
          >
            {paying ? "Creating booking…" : "Book now"}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
