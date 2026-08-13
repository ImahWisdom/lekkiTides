import { Request, Response } from "express";
import { Property } from "../models/Property";
import { Booking } from "../models/Booking";
import { priceShortletStay, priceBoatTrip, PricingError } from "../services/pricing";
import { withAvailabilityLock, AvailabilityError } from "../services/availability";
import { generateBookingRef } from "../utils/generateRef";
import { sendBookingReferenceEmail } from "../services/email";

interface CreateBookingBody {
  propertyId: string;
  guest: { name: string; email: string; phone: string };
  guests: number;
  addOnIds?: string[];
  // shortlet
  startDate?: string; // "2026-07-14"
  endDate?: string;
  // boat
  date?: string;
  durationId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createBooking(req: Request, res: Response) {
  const body = req.body as CreateBookingBody;

  if (!body.propertyId || !body.guest?.name || !body.guest?.email || !body.guest?.phone || !body.guests) {
    return res.status(400).json({ error: "Missing required booking fields." });
  }
  if (!EMAIL_RE.test(body.guest.email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const property = await Property.findById(body.propertyId);
  if (!property || !property.active) {
    return res.status(404).json({ error: "Property not found or not bookable." });
  }

  try {
    if (property.type === "shortlet") {
      if (!body.startDate || !body.endDate) {
        return res.status(400).json({ error: "startDate and endDate are required for a shortlet booking." });
      }
      const startDateTime = new Date(body.startDate);
      const endDateTime = new Date(body.endDate);

      const pricing = priceShortletStay(property, startDateTime, endDateTime, body.guests, body.addOnIds ?? []);

      const booking = await withAvailabilityLock(String(property._id), startDateTime, endDateTime, async (session) => {
        const [created] = await Booking.create(
          [
            {
              bookingRef: generateBookingRef(),
              property: property._id,
              propertyType: "shortlet",
              guest: body.guest,
              guests: body.guests,
              startDateTime,
              endDateTime,
              addOnIds: body.addOnIds ?? [],
              pricing,
              paymentStatus: "pending",
            },
          ],
          { session }
        );
        return created;
      });

      sendBookingReferenceEmail({
        to: body.guest.email,
        guestName: body.guest.name,
        bookingRef: booking.bookingRef,
        propertyName: property.name,
        propertyType: "shortlet",
        startDateTime,
        endDateTime,
        depositDue: booking.pricing!.deposit,
        viewBookingUrl: `${process.env.APP_BASE_URL ?? "http://localhost:5173"}/booking/${booking.bookingRef}`,
      }).catch((err) => console.error("Reference email failed:", err));

      return res.status(201).json({ booking });
    }

    // --- boat ---
    if (!body.date || !body.durationId) {
      return res.status(400).json({ error: "date and durationId are required for a boat booking." });
    }
    const startDateTime = new Date(body.date);
    const { breakdown, endDateTime } = priceBoatTrip(property, startDateTime, body.durationId, body.guests, body.addOnIds ?? []);

    const booking = await withAvailabilityLock(String(property._id), startDateTime, endDateTime, async (session) => {
      const [created] = await Booking.create(
        [
          {
            bookingRef: generateBookingRef(),
            property: property._id,
            propertyType: "boat",
            guest: body.guest,
            guests: body.guests,
            startDateTime,
            endDateTime,
            durationId: body.durationId,
            addOnIds: body.addOnIds ?? [],
            pricing: breakdown,
            paymentStatus: "pending",
          },
        ],
        { session }
      );
      return created;
    });

    sendBookingReferenceEmail({
      to: body.guest.email,
      guestName: body.guest.name,
      bookingRef: booking.bookingRef,
      propertyName: property.name,
      propertyType: "boat",
      startDateTime,
      endDateTime,
      depositDue: booking.pricing!.deposit,
      viewBookingUrl: `${process.env.APP_BASE_URL ?? "http://localhost:5173"}/booking/${booking.bookingRef}`,
    }).catch((err) => console.error("Reference email failed:", err));

    return res.status(201).json({ booking });
  } catch (err) {
    if (err instanceof PricingError) return res.status(422).json({ error: err.message });
    if (err instanceof AvailabilityError) return res.status(409).json({ error: err.message });
    if (err instanceof Error && err.name === "CastError") {
      return res.status(400).json({ error: "That property reference doesn't look valid. Please refresh the page and try again." });
    }
    console.error("createBooking failed:", err);
    // TEMPORARY: include the real error message in the response so it's
    // visible straight in the browser's Network tab while we're diagnosing
    // this — remove the `detail` field once the root cause is confirmed and
    // fixed, since it's not something a guest-facing API should normally leak.
    return res.status(500).json({
      error: "Could not create booking. Please try again.",
      detail: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
  }
}

export async function getBookingByRef(req: Request, res: Response) {
  const booking = await Booking.findOne({ bookingRef: req.params.ref }).populate("property", "name type location");
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  res.json({ booking });
}

export async function cancelBooking(req: Request, res: Response) {
  const booking = await Booking.findOneAndUpdate(
    { bookingRef: req.params.ref },
    { paymentStatus: "cancelled" },
    { new: true }
  );
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  res.json({ booking });
}
