import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Zap, MessageCircle, Home, Anchor, Users, Fuel } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import MapEmbed from "../components/MapEmbed";
import WhatsAppButton from "../components/WhatsAppButton";
import { usePageMeta } from "../lib/usePageMeta";
import { API_BASE } from "../lib/api";

// Tide-line divider — the one recurring signature shape that ties every
// section together, standing in for the water this whole site is about.
function TideDivider({ flip = false }) {
  return (
    <svg
      viewBox="0 0 1200 60"
      className={`w-full h-10 ${flip ? "rotate-180" : ""}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z"
        fill="#F7F0E2"
      />
    </svg>
  );
}

const TESTIMONIALS = [
  {
    quote: "Booked the villa for a weekend in twenty minutes, no back-and-forth on WhatsApp. Showed up and the place matched exactly what I paid for.",
    author: "Guest, Ikate stay",
  },
  {
    quote: "The sunset cruise was smooth from booking to boarding. Captain was on time and the crew handled everything.",
    author: "Guest, Landmark Marina cruise",
  },
  {
    quote: "Appreciated getting a real receipt and confirmation straight away instead of waiting on a reply.",
    author: "Guest, Ikate stay",
  },
];

export default function HomePage() {
  usePageMeta(
    "Shortlet Villas & Boat Cruises in Lekki, Lagos",
    "Book a waterfront shortlet villa or a boat cruise in Lekki, Lagos with instant confirmation and secure Paystack payment."
  );

  // Cover photos + pricing are owner-managed from the dashboard's Listings
  // tab. There can be several shortlets and several boats, each with their
  // own price and photos — these cards summarize each category rather than
  // assuming there's exactly one of each, and link through to the full list.
  const [properties, setProperties] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/properties`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setProperties(data.properties);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const shortlets = properties?.filter((p) => p.type === "shortlet") ?? [];
  const boats = properties?.filter((p) => p.type === "boat") ?? [];

  function summarize(list, isBoat) {
    const cover = list.find((p) => p.images?.length)?.images?.[0] ?? null;
    const prices = list
      .map((p) => (isBoat ? Math.min(...(p.boat?.durations ?? []).map((d) => d.price), Infinity) : p.shortlet?.weekdayRate))
      .filter((n) => n && n !== Infinity);
    const fromPrice = prices.length ? Math.min(...prices) : null;
    const maxGuests = Math.max(0, ...list.map((p) => (isBoat ? p.boat?.capacity ?? 0 : p.shortlet?.maxGuests ?? 0)));
    return { cover, fromPrice, maxGuests, count: list.length };
  }
  const shortletSummary = summarize(shortlets, false);
  const boatSummary = summarize(boats, true);

  return (
    <div className="min-h-screen bg-[#F7F0E2]">
      <Nav />

      {/* --- Hero --- */}
      <div className="bg-gradient-to-b from-[#0B3D3C] to-[#0F4C4A] text-[#F7F0E2] px-5 md:px-10 pt-14 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-[#E7A63C] mb-4">
            Lekki, Lagos
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.1] mb-5">
            Book the water's edge,
            <br />
            without a single DM.
          </h1>
          <p className="text-base md:text-lg text-[#CFE3E1] max-w-xl mx-auto mb-9">
            Waterfront villas around Lekki or cruisers out of Lagos marinas — check real dates, pay your deposit, get confirmed. All before your first cup of coffee gets cold.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/book/shortlet"
              className="rounded-full bg-[#E7A63C] text-[#3A2A0C] font-semibold px-6 py-3 hover:bg-[#D89530] transition-colors"
            >
              Browse villas
            </Link>
            <Link
              to="/book/boat"
              className="rounded-full border border-[#3E6C69] px-6 py-3 font-semibold hover:bg-[#0F4C4A] transition-colors"
            >
              Browse boat cruises
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-xs text-[#9FC4C1]">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Secure Paystack payment</span>
            <span className="flex items-center gap-1.5"><Zap size={14} /> Instant confirmation</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={14} /> WhatsApp support</span>
          </div>
        </div>
      </div>
      <TideDivider />

      {/* --- Property cards --- */}
      <div className="max-w-5xl mx-auto px-5 md:px-10 -mt-2 pb-4">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-center text-[#12262A] mb-8">
          Choose your Lagos
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Villa ticket card */}
          <div className="relative bg-white border border-[#E3DBC9] rounded-2xl overflow-hidden">
            {shortletSummary.cover ? (
              <img src={shortletSummary.cover} alt="Shortlet villas in Lekki, Lagos" className="w-full h-44 object-cover" />
            ) : (
              <div className="bg-[#DCEAE8] px-5 py-8 flex items-center justify-center h-44">
                <Home size={40} className="text-[#0B3D3C]" />
              </div>
            )}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold tracking-wide text-[#928C7C]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                  {properties ? `${shortletSummary.count} LISTED` : "SHORTLETS"}
                </span>
                {shortletSummary.maxGuests > 0 && (
                  <span className="text-xs text-[#6B6455] flex items-center gap-1">
                    <Users size={12} /> Up to {shortletSummary.maxGuests}
                  </span>
                )}
              </div>
              <div className="font-display text-lg font-semibold text-[#12262A] mb-1">Shortlet villas</div>
              <p className="text-sm text-[#6B6455] mb-3">Waterfront villas around Lekki, each with its own space and price.</p>
              <div className="border-t border-dashed border-[#C9BFA5] my-3" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#928C7C]">From</div>
                  <div className="font-semibold text-[#0B3D3C]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                    {shortletSummary.fromPrice ? `₦${shortletSummary.fromPrice.toLocaleString("en-NG")}/night` : "—"}
                  </div>
                </div>
                <Link to="/book/shortlet" className="rounded-full bg-[#0B3D3C] text-[#F7F0E2] text-sm font-semibold px-5 py-2.5 hover:bg-[#0F4C4A] transition-colors">
                  Browse villas
                </Link>
              </div>
            </div>
          </div>

          {/* Boat ticket card */}
          <div className="relative bg-white border border-[#E3DBC9] rounded-2xl overflow-hidden">
            {boatSummary.cover ? (
              <img src={boatSummary.cover} alt="Boat cruises out of Lagos marinas" className="w-full h-44 object-cover" />
            ) : (
              <div className="bg-[#F2E3C7] px-5 py-8 flex items-center justify-center h-44">
                <Anchor size={40} className="text-[#0B3D3C]" />
              </div>
            )}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold tracking-wide text-[#928C7C]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                  {properties ? `${boatSummary.count} LISTED` : "BOATS"}
                </span>
                {boatSummary.maxGuests > 0 && (
                  <span className="text-xs text-[#6B6455] flex items-center gap-1">
                    <Fuel size={12} /> Fits up to {boatSummary.maxGuests}
                  </span>
                )}
              </div>
              <div className="font-display text-lg font-semibold text-[#12262A] mb-1">Boat cruises</div>
              <p className="text-sm text-[#6B6455] mb-3">Cruisers out of Lagos marinas, from harbour runs to sunset trips.</p>
              <div className="border-t border-dashed border-[#C9BFA5] my-3" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#928C7C]">From</div>
                  <div className="font-semibold text-[#0B3D3C]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                    {boatSummary.fromPrice ? `₦${boatSummary.fromPrice.toLocaleString("en-NG")}/trip` : "—"}
                  </div>
                </div>
                <Link to="/book/boat" className="rounded-full bg-[#0B3D3C] text-[#F7F0E2] text-sm font-semibold px-5 py-2.5 hover:bg-[#0F4C4A] transition-colors">
                  Browse boats
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- How it works --- */}
      <div className="bg-white border-y border-[#E3DBC9] mt-12">
        <div className="max-w-5xl mx-auto px-5 md:px-10 py-12">
          <h2 className="font-display text-2xl font-semibold text-center text-[#12262A] mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Pick your dates", body: "Real availability, updated the instant someone else books." },
              { step: "2", title: "Pay your deposit", body: "50% now via card, bank transfer, or USSD through Paystack." },
              { step: "3", title: "Get confirmed", body: "Email confirmation lands immediately, no waiting on a reply." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-9 h-9 mx-auto rounded-full bg-[#0B3D3C] text-[#F7F0E2] flex items-center justify-center font-semibold mb-3" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                  {s.step}
                </div>
                <div className="font-semibold text-[#12262A] mb-1">{s.title}</div>
                <p className="text-sm text-[#6B6455]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Testimonials --- */}
      <div className="max-w-5xl mx-auto px-5 md:px-10 py-14">
        <h2 className="font-display text-2xl font-semibold text-center text-[#12262A] mb-8">What guests are saying</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border border-[#E3DBC9] rounded-2xl p-5">
              <p className="text-sm text-[#3A4038] mb-3">&ldquo;{t.quote}&rdquo;</p>
              <div className="text-xs text-[#928C7C]">{t.author}</div>
            </div>
          ))}
        </div>
        {/* DEV NOTE: these are placeholder quotes — replace with real Google/Airbnb reviews once you have them. */}
      </div>

      {/* --- Find us --- */}
      <div className="bg-white border-y border-[#E3DBC9]">
        <div className="max-w-5xl mx-auto px-5 md:px-10 py-12">
          <h2 className="font-display text-2xl font-semibold text-center text-[#12262A] mb-6">Find us</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <div className="text-sm font-medium text-[#12262A] mb-2">Shortlets — around Lekki</div>
              <MapEmbed address="Ikate, Lekki, Lagos" lat={6.4419} lng={3.4736} />
            </div>
            <div>
              <div className="text-sm font-medium text-[#12262A] mb-2">Boats — Victoria Island marinas</div>
              <MapEmbed address="Landmark Marina, Victoria Island, Lagos" lat={6.4304} lng={3.4304} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
