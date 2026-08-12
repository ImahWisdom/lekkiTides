import { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { Property } from "../models/Property";
import { initializeTransaction, verifyTransaction, verifyWebhookSignature, PaystackError } from "../services/paystack";
import { generateBookingRef } from "../utils/generateRef";
import { sendBookingConfirmationEmail } from "../services/email";

// A payment reference is its own ref, distinct from the booking ref, so a
// guest can retry a failed charge without colliding with the first attempt.
function generatePaymentReference(bookingRef: string): string {
  return `${bookingRef}-${generateBookingRef("PAY")}`;
}

export async function initiatePayment(req: Request, res: Response) {
  const { ref } = req.params;
  const { type } = req.body as { type: "deposit" | "balance" };

  if (type !== "deposit" && type !== "balance") {
    return res.status(400).json({ error: "type must be 'deposit' or 'balance'." });
  }

  const booking = await Booking.findOne({ bookingRef: ref });
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (booking.paymentStatus === "cancelled") {
    return res.status(409).json({ error: "This booking was cancelled." });
  }
  if (type === "deposit" && booking.paymentStatus !== "pending") {
    return res.status(409).json({ error: "Deposit has already been paid for this booking." });
  }
  if (type === "balance" && booking.paymentStatus !== "deposit_paid") {
    return res.status(409).json({ error: "Pay the deposit before paying the balance." });
  }

  const amountNaira = type === "deposit" ? booking.pricing!.deposit : booking.pricing!.balance;
  const paymentReference = generatePaymentReference(booking.bookingRef);

  try {
    const result = await initializeTransaction({
      email: booking.guest!.email,
      amountNaira,
      reference: paymentReference,
      callbackUrl: `${process.env.APP_BASE_URL ?? "http://localhost:5173"}/booking/${booking.bookingRef}`,
      metadata: { bookingRef: booking.bookingRef, type },
    });

    booking.payments.push({
      type,
      reference: paymentReference,
      amount: amountNaira,
      status: "initiated",
      authorizationUrl: result.authorizationUrl,
    } as any);
    await booking.save();

    res.json({ authorizationUrl: result.authorizationUrl, reference: paymentReference });
  } catch (err) {
    if (err instanceof PaystackError) return res.status(502).json({ error: err.message });
    console.error("initiatePayment failed:", err);
    res.status(500).json({ error: "Could not start payment. Please try again." });
  }
}

// Shared by both the webhook and the guest-facing verify fallback below —
// re-verifies a reference against Paystack directly (never trusts a client
// or webhook payload alone) and, if it's genuinely successful, applies it to
// the booking exactly once. Returns the booking's paymentStatus afterwards
// (or throws) so callers can respond appropriately.
async function verifyAndApplyPayment(reference: string): Promise<{ status: string; alreadyProcessed: boolean }> {
  const verified = await verifyTransaction(reference);

  const booking = await Booking.findOne({ "payments.reference": reference });
  if (!booking) throw new Error("No booking found for this payment reference.");

  const payment = booking.payments.find((p) => p.reference === reference);
  if (!payment) throw new Error("Payment reference not recorded on this booking.");

  if (payment.status === "success") {
    return { status: booking.paymentStatus, alreadyProcessed: true };
  }

  if (verified.status !== "success") {
    return { status: booking.paymentStatus, alreadyProcessed: false };
  }

  const type = payment.type as "deposit" | "balance";
  payment.status = "success";
  payment.verifiedAt = new Date();
  booking.paymentStatus = type === "deposit" ? "deposit_paid" : "paid_in_full";
  await booking.save();

  // Confirmation email fires once, on the deposit — that's the moment a
  // guest actually needs the "you're booked" message. A balance payment
  // doesn't need a second full confirmation.
  if (type === "deposit") {
    const property = await Property.findById(booking.property);
    const mapsUrl = property?.location?.lat && property?.location?.lng
      ? `https://www.google.com/maps/search/?api=1&query=${property.location.lat},${property.location.lng}`
      : undefined;

    await sendBookingConfirmationEmail({
      to: booking.guest!.email,
      guestName: booking.guest!.name,
      bookingRef: booking.bookingRef,
      propertyName: property?.name ?? "Your booking",
      propertyType: booking.propertyType as "shortlet" | "boat",
      startDateTime: booking.startDateTime,
      endDateTime: booking.endDateTime,
      amountPaid: booking.pricing!.deposit,
      balanceDue: booking.pricing!.balance,
      mapsUrl,
      viewBookingUrl: `${process.env.APP_BASE_URL ?? "http://localhost:5173"}/booking/${booking.bookingRef}`,
    }).catch((err) => console.error("Confirmation email failed:", err));
  }

  return { status: booking.paymentStatus, alreadyProcessed: false };
}

// Express gives us the raw body here (see routes/paymentRoutes.ts) so the
// HMAC signature check runs against the exact bytes Paystack signed.
export async function handlePaystackWebhook(req: Request, res: Response) {
  const signature = req.header("x-paystack-signature");
  const rawBody = (req as any).rawBody as Buffer;

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature." });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Malformed payload." });
  }

  // Acknowledge immediately — Paystack retries if it doesn't get a fast 200.
  res.sendStatus(200);

  if (event.event !== "charge.success") return;

  const reference: string = event.data?.reference;
  if (!reference) return;

  try {
    await verifyAndApplyPayment(reference);
  } catch (err) {
    console.error("Webhook processing failed:", err);
  }
}

// Fallback for when the webhook hasn't landed yet (or isn't reachable at all
// — e.g. Paystack's webhook URL isn't configured for this deployment, or
// you're testing against localhost, which Paystack can't reach). The guest's
// browser calls this once it's back on the confirmation page; it does the
// exact same server-to-server re-verification as the webhook, so nothing is
// ever trusted from the client — this just doesn't wait on Paystack to call us.
export async function verifyPayment(req: Request, res: Response) {
  const { ref } = req.params; // bookingRef

  const booking = await Booking.findOne({ bookingRef: ref });
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  // Verify whichever payment is still awaiting confirmation on this booking.
  const pendingPayment = [...booking.payments].reverse().find((p) => p.status === "initiated");
  if (!pendingPayment) {
    return res.json({ paymentStatus: booking.paymentStatus, checked: false });
  }

  try {
    const result = await verifyAndApplyPayment(pendingPayment.reference);
    res.json({ paymentStatus: result.status, checked: true });
  } catch (err) {
    if (err instanceof PaystackError) return res.status(502).json({ error: err.message });
    console.error("verifyPayment failed:", err);
    res.status(500).json({ error: "Could not verify this payment right now. Please try again shortly." });
  }
}
