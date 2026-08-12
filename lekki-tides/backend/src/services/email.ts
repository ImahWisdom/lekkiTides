// Confirmation emails via Resend (same provider you already use on
// NaijaStyle Atelier, so the account/domain setup pattern is familiar).
// Needs RESEND_API_KEY and EMAIL_FROM set in .env — see README.

const RESEND_BASE = "https://api.resend.com";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(n: number): string {
  return "\u20A6" + Math.round(n).toLocaleString("en-NG");
}

interface ConfirmationEmailParams {
  to: string;
  guestName: string;
  bookingRef: string;
  propertyName: string;
  propertyType: "shortlet" | "boat";
  startDateTime: Date;
  endDateTime: Date;
  amountPaid: number;
  balanceDue: number;
  mapsUrl?: string;
  viewBookingUrl?: string;
}

function buildHtml(p: ConfirmationEmailParams): string {
  const dateLine =
    p.propertyType === "shortlet"
      ? `${fmtDate(p.startDateTime)} \u2192 ${fmtDate(p.endDateTime)}`
      : `${fmtDate(p.startDateTime)}`;

  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #12262A;">
    <div style="background:#0B3D3C; color:#F7F0E2; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <div style="font-size: 20px; font-weight: 700;">Lekki Tides</div>
      <div style="font-size: 13px; color:#B7D2CF;">Booking confirmed</div>
    </div>
    <div style="border: 1px solid #E3DBC9; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
      <p>Hi ${p.guestName},</p>
      <p>Your deposit has been received and your booking is confirmed. Here are the details:</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#6B6455;">Booking reference</td><td style="padding:6px 0; text-align:right; font-weight:600;">${p.bookingRef}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">Property</td><td style="padding:6px 0; text-align:right;">${p.propertyName}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">${p.propertyType === "shortlet" ? "Dates" : "Date"}</td><td style="padding:6px 0; text-align:right;">${dateLine}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">Amount paid</td><td style="padding:6px 0; text-align:right; font-weight:600; color:#0B3D3C;">${fmtMoney(p.amountPaid)}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">Balance due ${p.propertyType === "shortlet" ? "at check-in" : "on the day"}</td><td style="padding:6px 0; text-align:right;">${fmtMoney(p.balanceDue)}</td></tr>
      </table>
      ${p.mapsUrl ? `<p><a href="${p.mapsUrl}" style="color:#0B3D3C;">Get directions \u2192</a></p>` : ""}
      ${p.viewBookingUrl ? `<p><a href="${p.viewBookingUrl}" style="color:#0B3D3C;">View your booking online \u2192</a></p>` : ""}
      <p style="font-size: 13px; color:#6B6455;">House rules and check-in instructions will follow separately. Reply to this email if you have any questions before your ${p.propertyType === "shortlet" ? "stay" : "trip"}.</p>
    </div>
  </div>`;
}

interface ReferenceEmailParams {
  to: string;
  guestName: string;
  bookingRef: string;
  propertyName: string;
  propertyType: "shortlet" | "boat";
  startDateTime: Date;
  endDateTime: Date;
  depositDue: number;
  viewBookingUrl: string;
}

function buildReferenceHtml(p: ReferenceEmailParams): string {
  const dateLine =
    p.propertyType === "shortlet"
      ? `${fmtDate(p.startDateTime)} \u2192 ${fmtDate(p.endDateTime)}`
      : `${fmtDate(p.startDateTime)}`;

  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #12262A;">
    <div style="background:#0B3D3C; color:#F7F0E2; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <div style="font-size: 20px; font-weight: 700;">Lekki Tides</div>
      <div style="font-size: 13px; color:#B7D2CF;">Your booking reference</div>
    </div>
    <div style="border: 1px solid #E3DBC9; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
      <p>Hi ${p.guestName},</p>
      <p>We've started your booking, but it isn't confirmed yet \u2014 that happens once your deposit is paid. Keep this
      email in case you need to come back and finish paying, or look up your booking later.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#6B6455;">Booking reference</td><td style="padding:6px 0; text-align:right; font-weight:600;">${p.bookingRef}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">Property</td><td style="padding:6px 0; text-align:right;">${p.propertyName}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">${p.propertyType === "shortlet" ? "Dates" : "Date"}</td><td style="padding:6px 0; text-align:right;">${dateLine}</td></tr>
        <tr><td style="padding:6px 0; color:#6B6455;">Deposit due</td><td style="padding:6px 0; text-align:right; font-weight:600; color:#0B3D3C;">${fmtMoney(p.depositDue)}</td></tr>
      </table>
      <p><a href="${p.viewBookingUrl}" style="color:#0B3D3C; font-weight:600;">View your booking &amp; pay \u2192</a></p>
      <p style="font-size: 13px; color:#6B6455;">Dates aren't held until the deposit is paid, so if someone else books
      the same dates first, this hold can be lost. If you've already paid and are seeing this, you can ignore it.</p>
    </div>
  </div>`;
}

// Fires the moment a booking is created (before payment) — this is the only
// guaranteed record a guest gets if they abandon checkout before paying,
// since the full confirmation email only sends after the deposit succeeds.
export async function sendBookingReferenceEmail(params: ReferenceEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or EMAIL_FROM not set \u2014 skipping reference email.");
    return;
  }

  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: `Your booking reference \u2014 ${params.bookingRef}`,
      html: buildReferenceHtml(params),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend reference email failed:", res.status, text);
  }
}

export async function sendBookingConfirmationEmail(params: ConfirmationEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("RESEND_API_KEY or EMAIL_FROM not set \u2014 skipping confirmation email.");
    return;
  }

  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: `Booking confirmed \u2014 ${params.bookingRef}`,
      html: buildHtml(params),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend email failed:", res.status, text);
  }
}

