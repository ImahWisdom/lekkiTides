import { Request, Response, NextFunction } from "express";

// This is intentionally minimal: a single shared key from an env var, checked
// on every admin request. It stops a random visitor from hitting /api/admin/*,
// but it is NOT a real auth system — no per-owner accounts, no sessions, no
// 2FA. Treat this as a placeholder until real owner login is built (checklist
// item #24, admin login security).
export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_API_KEY is not configured on the server." });
  }
  const provided = req.header("x-admin-key");
  if (provided !== expected) {
    return res.status(401).json({ error: "Invalid or missing admin key." });
  }
  next();
}
