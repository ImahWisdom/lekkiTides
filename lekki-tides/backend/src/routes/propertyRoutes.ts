import { Router } from "express";
import { listProperties, getProperty, getAvailability } from "../controllers/propertyController";

const router = Router();

router.get("/", listProperties);
router.get("/:id", getProperty);
router.get("/:id/availability", getAvailability);

export default router;
