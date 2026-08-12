import { Schema, model, InferSchemaType } from "mongoose";

const addOnSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    perNight: { type: Boolean, default: false },
  },
  { _id: false }
);

const boatDurationSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    hours: { type: Number, required: true, min: 0.5 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// External calendar feeds (Airbnb / Booking.com) this property syncs against,
// so a booking made elsewhere still blocks it here.
const externalCalendarSchema = new Schema(
  {
    source: { type: String, enum: ["airbnb", "booking_com", "google"], required: true },
    icalUrl: { type: String, required: true },
    lastSyncedAt: { type: Date },
  },
  { _id: false }
);

const propertySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["shortlet", "boat"], required: true },
    // One-line blurb shown on listing cards, e.g. "Breezy 2-bed with a private
    // jetty" — keeps cards scannable when there are several properties of the
    // same type to choose between.
    summary: { type: String, trim: true, default: "" },
    location: {
      address: { type: String, required: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    active: { type: Boolean, default: true },

    // Cloudinary URLs, owner-managed from the admin dashboard (Photos tab).
    // First image in the array is treated as the cover photo everywhere on
    // the guest-facing site.
    images: { type: [String], default: [] },

    // --- shortlet-only pricing config ---
    shortlet: {
      weekdayRate: { type: Number, min: 0 },
      weekendRate: { type: Number, min: 0 },
      includedGuests: { type: Number, min: 1 },
      maxGuests: { type: Number, min: 1 },
      extraGuestFee: { type: Number, min: 0 },
      minNights: { type: Number, min: 1, default: 1 },
    },

    // --- boat-only pricing config ---
    boat: {
      capacity: { type: Number, min: 1 },
      includedGuests: { type: Number, min: 1 },
      extraGuestFee: { type: Number, min: 0 },
      peakSurchargePct: { type: Number, min: 0, default: 20 }, // % added on Fri/Sat/Sun
      durations: { type: [boatDurationSchema], default: [] },
    },

    addOns: { type: [addOnSchema], default: [] },
    cancellationPolicy: { type: String, default: "Full refund up to 7 days before check-in/departure." },
    externalCalendars: { type: [externalCalendarSchema], default: [] },
  },
  { timestamps: true }
);

propertySchema.index({ type: 1, active: 1 });

export type PropertyDoc = InferSchemaType<typeof propertySchema>;
export const Property = model("Property", propertySchema);
