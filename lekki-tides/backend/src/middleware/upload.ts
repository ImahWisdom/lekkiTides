import multer from "multer";

// Memory storage — files land in req.files as buffers, which the admin
// controller streams straight to Cloudinary. Nothing touches disk, which
// matters on Render's ephemeral filesystem.
const storage = multer.memoryStorage();

function imageFileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed."));
  }
  cb(null, true);
}

export const uploadPropertyImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 }, // 8MB per photo, up to 10 at once
});
