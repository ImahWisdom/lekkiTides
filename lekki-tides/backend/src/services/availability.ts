import mongoose from "mongoose";
import { Booking } from "../models/Booking";

export class AvailabilityError extends Error {}

/**
 * Two ranges overlap iff existing.start < newEnd AND existing.end > newStart.
 * We only count bookings that are still "live" — a cancelled booking never blocks.
 */
export async function isRangeAvailable(
  propertyId: string,
  startDateTime: Date,
  endDateTime: Date,
  session?: mongoose.ClientSession
): Promise<boolean> {
  const clash = await Booking.findOne({
    property: propertyId,
    paymentStatus: { $ne: "cancelled" },
    startDateTime: { $lt: endDateTime },
    endDateTime: { $gt: startDateTime },
  }).session(session ?? null);

  return !clash;
}

/**
 * Checks availability and creates the booking atomically inside a MongoDB
 * transaction, so two guests hitting "pay deposit" on the same date at the
 * same millisecond can never both succeed. Requires a replica-set deployment
 * (MongoDB Atlas is a replica set by default, so this works out of the box).
 */
export async function withAvailabilityLock<T>(
  propertyId: string,
  startDateTime: Date,
  endDateTime: Date,
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      const available = await isRangeAvailable(propertyId, startDateTime, endDateTime, session);
      if (!available) {
        throw new AvailabilityError("Those dates were just booked by someone else — please pick another date.");
      }
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
