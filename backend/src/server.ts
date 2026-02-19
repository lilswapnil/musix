import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { recommendationsRouter } from "./routes/recommendations.js";
import { spotifyRouter } from "./routes/spotify.js";
import { spotifyTokenRouter } from "./routes/spotifyToken.js";
import { deezerRouter } from "./routes/deezer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export function createServer() {
  const app = express();

  // Support single origin or comma-separated list
  const defaultOrigins = [
    "http://127.0.0.1:5174",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ];
  const envOrigins = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow non-browser clients (curl/postman) with no Origin header
        if (!origin) return cb(null, true);

        if (allowedOrigins.includes(origin)) return cb(null, true);

        return cb(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/me", meRouter);
  app.use("/api/recommendations", recommendationsRouter);
  app.use("/api/spotify", spotifyRouter);
  app.use("/api/spotify", spotifyTokenRouter);
  app.use("/api/deezer", deezerRouter);

  // Root route handler to prevent 404 on GET /
  app.get("/", (req, res) => {
    res.status(200).send({ message: "Musix backend is running." });
  });

  return app;
}
