import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Waves, Menu, X } from "lucide-react";

// Sticky so the nav (and its "Find my booking" / "Owner login" links) stays
// reachable while scrolling a long listing or booking page, not just at the
// top. On mobile, "Shortlet" and "Boat cruise" used to just disappear below
// the sm breakpoint with no way to reach them — now they're in a proper menu
// instead of being dropped.
export default function Nav() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/book/shortlet", label: "Shortlet villas" },
    { to: "/book/boat", label: "Boat cruises" },
    { to: "/find-booking", label: "Find my booking" },
  ];

  return (
    <div className="sticky top-0 z-40 bg-[#0B3D3C] text-[#F7F0E2]">
      <div className="px-5 py-4 md:px-10 flex items-center justify-between">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 font-display text-xl md:text-2xl font-semibold tracking-tight"
        >
          <Waves size={20} />
          Lekki Tides
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-white text-[#CFE3E1] transition-colors">
              {l.label}
            </Link>
          ))}
          {!isHome && (
            <Link to="/" className="hover:text-white text-[#CFE3E1] transition-colors">
              Home
            </Link>
          )}
          <Link
            to="/owner"
            className="rounded-full border border-[#2E5F5D] px-3.5 py-1.5 hover:bg-[#0F4C4A] transition-colors text-[#F7F0E2]"
          >
            Owner login
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="sm:hidden p-1.5 -mr-1.5 text-[#CFE3E1]"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[#1B4D4B] px-5 py-3 flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 text-[#CFE3E1] hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {!isHome && (
            <Link to="/" onClick={() => setMenuOpen(false)} className="py-2.5 text-[#CFE3E1] hover:text-white transition-colors">
              Home
            </Link>
          )}
          <Link
            to="/owner"
            onClick={() => setMenuOpen(false)}
            className="mt-1 text-center rounded-full border border-[#2E5F5D] px-3.5 py-2.5 hover:bg-[#0F4C4A] transition-colors text-[#F7F0E2]"
          >
            Owner login
          </Link>
        </div>
      )}
    </div>
  );
}
