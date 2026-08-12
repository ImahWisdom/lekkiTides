import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Search } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { usePageMeta } from "../lib/usePageMeta";

// There's no guest account/sign-in on this site by design — every booking is
// keyed by a bookingRef (e.g. LT-3F8K2Q) that's shown on-screen right after
// checkout and included in the confirmation email. This page is just a
// front door to /booking/:ref for guests who come back later without that
// email handy, or who bookmarked nothing.
export default function FindBookingPage() {
  usePageMeta("Find My Booking", "Look up your Lekki Tides booking using your booking reference.");
  const [ref, setRef] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = ref.trim().toUpperCase();
    if (!cleaned) {
      setError("Enter your booking reference first.");
      return;
    }
    navigate(`/booking/${cleaned}`);
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full bg-[#F7F0E2] flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#E3DBC9] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={18} className="text-[#0B3D3C]" />
            <div className="text-xl font-semibold text-[#12262A]">Find my booking</div>
          </div>
          <p className="text-sm text-[#6B6455] mb-4">
            Enter the booking reference from your confirmation email or the screen you saw right after paying
            (it looks like <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>LT-3F8K2Q</span>).
          </p>
          <input
            type="text"
            value={ref}
            onChange={(e) => {
              setRef(e.target.value);
              setError(null);
            }}
            placeholder="Booking reference"
            className="w-full rounded-xl border border-[#E3DBC9] px-3.5 py-2.5 text-sm text-[#12262A] outline-none focus:border-[#0B3D3C] mb-3"
            style={{ fontFamily: "IBM Plex Mono, monospace" }}
            autoCapitalize="characters"
          />
          {error && <p className="text-xs text-[#993C1D] mb-3">{error}</p>}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold bg-[#0B3D3C] text-[#F7F0E2] hover:bg-[#0F4C4A]"
          >
            <Search size={15} />
            Find booking
          </button>
          <p className="text-[11px] text-[#928C7C] mt-3">
            Lekki Tides doesn't use guest accounts, so this reference is what stands in for one — keep the
            confirmation email safe.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}
