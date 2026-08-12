import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { usePageMeta } from "../lib/usePageMeta";

export default function CancellationPolicyPage() {
  usePageMeta("Cancellation & Refund Policy", "How cancellations, refunds, and rescheduling work when you book with Lekki Tides.");

  return (
    <div className="min-h-screen bg-[#F7F0E2]">
      <Nav />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-12">
        <h1 className="font-display text-3xl font-semibold text-[#12262A] mb-2">Cancellation &amp; Refund Policy</h1>
        <p className="text-sm text-[#928C7C] mb-8">Last updated: July 2026</p>

        <div className="prose-sections space-y-6 text-[#3A4038] text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">1. Deposits</h2>
            <p>
              Every booking is secured with a 50% deposit paid at the time of booking. The remaining balance is due at check-in
              (for shortlet stays) or before departure (for boat cruises). A booking is only confirmed once the deposit has been
              received and verified.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">2. Cancelling a shortlet stay</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cancelled 7 or more days before check-in: full deposit refunded.</li>
              <li>Cancelled 3–6 days before check-in: 50% of the deposit refunded.</li>
              <li>Cancelled less than 72 hours before check-in, or a no-show: deposit is non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">3. Cancelling a boat cruise</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cancelled 48 or more hours before departure: full deposit refunded.</li>
              <li>Cancelled less than 48 hours before departure, or a no-show: deposit is non-refundable.</li>
              <li>
                If a cruise is cancelled by us due to unsafe weather or mechanical issues, guests receive a full refund or the
                option to reschedule at no extra cost.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">4. Rescheduling</h2>
            <p>
              One free reschedule is allowed per booking, subject to availability, if requested at least 48 hours before the
              original check-in/departure time. Rescheduling within 48 hours is treated as a cancellation under the rules above.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">5. How refunds are paid</h2>
            <p>
              Approved refunds are issued to the original payment method through Paystack within 5–10 business days. We do not
              issue cash refunds.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">6. Requesting a cancellation</h2>
            <p>
              Contact us via the WhatsApp button on this site with your booking reference, or reply to your confirmation email.
              Include the booking reference so we can process it quickly.
            </p>
          </section>

          <p className="text-xs text-[#928C7C] pt-4 border-t border-[#E3DBC9]">
            This page is a starting template, not legal advice. Have a Nigeria-qualified lawyer review it before you rely on it
            commercially, particularly around consumer protection obligations under the Federal Competition and Consumer
            Protection Act.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
