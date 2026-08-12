import "dotenv/config";
import { connectDB } from "./config/db";
import { Property } from "./models/Property";
import mongoose from "mongoose";

async function seed() {
  await connectDB();

  await Property.deleteMany({});

  await Property.create([
    {
      name: "3-Bed Waterfront Villa \u2014 Ikate, Lekki",
      type: "shortlet",
      location: { address: "Ikate, Lekki, Lagos", lat: 6.4419, lng: 3.4736 },
      shortlet: {
        weekdayRate: 85000,
        weekendRate: 120000,
        includedGuests: 4,
        maxGuests: 6,
        extraGuestFee: 5000,
        minNights: 1,
      },
      addOns: [
        { id: "early", label: "Early check-in (10am)", price: 15000, perNight: false },
        { id: "pickup", label: "Airport pickup", price: 20000, perNight: false },
        { id: "breakfast", label: "Daily breakfast", price: 10000, perNight: true },
      ],
    },
    {
      name: "42ft Cruiser \u2014 Landmark Marina",
      type: "boat",
      location: { address: "Landmark Marina, Victoria Island, Lagos", lat: 6.4304, lng: 3.4304 },
      boat: {
        capacity: 8,
        includedGuests: 6,
        extraGuestFee: 5000,
        peakSurchargePct: 20,
        durations: [
          { id: "2hr", label: "2 hr harbour run", hours: 2, price: 150000 },
          { id: "4hr", label: "4 hr island hop", hours: 4, price: 250000 },
          { id: "sunset", label: "Sunset cruise", hours: 3, price: 300000 },
        ],
      },
      addOns: [
        { id: "fuel", label: "Extended fuel range", price: 25000, perNight: false },
        { id: "catering", label: "Onboard catering", price: 35000, perNight: false },
        { id: "photo", label: "Photographer", price: 40000, perNight: false },
      ],
    },
  ]);

  console.log("Seeded 2 properties.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
