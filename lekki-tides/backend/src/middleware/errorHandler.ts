import { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on our end. Please try again." });
}
