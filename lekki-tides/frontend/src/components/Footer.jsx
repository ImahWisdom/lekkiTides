import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0B3D3C] text-[#B7D2CF] mt-16">
      <div className="max-w-5xl mx-auto px-5 md:px-10 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="font-display text-lg font-semibold text-[#F7F0E2] mb-2">Lekki Tides</div>
          <p className="text-sm">Waterfront shortlets and boat cruises in Lekki, Lagos.</p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7FA9A6] mb-2">Book</div>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link to="/book/shortlet" className="hover:text-white transition-colors">Shortlet villa</Link>
            <Link to="/book/boat" className="hover:text-white transition-colors">Boat cruise</Link>
            <Link to="/find-booking" className="hover:text-white transition-colors">Find my booking</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#7FA9A6] mb-2">Policies</div>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of service</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy policy</Link>
            <Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation &amp; refunds</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[#1B4D4B] px-5 md:px-10 py-4 text-xs text-[#7FA9A6]">
        &copy; {new Date().getFullYear()} Lekki Tides. All rights reserved.
      </div>
    </footer>
  );
}
