import { Router } from "express";
import { createBooking, getBookingByRef, cancelBooking } from "../controllers/bookingController";

const router = Router();

router.post("/", createBooking);
router.get("/:ref", getBookingByRef);
router.post("/:ref/cancel", cancelBooking);

export default router;
