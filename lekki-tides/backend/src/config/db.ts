import dns from "dns";
import mongoose from "mongoose";

// Node.js on Windows sometimes can't resolve MongoDB Atlas's SRV records
// using the system's default DNS servers (querySrv ECONNREFUSED). Forcing
// public DNS resolvers fixes it reliably.
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set — copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
}