import { Router } from "express";
import { initiatePayment, verifyPayment } from "../controllers/paymentController";

const router = Router();

// Note: the Paystack webhook is NOT mounted here — it needs the raw request
// body for signature verification, so it's wired directly in server.ts
// ahead of the global express.json() middleware. See server.ts for why.
router.post("/:ref/initiate", initiatePayment);

// Fallback confirmation path for when the webhook hasn't fired (e.g. it
// isn't configured in the Paystack dashboard for this deployment, or you're
// testing against localhost). :ref here is the bookingRef, e.g. LT-3F8K2Q.
router.post("/:ref/verify", verifyPayment);

export default router;
