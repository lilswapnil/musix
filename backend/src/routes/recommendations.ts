import { Router } from "express";
import { z } from "zod";
import { buildRecommendations } from "../spotify/recommend.js";

export const recommendationsRouter = Router();

const QuerySchema = z.object({
  limit: z.string().optional(),
  time_range: z.enum(["short_term", "medium_term", "long_term"]).optional()
});

recommendationsRouter.get("/", async (req, res) => {
  try {
    const auth = req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });

    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

    const limit = parsed.data.limit ? Math.min(Math.max(Number(parsed.data.limit), 1), 50) : 25;
    const timeRange = parsed.data.time_range ?? "medium_term";

    const result = await buildRecommendations(token, { limit, timeRange });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to build recommendations" });
  }
});
