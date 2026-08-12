import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  Home,
  Search,
  X,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  CalendarCheck,
  Wallet,
  Users2,
  ArrowLeft,
  LayoutDashboard,
  Images,
  UploadCloud,
  Trash2,
  Loader2,
  Plus,
  Pencil,
  Power,
  Save,
  Ban,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Owner dashboard for Lekki Tides. Same brand tokens as BookingFlow.jsx, but
// this is a control surface, not a sales page — denser, table-first, quieter.
// Talks to /api/admin/* on the real backend, gated by the x-admin-key header
// (a placeholder shared secret — see the backend README for why this isn't
// real auth yet).
// ---------------------------------------------------------------------------

import { API_BASE } from "../lib/api";
import { usePageMeta } from "../lib/usePageMeta";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');";

const money = (n) => "₦" + Math.round(n || 0).toLocaleString("en-NG");

const STATUS_STYLES = {
  pending: { bg: "#F2EEDD", text: "#7A6B2E", label: "Pending" },
  deposit_paid: { bg: "#DCEAE8", text: "#0B3D3C", label: "Deposit paid" },
  paid_in_full: { bg: "#DCEAE8", text: "#0B3D3C", label: "Paid in full" },
  cancelled: { bg: "#FAECE7", text: "#993C1D", label: "Cancelled" },
};

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

// A small "back to the guest site" link, shown on both the locked screen and
// the unlocked dashboard so the owner is never stuck with "Lock" as the only
// way out.
function BackToSiteLink({ className = "" }) {
  return (
    <Link
      to="/"
      className={
        "inline-flex items-center gap-1.5 text-sm font-medium transition-colors " + className
      }
    >
      <ArrowLeft size={15} />
      Back to site
    </Link>
  );
}

export default function OwnerDashboardPage() {
  usePageMeta("Owner Dashboard", "Manage bookings, payments, and photos for Lekki Tides.");
  const [adminKey, setAdminKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [authError, setAuthError] = useState(null);

  const [tab, setTab] = useState("overview"); // 'overview' | 'photos'

  const [bookings, setBookings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const authed = adminKey.length > 0;

  const loadData = useCallback(
    async (key) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (typeFilter) params.set("propertyType", typeFilter);

        const [bookingsRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/bookings?${params.toString()}`, {
            headers: { "x-admin-key": key },
          }),
          fetch(`${API_BASE}/api/admin/analytics`, {
            headers: { "x-admin-key": key },
          }),
        ]);

        if (bookingsRes.status === 401 || analyticsRes.status === 401) {
          setAuthError("That admin key was rejected. Check ADMIN_API_KEY in your backend .env.");
          setAdminKey("");
          setKeyDraft("");
          return;
        }
        if (!bookingsRes.ok || !analyticsRes.ok) {
          throw new Error("The API responded with an error. Is the backend running?");
        }

        const bookingsData = await bookingsRes.json();
        const analyticsData = await analyticsRes.json();
        setBookings(bookingsData.bookings);
        setAnalytics(analyticsData);
      } catch (err) {
        setError(
          `Can't reach the API at ${API_BASE}. Run the backend (npm run dev in /backend) and make sure ADMIN_API_KEY matches what you entered here.`
        );
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter]
  );

  useEffect(() => {
    if (authed) loadData(adminKey);
  }, [authed, adminKey, loadData]);

  function handleUnlock(e) {
    e.preventDefault();
    if (!keyDraft.trim()) return;
    setAuthError(null);
    setAdminKey(keyDraft.trim());
  }

  async function handleCancel(ref) {
    if (!window.confirm(`Cancel booking ${ref}? This frees up the dates immediately.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/${ref}/cancel`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error();
      loadData(adminKey);
    } catch {
      setError(`Couldn't cancel ${ref}. Try again.`);
    }
  }

  const filteredBookings = (bookings ?? []).filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.bookingRef.toLowerCase().includes(q) ||
      b.guest?.name?.toLowerCase().includes(q) ||
      b.guest?.email?.toLowerCase().includes(q)
    );
  });

  // ---------------- Locked screen: enter the admin key ----------------
  if (!authed) {
    return (
      <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full bg-[#F7F0E2] flex flex-col">
        <style>{FONT_IMPORT}</style>
        <div className="px-5 py-4 md:px-8">
          <BackToSiteLink className="text-[#0B3D3C] hover:text-[#0F4C4A]" />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <form onSubmit={handleUnlock} className="w-full max-w-sm bg-white border border-[#E3DBC9] rounded-2xl p-6">
            <div style={{ fontFamily: "Fraunces, serif" }} className="text-xl font-semibold text-[#12262A] mb-1">
              Lekki Tides — owner dashboard
            </div>
            <p className="text-sm text-[#6B6455] mb-4">Enter the admin key to view bookings and manage photos.</p>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="Admin key"
              className="w-full rounded-xl border border-[#E3DBC9] px-3.5 py-2.5 text-sm text-[#12262A] outline-none focus:border-[#0B3D3C] mb-3"
            />
            {authError && (
              <div className="flex gap-1.5 rounded-lg border border-[#F0997B] bg-[#FAECE7] px-3 py-2 text-xs text-[#993C1D] mb-3">
                <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            <button type="submit" className="w-full rounded-xl py-2.5 text-sm font-semibold bg-[#0B3D3C] text-[#F7F0E2] hover:bg-[#0F4C4A]">
              Unlock dashboard
            </button>
            <p className="text-[11px] text-[#928C7C] mt-3">
              This matches <code className="text-[#6B6455]">ADMIN_API_KEY</code> in your backend's <code className="text-[#6B6455]">.env</code>. It's a
              placeholder shared secret, not real owner login — see the backend README.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full bg-[#F7F0E2]">
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <div className="bg-[#0B3D3C] text-[#F7F0E2] px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <BackToSiteLink className="text-[#B7D2CF] hover:text-white" />
            <div className="hidden sm:block w-px h-5 bg-[#2E5F5D]" />
            <div style={{ fontFamily: "Fraunces, serif" }} className="text-lg md:text-xl font-semibold tracking-tight">
              Owner dashboard
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(adminKey)}
              className="flex items-center gap-1.5 text-xs text-[#B7D2CF] hover:text-white"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => {
                setAdminKey("");
                setKeyDraft("");
              }}
              className="text-xs text-[#B7D2CF] hover:text-white"
            >
              Lock
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 -mb-4">
          {[
            { id: "overview", label: "Bookings & analytics", icon: LayoutDashboard },
            { id: "listings", label: "Listings & photos", icon: Images },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium transition-colors " +
                  (active ? "bg-[#F7F0E2] text-[#0B3D3C]" : "text-[#B7D2CF] hover:text-white")
                }
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" ? (
        <OverviewTab
          error={error}
          loading={loading}
          analytics={analytics}
          bookings={bookings}
          filteredBookings={filteredBookings}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          search={search}
          setSearch={setSearch}
          handleCancel={handleCancel}
        />
      ) : (
        <ListingsTab adminKey={adminKey} />
      )}
    </div>
  );
}

function OverviewTab({
  error,
  loading,
  analytics,
  bookings,
  filteredBookings,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  search,
  setSearch,
  handleCancel,
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
      {error && (
        <div className="mb-4 flex gap-1.5 rounded-lg border border-[#F0997B] bg-[#FAECE7] px-3.5 py-2.5 text-xs text-[#993C1D]">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* --- metric cards --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={Wallet}
          label="Revenue collected (6mo)"
          value={analytics ? money(analytics.totals.totalRevenueCollected) : "—"}
        />
        <MetricCard
          icon={TrendingUp}
          label="Confirmed bookings (6mo)"
          value={analytics ? analytics.totals.totalBookingsLast6Months : "—"}
        />
        <MetricCard
          icon={CalendarCheck}
          label="Check-ins next 7 days"
          value={analytics ? analytics.upcomingCheckIns.length : "—"}
        />
        <MetricCard
          icon={Users2}
          label="Top source"
          value={
            analytics && analytics.bookingsBySource.length
              ? analytics.bookingsBySource.reduce((a, b) => (b.count > a.count ? b : a)).source
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
        {/* Revenue by month */}
        <div className="bg-white border border-[#E3DBC9] rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6455] mb-3">Revenue by month</div>
          {analytics ? (
            <div className="flex items-end gap-3 h-32">
              {analytics.revenueByMonth.map((m) => {
                const max = Math.max(...analytics.revenueByMonth.map((x) => x.revenue), 1);
                const hasRevenue = m.revenue > 0;
                const heightPct = hasRevenue ? Math.max(6, (m.revenue / max) * 100) : 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-end h-24">
                      {hasRevenue ? (
                        <div
                          className="w-full rounded-t-md bg-[#0B3D3C]"
                          style={{ height: `${heightPct}%` }}
                          title={money(m.revenue)}
                        />
                      ) : (
                        // A real zero, not a rendering glitch — a light dashed
                        // baseline reads clearly instead of an near-invisible sliver.
                        <div
                          className="w-full border-t-2 border-dashed border-[#D8D0BB]"
                          style={{ marginBottom: 0 }}
                          title="No revenue this month"
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-[#928C7C]">{monthLabel(m.month)}</div>
                    <div
                      className={"text-[9px] " + (hasRevenue ? "text-[#6B6455]" : "text-[#C9BFA5]")}
                      style={{ fontFamily: "IBM Plex Mono, monospace" }}
                    >
                      {hasRevenue ? money(m.revenue) : "\u20A60"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-[#928C7C] italic">Loading…</div>
          )}
        </div>

        {/* Occupancy */}
        <div className="bg-white border border-[#E3DBC9] rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6455] mb-3">This month</div>
          <div className="space-y-3">
            {analytics?.occupancy.map((o) => (
              <div key={o.propertyId}>
                <div className="flex items-center gap-1.5 text-sm text-[#12262A] mb-1">
                  {o.type === "shortlet" ? <Home size={13} /> : <Anchor size={13} />}
                  <span className="truncate">{o.name}</span>
                </div>
                {o.type === "shortlet" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#EFE9DA] overflow-hidden">
                      <div className="h-full bg-[#E7A63C]" style={{ width: `${o.ratePct}%` }} />
                    </div>
                    <span className="text-xs text-[#6B6455]" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                      {o.ratePct}%
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-[#6B6455]">{o.tripsThisMonth} trip{o.tripsThisMonth === 1 ? "" : "s"} booked</div>
                )}
              </div>
            ))}
            {!analytics && <div className="text-xs text-[#928C7C] italic">Loading…</div>}
          </div>
        </div>
      </div>

      {/* --- bookings table --- */}
      <div className="bg-white border border-[#E3DBC9] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#E3DBC9] flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <div className="relative flex-1 sm:min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#928C7C]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, guest name, email"
              className="w-full rounded-lg border border-[#E3DBC9] pl-8 pr-3 py-2 text-sm text-[#12262A] outline-none focus:border-[#0B3D3C]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-[#E3DBC9] px-3 py-2 text-sm text-[#12262A] bg-white outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="deposit_paid">Deposit paid</option>
            <option value="paid_in_full">Paid in full</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-[#E3DBC9] px-3 py-2 text-sm text-[#12262A] bg-white outline-none"
          >
            <option value="">Shortlet + boat</option>
            <option value="shortlet">Shortlet only</option>
            <option value="boat">Boat only</option>
          </select>
        </div>

        <div className={"overflow-x-auto transition-opacity " + (loading && bookings ? "opacity-50" : "opacity-100")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#928C7C] border-b border-[#E3DBC9]">
                <th className="px-4 py-2.5 font-medium">Ref</th>
                <th className="px-4 py-2.5 font-medium">Guest</th>
                <th className="px-4 py-2.5 font-medium">Property</th>
                <th className="px-4 py-2.5 font-medium">Dates</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                const style = STATUS_STYLES[b.paymentStatus] ?? STATUS_STYLES.pending;
                return (
                  <tr key={b._id} className="border-b border-[#F0EBDD] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#12262A] whitespace-nowrap" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                      {b.bookingRef}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#12262A] whitespace-nowrap">{b.guest?.name}</div>
                      <div className="text-xs text-[#928C7C] whitespace-nowrap">{b.guest?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#3A4038] whitespace-nowrap">{b.property?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#3A4038] whitespace-nowrap">
                      {fmtDate(b.startDateTime)} → {fmtDate(b.endDateTime)}
                    </td>
                    <td className="px-4 py-3 text-[#3A4038] whitespace-nowrap" style={{ fontFamily: "IBM Plex Mono, monospace" }}>
                      {money(b.pricing?.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                        style={{ background: style.bg, color: style.text }}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.paymentStatus !== "cancelled" && (
                        <button
                          onClick={() => handleCancel(b.bookingRef)}
                          className="text-[#928C7C] hover:text-[#993C1D]"
                          aria-label={`Cancel ${b.bookingRef}`}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {bookings && filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#928C7C]">
                    No bookings match these filters.
                  </td>
                </tr>
              )}
              {!bookings && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#928C7C] italic">
                    Loading bookings…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Listings tab — add new shortlets/boats, edit their pricing, and manage
// photos, all without touching code. Each property is its own card: a
// summary + Edit button up top, photo grid below. "+ Add a shortlet/boat"
// opens the same form blank. Talks to /api/admin/properties (CRUD) and
// /api/admin/properties/:id/images (Cloudinary uploads).
// ---------------------------------------------------------------------------
function ListingsTab({ adminKey }) {
  const [properties, setProperties] = useState(null);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState(null); // null | { type, property? }

  const loadProperties = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/properties`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProperties(data.properties);
    } catch {
      setError(`Can't load properties from ${API_BASE}. Is the backend running?`);
    }
  }, [adminKey]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  function closeForm() {
    setFormState(null);
  }
  function afterSave() {
    closeForm();
    loadProperties();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div style={{ fontFamily: "Fraunces, serif" }} className="text-lg font-semibold text-[#12262A]">
            Listings & photos
          </div>
          <p className="text-sm text-[#6B6455] mt-1 max-w-xl">
            Add as many shortlets or boats as you like, each with its own pricing and photos — like different room
            types at a hotel. Everything here shows up automatically on the home page and booking flow.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFormState({ type: "shortlet" })}
            className="flex items-center gap-1.5 rounded-xl border border-[#0B3D3C] text-[#0B3D3C] text-sm font-semibold px-3.5 py-2 hover:bg-[#DCEAE8]"
          >
            <Plus size={14} /> Shortlet
          </button>
          <button
            onClick={() => setFormState({ type: "boat" })}
            className="flex items-center gap-1.5 rounded-xl border border-[#0B3D3C] text-[#0B3D3C] text-sm font-semibold px-3.5 py-2 hover:bg-[#DCEAE8]"
          >
            <Plus size={14} /> Boat
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex gap-1.5 rounded-lg border border-[#F0997B] bg-[#FAECE7] px-3.5 py-2.5 text-xs text-[#993C1D]">
          <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!properties && !error && <div className="text-sm text-[#928C7C] italic">Loading properties…</div>}

      {properties && properties.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E3DBC9] bg-white py-10 text-center text-sm text-[#928C7C]">
          No listings yet — add your first shortlet or boat above.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {properties?.map((p) => (
          <PropertyListingCard
            key={p._id}
            property={p}
            adminKey={adminKey}
            onChanged={loadProperties}
            onEdit={() => setFormState({ type: p.type, property: p })}
          />
        ))}
      </div>

      {formState && (
        <PropertyFormModal adminKey={adminKey} type={formState.type} property={formState.property} onClose={closeForm} onSaved={afterSave} />
      )}
    </div>
  );
}

function PropertyListingCard({ property, adminKey, onChanged, onEdit }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [togglingActive, setTogglingActive] = useState(false);
  const [localError, setLocalError] = useState(null);

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be picked again later
    if (!files.length) return;

    setUploading(true);
    setLocalError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      const res = await fetch(`${API_BASE}/api/admin/properties/${property._id}/images`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onChanged();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(url) {
    if (!window.confirm("Remove this photo?")) return;
    setDeletingUrl(url);
    setLocalError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/properties/${property._id}/images`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Could not remove this photo.");
      onChanged();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setDeletingUrl(null);
    }
  }

  async function handleToggleActive() {
    setTogglingActive(true);
    setLocalError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/properties/${property._id}/active`, {
        method: "PATCH",
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ active: !property.active }),
      });
      if (!res.ok) throw new Error("Could not update this listing.");
      onChanged();
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setTogglingActive(false);
    }
  }

  const priceLine =
    property.type === "shortlet"
      ? `${money(property.shortlet?.weekdayRate)} weekday · ${money(property.shortlet?.weekendRate)} weekend`
      : (property.boat?.durations ?? []).map((d) => `${d.label} ${money(d.price)}`).join(" · ") || "No durations set";

  return (
    <div className={"bg-white border rounded-2xl p-4 " + (property.active ? "border-[#E3DBC9]" : "border-[#E3DBC9] opacity-60")}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#12262A] min-w-0">
          {property.type === "shortlet" ? <Home size={14} className="flex-shrink-0" /> : <Anchor size={14} className="flex-shrink-0" />}
          <span className="truncate">{property.name}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          <button onClick={onEdit} aria-label="Edit listing" className="p-1.5 rounded-lg text-[#6B6455] hover:bg-[#EFE9DA] hover:text-[#0B3D3C]">
            <Pencil size={14} />
          </button>
          <button
            onClick={handleToggleActive}
            disabled={togglingActive}
            aria-label={property.active ? "Deactivate listing" : "Activate listing"}
            className="p-1.5 rounded-lg text-[#6B6455] hover:bg-[#EFE9DA] hover:text-[#0B3D3C]"
          >
            {togglingActive ? <Loader2 size={14} className="animate-spin" /> : property.active ? <Power size={14} /> : <Ban size={14} />}
          </button>
        </div>
      </div>
      <div className="text-xs text-[#6B6455] mb-1">{!property.active && "Hidden from site · "}{priceLine}</div>
      {property.summary && <p className="text-xs text-[#928C7C] mb-3 line-clamp-2">{property.summary}</p>}

      {property.images?.length ? (
        <div className="grid grid-cols-3 gap-2 mb-3 mt-2">
          {property.images.map((url, i) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-[#E3DBC9]">
              <img src={url} alt={`${property.name} photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded-full bg-[#0B3D3C]/90 text-[#F7F0E2] text-[9px] px-1.5 py-0.5">
                  Cover
                </span>
              )}
              <button
                onClick={() => handleDelete(url)}
                disabled={deletingUrl === url}
                aria-label="Remove photo"
                className="absolute top-1 right-1 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                {deletingUrl === url ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 mt-2 rounded-lg border border-dashed border-[#E3DBC9] bg-[#F7F0E2] py-6 text-center text-xs text-[#928C7C]">
          No photos yet — add some below.
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelected} />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={
          "w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors " +
          (uploading ? "bg-[#EFE9DA] text-[#B0A98F] cursor-not-allowed" : "bg-[#0B3D3C] text-[#F7F0E2] hover:bg-[#0F4C4A]")
        }
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
        {uploading ? "Uploading…" : "Add photos"}
      </button>
      {localError && <p className="text-xs text-[#993C1D] mt-2">{localError}</p>}
    </div>
  );
}

// Blank templates for a new duration/add-on row.
function blankDuration() {
  return { id: "", label: "", hours: "", price: "" };
}
function blankAddOn() {
  return { id: "", label: "", price: "", perNight: false };
}

// Starter add-ons for a brand-new listing — the same ones that used to be
// hardcoded site-wide. They're just a starting point: fully editable, and
// any of them can be removed with the × button, same as a custom row added
// via "+ Add add-on".
function defaultAddOns(isBoat) {
  return isBoat
    ? [
        { id: "fuel", label: "Extended fuel range", price: 25000, perNight: false },
        { id: "catering", label: "Onboard catering", price: 35000, perNight: false },
        { id: "photo", label: "Photographer", price: 40000, perNight: false },
      ]
    : [
        { id: "early", label: "Early check-in (10am)", price: 15000, perNight: false },
        { id: "pickup", label: "Airport pickup", price: 20000, perNight: false },
        { id: "breakfast", label: "Daily breakfast", price: 10000, perNight: true },
      ];
}

// Handles both "add a new property" and "edit an existing one" — the only
// difference is whether `property` is passed in and whether type can still
// be changed.
function PropertyFormModal({ adminKey, type, property, onClose, onSaved }) {
  const isEdit = !!property;
  const isBoat = type === "boat";

  const [name, setName] = useState(property?.name ?? "");
  const [summary, setSummary] = useState(property?.summary ?? "");
  const [address, setAddress] = useState(property?.location?.address ?? "");
  const [lat, setLat] = useState(property?.location?.lat ?? "");
  const [lng, setLng] = useState(property?.location?.lng ?? "");

  const [weekdayRate, setWeekdayRate] = useState(property?.shortlet?.weekdayRate ?? "");
  const [weekendRate, setWeekendRate] = useState(property?.shortlet?.weekendRate ?? "");
  const [includedGuests, setIncludedGuests] = useState(
    (isBoat ? property?.boat?.includedGuests : property?.shortlet?.includedGuests) ?? ""
  );
  const [maxGuests, setMaxGuests] = useState(property?.shortlet?.maxGuests ?? "");
  const [capacity, setCapacity] = useState(property?.boat?.capacity ?? "");
  const [extraGuestFee, setExtraGuestFee] = useState(
    (isBoat ? property?.boat?.extraGuestFee : property?.shortlet?.extraGuestFee) ?? ""
  );
  const [minNights, setMinNights] = useState(property?.shortlet?.minNights ?? 1);
  const [peakSurchargePct, setPeakSurchargePct] = useState(property?.boat?.peakSurchargePct ?? 20);

  const [durations, setDurations] = useState(
    property?.boat?.durations?.length ? property.boat.durations.map((d) => ({ ...d })) : isBoat ? [blankDuration()] : []
  );
  const [addOns, setAddOns] = useState(
    property?.addOns?.length ? property.addOns.map((a) => ({ ...a })) : isEdit ? [] : defaultAddOns(isBoat)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function updateDuration(i, field, value) {
    setDurations((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }
  function updateAddOn(i, field, value) {
    setAddOns((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name,
      type,
      summary,
      location: { address, lat: lat === "" ? undefined : Number(lat), lng: lng === "" ? undefined : Number(lng) },
      addOns: addOns
        .filter((a) => a.id.trim() && a.label.trim() && a.price !== "")
        .map((a) => ({ id: a.id.trim(), label: a.label.trim(), price: Number(a.price), perNight: !!a.perNight })),
    };
    if (isBoat) {
      body.boat = {
        capacity: Number(capacity),
        includedGuests: Number(includedGuests),
        extraGuestFee: extraGuestFee === "" ? 0 : Number(extraGuestFee),
        peakSurchargePct: Number(peakSurchargePct),
        durations: durations
          .filter((d) => d.id.trim() && d.label.trim() && d.hours !== "" && d.price !== "")
          .map((d) => ({ id: d.id.trim(), label: d.label.trim(), hours: Number(d.hours), price: Number(d.price) })),
      };
    } else {
      body.shortlet = {
        weekdayRate: Number(weekdayRate),
        weekendRate: Number(weekendRate),
        includedGuests: Number(includedGuests),
        maxGuests: Number(maxGuests),
        extraGuestFee: extraGuestFee === "" ? 0 : Number(extraGuestFee),
        minNights: Number(minNights) || 1,
      };
    }

    try {
      const url = isEdit ? `${API_BASE}/api/admin/properties/${property._id}` : `${API_BASE}/api/admin/properties`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save this listing.");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl p-5 my-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-lg font-semibold text-[#12262A]" style={{ fontFamily: "Fraunces, serif" }}>
            {isBoat ? <Anchor size={16} /> : <Home size={16} />}
            {isEdit ? `Edit ${isBoat ? "boat" : "shortlet"}` : `Add a ${isBoat ? "boat" : "shortlet"}`}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-[#928C7C] hover:text-[#12262A]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          <FormField label="Name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. 3-Bed Waterfront Villa — Ikate" />
          </FormField>
          <FormField label="Short summary (optional)">
            <input value={summary} onChange={(e) => setSummary(e.target.value)} className="form-input" placeholder="e.g. Breezy 2-bed with a private jetty" />
          </FormField>
          <FormField label="Location address">
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" placeholder="e.g. Ikate, Lekki, Lagos" />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Latitude (optional)">
              <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="form-input" placeholder="6.4419" />
            </FormField>
            <FormField label="Longitude (optional)">
              <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} className="form-input" placeholder="3.4736" />
            </FormField>
          </div>

          {isBoat ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Capacity (max passengers)">
                  <input required type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="form-input" />
                </FormField>
                <FormField label="Guests included in base price">
                  <input required type="number" min="1" value={includedGuests} onChange={(e) => setIncludedGuests(e.target.value)} className="form-input" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Extra passenger fee">
                  <input type="number" min="0" value={extraGuestFee} onChange={(e) => setExtraGuestFee(e.target.value)} className="form-input" />
                </FormField>
                <FormField label="Weekend/peak surcharge %">
                  <input type="number" min="0" value={peakSurchargePct} onChange={(e) => setPeakSurchargePct(e.target.value)} className="form-input" />
                </FormField>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6455] mb-1.5">Trip durations</div>
                <div className="space-y-2">
                  {durations.map((d, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_70px_90px_28px] gap-1.5 items-center">
                      <input placeholder="id e.g. 2hr" value={d.id} onChange={(e) => updateDuration(i, "id", e.target.value)} className="form-input text-xs" />
                      <input placeholder="Label" value={d.label} onChange={(e) => updateDuration(i, "label", e.target.value)} className="form-input text-xs" />
                      <input placeholder="Hrs" type="number" step="0.5" value={d.hours} onChange={(e) => updateDuration(i, "hours", e.target.value)} className="form-input text-xs" />
                      <input placeholder="Price" type="number" value={d.price} onChange={(e) => updateDuration(i, "price", e.target.value)} className="form-input text-xs" />
                      <button type="button" onClick={() => setDurations((rows) => rows.filter((_, idx) => idx !== i))} className="text-[#928C7C] hover:text-[#993C1D]">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDurations((rows) => [...rows, blankDuration()])}
                  className="mt-1.5 text-xs font-medium text-[#0B3D3C] flex items-center gap-1"
                >
                  <Plus size={12} /> Add duration
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Weekday rate (per night)">
                  <input required type="number" min="0" value={weekdayRate} onChange={(e) => setWeekdayRate(e.target.value)} className="form-input" />
                </FormField>
                <FormField label="Weekend rate (per night)">
                  <input required type="number" min="0" value={weekendRate} onChange={(e) => setWeekendRate(e.target.value)} className="form-input" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Guests included">
                  <input required type="number" min="1" value={includedGuests} onChange={(e) => setIncludedGuests(e.target.value)} className="form-input" />
                </FormField>
                <FormField label="Max guests">
                  <input required type="number" min="1" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className="form-input" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Extra guest fee (per night)">
                  <input type="number" min="0" value={extraGuestFee} onChange={(e) => setExtraGuestFee(e.target.value)} className="form-input" />
                </FormField>
                <FormField label="Minimum nights">
                  <input type="number" min="1" value={minNights} onChange={(e) => setMinNights(e.target.value)} className="form-input" />
                </FormField>
              </div>
            </>
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6455] mb-1.5">Add-ons (optional)</div>
            {!isEdit && addOns.length > 0 && (
              <p className="text-[11px] text-[#928C7C] mb-1.5">
                We've filled in a few common ones — edit the price, rename them, or remove any with ×.
              </p>
            )}
            <div className="space-y-2">
              {addOns.map((a, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_auto_28px] gap-1.5 items-center">
                  <input placeholder="id e.g. breakfast" value={a.id} onChange={(e) => updateAddOn(i, "id", e.target.value)} className="form-input text-xs" />
                  <input placeholder="Label" value={a.label} onChange={(e) => updateAddOn(i, "label", e.target.value)} className="form-input text-xs" />
                  <input placeholder="Price" type="number" value={a.price} onChange={(e) => updateAddOn(i, "price", e.target.value)} className="form-input text-xs" />
                  <label className="flex items-center gap-1 text-[10px] text-[#6B6455] whitespace-nowrap">
                    <input type="checkbox" checked={!!a.perNight} onChange={(e) => updateAddOn(i, "perNight", e.target.checked)} />
                    /night
                  </label>
                  <button type="button" onClick={() => setAddOns((rows) => rows.filter((_, idx) => idx !== i))} className="text-[#928C7C] hover:text-[#993C1D]">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddOns((rows) => [...rows, blankAddOn()])}
              className="mt-1.5 text-xs font-medium text-[#0B3D3C] flex items-center gap-1"
            >
              <Plus size={12} /> Add add-on
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex gap-1.5 rounded-lg border border-[#F0997B] bg-[#FAECE7] px-3 py-2 text-xs text-[#993C1D]">
            <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-[#E3DBC9] text-[#12262A]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold bg-[#0B3D3C] text-[#F7F0E2] hover:bg-[#0F4C4A] disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : "Save listing"}
          </button>
        </div>

        <style>{`.form-input { width: 100%; border-radius: 0.75rem; border: 1px solid #E3DBC9; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #12262A; outline: none; } .form-input:focus { border-color: #0B3D3C; }`}</style>
      </form>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <div className="text-xs text-[#6B6455] mb-1">{label}</div>
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-[#E3DBC9] rounded-2xl p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#6B6455] mb-2">
        <Icon size={13} />
        {label}
      </div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace" }} className="text-lg font-semibold text-[#12262A] truncate">
        {value}
      </div>
    </div>
  );
}
