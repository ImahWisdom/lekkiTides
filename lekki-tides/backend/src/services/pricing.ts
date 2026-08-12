import { PropertyDoc } from "../models/Property";
import { LineItem, PricingBreakdown } from "../types";

const MS_DAY = 86400000;

function isWeekendNight(d: Date): boolean {
  const dow = d.getDay();
  return dow === 5 || dow === 6; // Friday or Saturday night
}

function isPeakDay(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 5 || dow === 6; // Friday, Saturday, Sunday
}

function finalize(lineItems: LineItem[]): PricingBreakdown {
  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const deposit = Math.round(subtotal * 0.5);
  const balance = subtotal - deposit;
  return { lineItems, subtotal, deposit, balance, currency: "NGN" };
}

export class PricingError extends Error {}

export function priceShortletStay(
  property: PropertyDoc,
  startDateTime: Date,
  endDateTime: Date,
  guests: number,
  addOnIds: string[]
): PricingBreakdown {
  const cfg = property.shortlet;
  if (!cfg || !cfg.weekdayRate || !cfg.weekendRate || !cfg.maxGuests || !cfg.includedGuests) {
    throw new PricingError("Property is missing shortlet pricing configuration.");
  }

  const nights = Math.round((endDateTime.getTime() - startDateTime.getTime()) / MS_DAY);
  if (nights < (cfg.minNights ?? 1)) {
    throw new PricingError(`Minimum stay is ${cfg.minNights ?? 1} night(s).`);
  }
  if (guests > cfg.maxGuests) {
    throw new PricingError(`This property sleeps ${cfg.maxGuests} guests max.`);
  }

  const lineItems: LineItem[] = [];
  let weekdayCount = 0;
  let weekendCount = 0;
  for (let i = 0; i < nights; i++) {
    const night = new Date(startDateTime.getTime() + i * MS_DAY);
    if (isWeekendNight(night)) weekendCount++;
    else weekdayCount++;
  }
  if (weekdayCount > 0)
    lineItems.push({
      label: `${weekdayCount} weekday night(s) x ${cfg.weekdayRate}`,
      amount: weekdayCount * cfg.weekdayRate,
    });
  if (weekendCount > 0)
    lineItems.push({
      label: `${weekendCount} weekend night(s) x ${cfg.weekendRate}`,
      amount: weekendCount * cfg.weekendRate,
    });

  const extraGuests = Math.max(0, guests - cfg.includedGuests);
  if (extraGuests > 0) {
    lineItems.push({
      label: `${extraGuests} extra guest(s) x ${nights} night(s)`,
      amount: extraGuests * (cfg.extraGuestFee ?? 0) * nights,
    });
  }

  for (const addOnId of addOnIds) {
    const addOn = property.addOns?.find((a) => a.id === addOnId);
    if (!addOn) continue;
    lineItems.push({
      label: addOn.label,
      amount: addOn.perNight ? addOn.price * nights : addOn.price,
    });
  }

  return finalize(lineItems);
}

export function priceBoatTrip(
  property: PropertyDoc,
  startDateTime: Date,
  durationId: string,
  guests: number,
  addOnIds: string[]
): { breakdown: PricingBreakdown; endDateTime: Date } {
  const cfg = property.boat;
  if (!cfg || !cfg.capacity || !cfg.includedGuests || !cfg.durations?.length) {
    throw new PricingError("Property is missing boat pricing configuration.");
  }
  const duration = cfg.durations.find((d) => d.id === durationId);
  if (!duration) throw new PricingError("Unknown duration option for this boat.");
  if (guests > cfg.capacity) {
    throw new PricingError(`This boat is rated for ${cfg.capacity} passengers max.`);
  }

  const peak = isPeakDay(startDateTime);
  const surchargePct = cfg.peakSurchargePct ?? 20;
  const baseAmount = peak ? Math.round(duration.price * (1 + surchargePct / 100)) : duration.price;

  const lineItems: LineItem[] = [
    { label: `${duration.label}${peak ? " (weekend rate)" : ""}`, amount: baseAmount },
  ];

  const extraGuests = Math.max(0, guests - cfg.includedGuests);
  if (extraGuests > 0) {
    lineItems.push({
      label: `${extraGuests} extra passenger(s)`,
      amount: extraGuests * (cfg.extraGuestFee ?? 0),
    });
  }

  for (const addOnId of addOnIds) {
    const addOn = property.addOns?.find((a) => a.id === addOnId);
    if (!addOn) continue;
    lineItems.push({ label: addOn.label, amount: addOn.price });
  }

  const endDateTime = new Date(startDateTime.getTime() + duration.hours * 3600000);
  return { breakdown: finalize(lineItems), endDateTime };
}
