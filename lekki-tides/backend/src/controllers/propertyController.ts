import { Request, Response } from "express";
import { Property } from "../models/Property";
import { Booking } from "../models/Booking";

export async function listProperties(req: Request, res: Response) {
  const { type } = req.query;
  const filter: Record<string, unknown> = { active: true };
  if (type === "shortlet" || type === "boat") filter.type = type;

  const properties = await Property.find(filter).sort({ createdAt: -1 });
  res.json({ properties });
}

export async function getProperty(req: Request, res: Response) {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found." });
  res.json({ property });
}

// Returns every blocked [start, end) range in the requested window, so the
// frontend date strip / calendar can grey out taken dates without exposing
// guest details.
export async function getAvailability(req: Request, res: Response) {
  const { id } = req.params;
  const from = req.query.from ? new Date(String(req.query.from)) : new Date();
  const to = req.query.to
    ? new Date(String(req.query.to))
    : new Date(from.getTime() + 60 * 86400000);

  const bookings = await Booking.find({
    property: id,
    paymentStatus: { $ne: "cancelled" },
    startDateTime: { $lt: to },
    endDateTime: { $gt: from },
  }).select("startDateTime endDateTime -_id");

  res.json({
    from,
    to,
    blocked: bookings.map((b) => ({ start: b.startDateTime, end: b.endDateTime })),
  });
}
