
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { healthRouter } from "./routes/health";
import { meRouter } from "./routes/me";
import { recommendationsRouter } from "./routes/recommendations";

dotenv.config();

export function createServer() {
  const app = express();

  const origin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

  app.use(
    cors({
      origin,
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/me", meRouter);
  app.use("/api/recommendations", recommendationsRouter);
  
    // Root route handler to prevent 404 on GET /
    app.get("/", (req, res) => {
      res.status(200).send({ message: "Musix backend is running." });
    });

  return app;
}
