import { Request, Response } from "express";
import { Readable } from "stream";
import { Booking } from "../models/Booking";
import { Property } from "../models/Property";
import cloudinary from "../config/cloudinary";

// --- property + photo management (owner dashboard "Photos" tab) ---------

export async function listPropertiesAdmin(req: Request, res: Response) {
  // Unlike the public listProperties, this includes inactive properties too,
  // so the owner can still manage photos on something they've temporarily hidden.
  const properties = await Property.find({}).sort({ createdAt: -1 });
  res.json({ properties });
}

interface PropertyPayload {
  name?: string;
  type?: "shortlet" | "boat";
  summary?: string;
  location?: { address?: string; lat?: number; lng?: number };
  shortlet?: {
    weekdayRate?: number;
    weekendRate?: number;
    includedGuests?: number;
    maxGuests?: number;
    extraGuestFee?: number;
    minNights?: number;
  };
  boat?: {
    capacity?: number;
    includedGuests?: number;
    extraGuestFee?: number;
    peakSurchargePct?: number;
    durations?: { id: string; label: string; hours: number; price: number }[];
  };
  addOns?: { id: string; label: string; price: number; perNight?: boolean }[];
}

// Shared validation for both create and update — every one of these fields
// feeds straight into pricing.ts, so a gap here becomes a guest-facing
// "Property is missing pricing configuration" error at checkout instead of
// a clear message here when the owner saves the form.
function validatePropertyPayload(body: PropertyPayload, type: "shortlet" | "boat"): string | null {
  if (!body.name?.trim()) return "Name is required.";
  if (!body.location?.address?.trim()) return "Location address is required.";

  if (type === "shortlet") {
    const s = body.shortlet;
    if (!s || !s.weekdayRate || !s.weekendRate || !s.includedGuests || !s.maxGuests) {
      return "Weekday rate, weekend rate, included guests, and max guests are all required for a shortlet.";
    }
    if (s.includedGuests > s.maxGuests) return "Included guests can't be more than max guests.";
  } else {
    const b = body.boat;
    if (!b || !b.capacity || !b.includedGuests) {
      return "Capacity and included guests are required for a boat.";
    }
    if (b.includedGuests > b.capacity) return "Included guests can't be more than capacity.";
    if (!b.durations?.length) return "Add at least one trip duration with a price.";
    for (const d of b.durations) {
      if (!d.id?.trim() || !d.label?.trim() || !d.hours || d.price == null) {
        return "Every duration needs an id, label, hours, and price.";
      }
    }
  }

  for (const a of body.addOns ?? []) {
    if (!a.id?.trim() || !a.label?.trim() || a.price == null) {
      return "Every add-on needs an id, label, and price.";
    }
  }
  return null;
}

export async function createProperty(req: Request, res: Response) {
  const body = req.body as PropertyPayload;
  if (body.type !== "shortlet" && body.type !== "boat") {
    return res.status(400).json({ error: "type must be 'shortlet' or 'boat'." });
  }

  const error = validatePropertyPayload(body, body.type);
  if (error) return res.status(400).json({ error });

  const property = await Property.create({
    name: body.name!.trim(),
    type: body.type,
    summary: body.summary?.trim() ?? "",
    location: body.location,
    shortlet: body.type === "shortlet" ? body.shortlet : undefined,
    boat: body.type === "boat" ? body.boat : undefined,
    addOns: body.addOns ?? [],
    images: [],
    active: true,
  });

  res.status(201).json({ property });
}

export async function updateProperty(req: Request, res: Response) {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found." });

  const body = req.body as PropertyPayload;
  // type is fixed at creation — switching a listing between shortlet and
  // boat would orphan its pricing config and any bookings already made
  // against it, so that field is intentionally not editable here.
  const error = validatePropertyPayload(body, property.type as "shortlet" | "boat");
  if (error) return res.status(400).json({ error });

  property.name = body.name!.trim();
  property.summary = body.summary?.trim() ?? "";
  property.location = body.location as any;
  if (property.type === "shortlet") property.shortlet = body.shortlet as any;
  else property.boat = body.boat as any;
  property.addOns = (body.addOns ?? []) as any;

  await property.save();
  res.json({ property });
}

export async function setPropertyActive(req: Request, res: Response) {
  const { active } = req.body as { active?: boolean };
  if (typeof active !== "boolean") return res.status(400).json({ error: "active must be true or false." });

  const property = await Property.findByIdAndUpdate(req.params.id, { active }, { new: true });
  if (!property) return res.status(404).json({ error: "Property not found." });
  res.json({ property });
}

function uploadBufferToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed."));
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadPropertyImagesHandler(req: Request, res: Response) {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found." });

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) return res.status(400).json({ error: "No images were uploaded." });

  try {
    const uploadedUrls = await Promise.all(
      files.map((f) => uploadBufferToCloudinary(f.buffer, `lekki-tides/${property.type}s`))
    );
    property.images = [...(property.images ?? []), ...uploadedUrls];
    await property.save();
    res.status(201).json({ property });
  } catch (err) {
    console.error("Property image upload failed:", err);
    res.status(502).json({ error: "Could not upload one or more images to Cloudinary. Check your Cloudinary env vars." });
  }
}

export async function deletePropertyImageHandler(req: Request, res: Response) {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found." });

  const { url } = req.body as { url?: string };
  if (!url) return res.status(400).json({ error: "url is required." });

  property.images = (property.images ?? []).filter((img) => img !== url);
  await property.save();
  res.json({ property });
}

export async function reorderPropertyImagesHandler(req: Request, res: Response) {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ error: "Property not found." });

  const { images } = req.body as { images?: string[] };
  if (!Array.isArray(images)) return res.status(400).json({ error: "images must be an array of URLs." });

  // Only accept a reordering of URLs that already belong to this property —
  // never trust a client-supplied list of arbitrary URLs wholesale.
  const existing = new Set(property.images ?? []);
  const valid = images.filter((u) => existing.has(u));
  if (valid.length !== existing.size) {
    return res.status(400).json({ error: "images must be a reordering of this property's existing photos." });
  }
  property.images = valid;
  await property.save();
  res.json({ property });
}

export async function listBookings(req: Request, res: Response) {
  const { status, propertyType, from, to } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.paymentStatus = status;
  if (propertyType) filter.propertyType = propertyType;
  if (from || to) {
    filter.startDateTime = {
      ...(from ? { $gte: new Date(String(from)) } : {}),
      ...(to ? { $lte: new Date(String(to)) } : {}),
    };
  }

  const bookings = await Booking.find(filter)
    .populate("property", "name type location")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ bookings });
}

export async function cancelBookingAdmin(req: Request, res: Response) {
  const booking = await Booking.findOneAndUpdate(
    { bookingRef: req.params.ref },
    { paymentStatus: "cancelled" },
    { new: true }
  );
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  res.json({ booking });
}

const MS_DAY = 86400000;
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAnalytics(req: Request, res: Response) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const liveBookings = await Booking.find({
    paymentStatus: { $in: ["deposit_paid", "paid_in_full"] },
    createdAt: { $gte: sixMonthsAgo },
  }).select("createdAt paymentStatus pricing source propertyType property startDateTime endDateTime");

  // --- revenue actually collected, grouped by month ---
  const revenueMap = new Map<string, number>();
  for (const b of liveBookings) {
    const collected = b.paymentStatus === "paid_in_full" ? b.pricing!.subtotal : b.pricing!.deposit;
    const key = monthKey(b.createdAt as Date);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + collected);
  }
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = monthKey(d);
    return { month: key, revenue: revenueMap.get(key) ?? 0 };
  });

  // --- where bookings come from ---
  const sourceMap = new Map<string, number>();
  for (const b of liveBookings) {
    sourceMap.set(b.source, (sourceMap.get(b.source) ?? 0) + 1);
  }
  const bookingsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }));

  // --- occupancy this month, per property ---
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / MS_DAY);

  const properties = await Property.find({ active: true });
  const occupancy = [];
  for (const property of properties) {
    const bookingsThisMonth = await Booking.find({
      property: property._id,
      paymentStatus: { $in: ["deposit_paid", "paid_in_full"] },
      startDateTime: { $lt: monthEnd },
      endDateTime: { $gt: monthStart },
    });

    if (property.type === "shortlet") {
      let nightsBooked = 0;
      for (const b of bookingsThisMonth) {
        const start = b.startDateTime > monthStart ? b.startDateTime : monthStart;
        const end = b.endDateTime < monthEnd ? b.endDateTime : monthEnd;
        nightsBooked += Math.max(0, Math.round((end.getTime() - start.getTime()) / MS_DAY));
      }
      occupancy.push({
        propertyId: property._id,
        name: property.name,
        type: "shortlet",
        ratePct: Math.round((nightsBooked / daysInMonth) * 100),
      });
    } else {
      occupancy.push({
        propertyId: property._id,
        name: property.name,
        type: "boat",
        tripsThisMonth: bookingsThisMonth.length,
      });
    }
  }

  const upcomingCheckIns = await Booking.find({
    paymentStatus: { $in: ["deposit_paid", "paid_in_full"] },
    startDateTime: { $gte: now, $lte: new Date(now.getTime() + 7 * MS_DAY) },
  })
    .populate("property", "name type")
    .sort({ startDateTime: 1 });

  res.json({
    revenueByMonth,
    bookingsBySource,
    occupancy,
    totals: {
      totalBookingsLast6Months: liveBookings.length,
      totalRevenueCollected: revenueByMonth.reduce((s, m) => s + m.revenue, 0),
    },
    upcomingCheckIns,
  });
}
