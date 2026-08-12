import { Router } from "express";
import { requireAdminKey } from "../middleware/adminAuth";
import { uploadPropertyImages } from "../middleware/upload";
import {
  listBookings,
  cancelBookingAdmin,
  getAnalytics,
  listPropertiesAdmin,
  createProperty,
  updateProperty,
  setPropertyActive,
  uploadPropertyImagesHandler,
  deletePropertyImageHandler,
  reorderPropertyImagesHandler,
} from "../controllers/adminController";

const router = Router();

router.use(requireAdminKey);

router.get("/bookings", listBookings);
router.post("/bookings/:ref/cancel", cancelBookingAdmin);
router.get("/analytics", getAnalytics);

// Listings tab: add/edit properties and manage their photos — no coding
// required for either. Each type ("shortlet" or "boat") can have as many
// properties as the owner wants, each with its own pricing and photos.
router.get("/properties", listPropertiesAdmin);
router.post("/properties", createProperty);
router.put("/properties/:id", updateProperty);
router.patch("/properties/:id/active", setPropertyActive);
router.post("/properties/:id/images", uploadPropertyImages.array("images", 10), uploadPropertyImagesHandler);
router.delete("/properties/:id/images", deletePropertyImageHandler);
router.put("/properties/:id/images/reorder", reorderPropertyImagesHandler);

export default router;
