import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, Anchor, Users, MapPin, ImageOff } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { usePageMeta } from "../lib/usePageMeta";
import { API_BASE } from "../lib/api";

const money = (n) => "₦" + Math.round(n || 0).toLocaleString("en-NG");

function startingPrice(property) {
  if (property.type === "shortlet") return property.shortlet?.weekdayRate ?? null;
  const prices = (property.boat?.durations ?? []).map((d) => d.price);
  return prices.length ? Math.min(...prices) : null;
}

export default function PropertyListingPage() {
  const { type } = useParams(); // 'shortlet' | 'boat'
  const isBoat = type === "boat";

  usePageMeta(
    isBoat ? "Boat Cruises in Lekki, Lagos" : "Shortlet Villas in Lekki, Lagos",
    isBoat
      ? "Browse boat cruise options in Lekki, Lagos and book the one that fits your trip."
      : "Browse shortlet villa options in Lekki, Lagos and book the one that fits your stay."
  );

  const [properties, setProperties] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setProperties(null);
    setError(null);
    fetch(`${API_BASE}/api/properties?type=${type}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setProperties(data.properties);
      })
      .catch(() => {
        if (!cancelled) setError(`Can't reach the API at ${API_BASE}. Run the backend (npm run dev in /backend).`);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full bg-[#F7F0E2]">
      <Nav />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 text-[#0B3D3C] mb-1">
          {isBoat ? <Anchor size={18} /> : <Home size={18} />}
          <h1 style={{ fontFamily: "Fraunces, serif" }} className="text-2xl md:text-[28px] font-semibold">
            {isBoat ? "Boat cruises" : "Shortlet villas"}
          </h1>
        </div>
        <p className="text-sm text-[#6B6455] mb-6">
          {isBoat
            ? "Pick the boat and trip length that fits your crew — each has its own pricing and photos."
            : "Pick the villa that fits your stay — each has its own pricing, capacity, and photos."}
        </p>

        {error && (
          <div className="rounded-xl border border-[#F0997B] bg-[#FAECE7] px-4 py-3 text-sm text-[#993C1D] mb-6">{error}</div>
        )}

        {!properties && !error && (
          <div className="grid sm:grid-cols-2 gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-[#E3DBC9] bg-white h-72 animate-pulse" />
            ))}
          </div>
        )}

        {properties && properties.length === 0 && (
          <div className="rounded-2xl border border-[#E3DBC9] bg-white px-6 py-10 text-center text-sm text-[#6B6455]">
            No {isBoat ? "boats" : "villas"} listed right now — check back soon, or reach out on WhatsApp and we'll help directly.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          {properties?.map((p) => (
            <PropertyCard key={p._id} property={p} isBoat={isBoat} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function PropertyCard({ property, isBoat }) {
  const cover = property.images?.[0];
  const from = startingPrice(property);
  const guests = isBoat ? property.boat?.capacity : property.shortlet?.maxGuests;

  return (
    <Link
      to={`/book/${property.type}/${property._id}`}
      className="group flex flex-col rounded-2xl border border-[#E3DBC9] bg-white overflow-hidden hover:border-[#0B3D3C] transition-colors"
    >
      {cover ? (
        <img src={cover} alt={property.name} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 flex items-center justify-center bg-[#EFE9DA] text-[#B0A98F]">
          <ImageOff size={28} />
        </div>
      )}
      <div className="flex-1 flex flex-col p-4">
        <div style={{ fontFamily: "Fraunces, serif" }} className="font-semibold text-[#12262A] group-hover:text-[#0B3D3C]">
          {property.name}
        </div>
        {property.summary && <p className="text-xs text-[#6B6455] mt-1 line-clamp-2">{property.summary}</p>}

        <div className="flex items-center gap-3 text-xs text-[#6B6455] mt-2">
          {property.location?.address && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              <span className="truncate max-w-[140px]">{property.location.address}</span>
            </span>
          )}
          {guests && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Users size={12} />
              up to {guests}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="text-sm">
            {from ? (
              <>
                <span className="text-[#6B6455]">From </span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace" }} className="font-semibold text-[#0B3D3C]">
                  {money(from)}
                </span>
                <span className="text-[#6B6455]">{isBoat ? "" : "/night"}</span>
              </>
            ) : (
              <span className="text-[#928C7C]">Pricing coming soon</span>
            )}
          </div>
          <span className="text-xs font-semibold text-[#0B3D3C] group-hover:underline">View & book →</span>
        </div>
      </div>
    </Link>
  );
}
