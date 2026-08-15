import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { usePageMeta } from "../lib/usePageMeta";

export default function TermsPage() {
  usePageMeta("Terms of Service", "The terms that apply when you book a shortlet stay or boat cruise with Lekki Tides.");

  return (
    <div className="min-h-screen bg-[#F7F0E2]">
      <Nav />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-12">
        <h1 className="font-display text-3xl font-semibold text-[#12262A] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#928C7C] mb-8">Last updated: July 2026</p>

        <div className="space-y-6 text-[#3A4038] text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">1. Who this applies to</h2>
            <p>
              These terms apply to anyone who books a shortlet stay or boat cruise through Lekki Tides ("we", "us"). By paying a
              deposit, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">2. Bookings and payment</h2>
            <p>
              Prices are shown in Nigerian Naira and processed through Paystack. A booking is confirmed only once your deposit
              payment has been verified — an unpaid or unverified booking does not guarantee availability. The displayed price
              at the time of booking is final; it will not change after your deposit is confirmed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">3. Guest conduct</h2>
            <p>
              Guests are responsible for the number of people and behaviour of their party. Exceeding the stated guest or
              passenger capacity, or causing damage to the property or vessel, may result in additional charges or the booking
              being ended without a refund.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">4. Boat cruises specifically</h2>
            <p>
              All cruises are operated with a licensed captain and crew. We reserve the right to cancel or reschedule a cruise
              for safety reasons (weather, mechanical issues, water conditions) at no cost to the guest. Guests must follow the
              captain's safety instructions at all times, including wearing provided life jackets when instructed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">5. Cancellations and refunds</h2>
            <p>
              See our separate <Link to="/cancellation-policy" className="underline text-[#0B3D3C]">Cancellation &amp; Refund Policy</Link> for the rules on
              cancelling, rescheduling, and refund timing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">6. Liability</h2>
            <p>
              We take reasonable care to keep our properties and vessels safe and well maintained. To the extent permitted by
              Nigerian law, we are not liable for indirect or consequential losses arising from your stay or trip, except where
              that loss results from our negligence.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">7. Changes to these terms</h2>
            <p>We may update these terms from time to time. The version in effect at the time of your booking applies to that booking.</p>
          </section>

          <p className="text-xs text-[#928C7C] pt-4 border-t border-[#E3DBC9]">
            This page is a starting template, not legal advice. Have a Nigeria-qualified lawyer review it — especially
            liability, consumer protection, and maritime/water-safety clauses — before relying on it commercially.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
