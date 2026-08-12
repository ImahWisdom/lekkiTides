import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import propertyRoutes from "./routes/propertyRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import adminRoutes from "./routes/adminRoutes";
import { handlePaystackWebhook } from "./controllers/paymentController";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((s) => s.trim());
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));

// The Paystack webhook must be mounted BEFORE express.json() below, using
// express.raw(), because the signature is an HMAC over the exact raw bytes
// of the request body. Parsing it to JSON first would make verification
// impossible to reproduce.
app.post(
  "/api/payments/paystack/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    (req as any).rawBody = req.body; // Buffer, thanks to express.raw()
    next();
  },
  handlePaystackWebhook
);

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB — check MONGODB_URI in .env", err);
    process.exit(1);
  });
