import { v2 as cloudinary } from "cloudinary";

// Same Cloudinary account/pattern used on NaijaStyle Atelier — reuse that
// cloud name here if you'd rather not create a second account, or spin up a
// new one specifically for Lekki Tides. Either way, set all three env vars.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
