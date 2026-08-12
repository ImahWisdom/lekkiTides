import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import PropertyListingPage from "./pages/PropertyListingPage";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import FindBookingPage from "./pages/FindBookingPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CancellationPolicyPage from "./pages/CancellationPolicyPage";

// React Router keeps the browser's natural scroll position on navigation —
// so if you scroll to the bottom of one page and click a link, you land at
// the bottom of the next page instead of the top. This resets it on every
// route change (but not on same-page interactions, since it only fires when
// the path actually changes).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book/:type" element={<PropertyListingPage />} />
        <Route path="/book/:type/:id" element={<BookingPage />} />
        <Route path="/booking/:ref" element={<BookingConfirmationPage />} />
        <Route path="/find-booking" element={<FindBookingPage />} />
        <Route path="/owner" element={<OwnerDashboardPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
      </Routes>
    </BrowserRouter>
  );
}
