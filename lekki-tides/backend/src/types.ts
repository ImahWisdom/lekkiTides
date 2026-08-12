export type PropertyType = "shortlet" | "boat";

export type PaymentStatus =
  | "pending"
  | "deposit_paid"
  | "paid_in_full"
  | "cancelled";

export type BookingSource = "direct" | "airbnb" | "booking_com";

export interface AddOnConfig {
  id: string;
  label: string;
  price: number;
  perNight: boolean; // shortlet only — boat add-ons are always flat
}

export interface BoatDurationConfig {
  id: string;
  label: string;
  hours: number;
  price: number;
}

export interface LineItem {
  label: string;
  amount: number;
}

export interface PricingBreakdown {
  lineItems: LineItem[];
  subtotal: number;
  deposit: number;
  balance: number;
  currency: "NGN";
}
