import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, ShieldAlert } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import { usePageMeta } from "../lib/usePageMeta";
import { API_BASE } from "../lib/api";

const money = (n) => "₦" + Math.round(n || 0).toLocaleString("en-NG");

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BookingConfirmationPage() {
  usePageMeta("Booking Status", "Check the status of your Lekki Tides booking.");
  const { ref } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    // Paystack's webhook can land a beat after the guest is redirected back
    // here, so poll briefly instead of showing "pending" on a payment that
    // actually just succeeded.
    async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/${ref}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Booking not found.");
        setBooking(data.booking);
        if (data.booking.paymentStatus === "pending" && attempts < 6) {
          attempts += 1;
          setTimeout(poll, 2000);
        } else if (data.booking.paymentStatus === "pending") {
          // The webhook hasn't landed after ~12s — most likely it isn't
          // reachable at all for this deployment (Paystack can't call
          // localhost, or the webhook URL just isn't set up in the Paystack
          // dashboard yet). Fall back to asking the backend to verify
          // directly with Paystack instead of leaving the guest stuck here.
          verifyDirectly();
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    async function verifyDirectly() {
      if (cancelled) return;
      setVerifying(true);
      try {
        const res = await fetch(`${API_BASE}/api/payments/${ref}/verify`, { method: "POST" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.paymentStatus) {
          // Re-fetch the full booking so dates/amounts render alongside the
          // now-updated status.
          const bookingRes = await fetch(`${API_BASE}/api/bookings/${ref}`);
          const bookingData = await bookingRes.json();
          if (!cancelled && bookingRes.ok) setBooking(bookingData.booking);
        }
      } catch {
        // Leave whatever status is already shown — the guest can refresh,
        // and the webhook (if it does eventually arrive) will still confirm it.
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  return (
    <div className="min-h-screen bg-[#F7F0E2]">
      <Nav />
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white border border-[#E3DBC9] rounded-2xl p-6 text-center">
          {error && (
            <>
              <ShieldAlert size={36} className="mx-auto text-[#993C1D] mb-3" />
              <p className="text-sm text-[#993C1D]">{error}</p>
            </>
          )}

          {!error && !booking && <p className="text-sm text-[#928C7C] italic">Checking your booking…</p>}

          {!error && booking && (
            <>
              {booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "paid_in_full" ? (
                <CheckCircle2 size={40} className="mx-auto text-[#0B3D3C] mb-3" />
              ) : booking.paymentStatus === "cancelled" ? (
                <XCircle size={40} className="mx-auto text-[#993C1D] mb-3" />
              ) : (
                <Clock size={40} className="mx-auto text-[#E7A63C] mb-3" />
              )}

              <h1 className="font-display text-xl font-semibold text-[#12262A] mb-1">
                {booking.paymentStatus === "deposit_paid" && "Booking confirmed"}
                {booking.paymentStatus === "paid_in_full" && "Fully paid"}
                {booking.paymentStatus === "pending" && "Payment processing…"}
                {booking.paymentStatus === "cancelled" && "Booking cancelled"}
              </h1>
              <p className="text-sm text-[#6B6455] mb-4" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                {booking.bookingRef}
              </p>

              <div className="text-left text-sm text-[#3A4038] space-y-1.5 border-t border-dashed border-[#C9BFA5] pt-4">
                <div className="flex justify-between"><span className="text-[#6B6455]">Property</span><span>{booking.property?.name}</span></div>
                <div className="flex justify-between">
                  <span className="text-[#6B6455]">Dates</span>
                  <span>{fmtDate(booking.startDateTime)} → {fmtDate(booking.endDateTime)}</span>
                </div>
                <div className="flex justify-between"><span className="text-[#6B6455]">Deposit</span><span>{money(booking.pricing?.deposit)}</span></div>
                <div className="flex justify-between"><span className="text-[#6B6455]">Balance due</span><span>{money(booking.pricing?.balance)}</span></div>
              </div>

              {booking.paymentStatus === "pending" && (
                <>
                  <p className="text-xs text-[#928C7C] mt-4">
                    {verifying
                      ? "Double-checking with Paystack now…"
                      : "Still confirming with Paystack. If you completed payment, this can take a few seconds — a confirmation email is on its way once it's done."}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-xs font-medium text-[#0B3D3C] underline"
                  >
                    Check again
                  </button>
                </>
              )}
            </>
          )}

          <Link to="/" className="inline-block mt-6 text-sm font-medium text-[#0B3D3C] underline">
            Back to home
          </Link>
        </div>
      </div>
      <Footer />
      <WhatsAppButton message="Hi! I have a question about my booking." />
    </div>
  );
}
