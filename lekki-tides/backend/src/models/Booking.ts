import { Schema, model, InferSchemaType, Types } from "mongoose";

const lineItemSchema = new Schema(
  { label: { type: String, required: true }, amount: { type: Number, required: true } },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    type: { type: String, enum: ["deposit", "balance"], required: true },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // NGN, not kobo
    status: { type: String, enum: ["initiated", "success", "failed"], default: "initiated" },
    authorizationUrl: { type: String },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

const bookingSchema = new Schema(
  {
    bookingRef: { type: String, required: true, unique: true, index: true },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    propertyType: { type: String, enum: ["shortlet", "boat"], required: true },

    guest: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },

    guests: { type: Number, required: true, min: 1 },

    // Every booking — shortlet or boat — is normalized to a start/end instant.
    // A boat trip is startDateTime -> startDateTime + duration hours.
    // This lets availability checks use one overlap query for both types.
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },

    durationId: { type: String }, // boat only, e.g. "sunset"
    addOnIds: { type: [String], default: [] },

    pricing: {
      lineItems: { type: [lineItemSchema], default: [] },
      subtotal: { type: Number, required: true },
      deposit: { type: Number, required: true },
      balance: { type: Number, required: true },
      currency: { type: String, default: "NGN" },
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "deposit_paid", "paid_in_full", "cancelled"],
      default: "pending",
    },
    payments: { type: [paymentSchema], default: [] },

    source: { type: String, enum: ["direct", "airbnb", "booking_com"], default: "direct" },
  },
  { timestamps: true }
);

// Fast overlap lookups: "find anything on this property whose range intersects mine"
bookingSchema.index({ property: 1, startDateTime: 1, endDateTime: 1 });


export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId };
export const Booking = model("Booking", bookingSchema);
