import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { usePageMeta } from "../lib/usePageMeta";

export default function PrivacyPage() {
  usePageMeta("Privacy Policy", "How Lekki Tides collects, uses, and protects your personal information.");

  return (
    <div className="min-h-screen bg-[#F7F0E2]">
      <Nav />
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-12">
        <h1 className="font-display text-3xl font-semibold text-[#12262A] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#928C7C] mb-8">Last updated: July 2026</p>

        <div className="space-y-6 text-[#3A4038] text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">1. What we collect</h2>
            <p>When you make a booking, we collect your name, email address, phone number, and the details of your booking (dates or trip time, guest count, add-ons).</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">2. How we use it</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your booking, and to contact you about it.</li>
              <li>To process your deposit and balance payment through Paystack.</li>
              <li>To send booking confirmations and, where you've asked us to, check-in reminders.</li>
              <li>To improve the service — for example, understanding which dates or add-ons are popular.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">3. Who we share it with</h2>
            <p>We share the minimum necessary data with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Paystack</strong> — to process your payment. We never see or store your card details ourselves.</li>
              <li><strong>Resend</strong> — to deliver confirmation emails.</li>
              <li><strong>MongoDB Atlas</strong> — our database host, where booking records are stored.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to anyone.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">4. How long we keep it</h2>
            <p>Booking records are kept for as long as needed for accounting, dispute resolution, and legal record-keeping purposes, after which they are deleted or anonymised.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">5. Your rights</h2>
            <p>
              Under the Nigeria Data Protection Act, you can ask us what personal data we hold about you, ask us to correct it,
              or ask us to delete it (subject to our legal obligation to retain certain booking and payment records). Contact us
              via the WhatsApp button on this site to make a request.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-[#12262A] mb-2">6. Security</h2>
            <p>All payment data is handled directly by Paystack over an encrypted connection. Our site itself is served over HTTPS.</p>
          </section>

          <p className="text-xs text-[#928C7C] pt-4 border-t border-[#E3DBC9]">
            This page is a starting template, not legal advice. Have a Nigeria-qualified lawyer review it against the Nigeria
            Data Protection Act 2023 before relying on it commercially.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
