import { Router } from "express";
import { z } from "zod";
import { buildRecommendations } from "../spotify/recommend.js";
import { getValidAccessToken } from "../spotify/tokenStore.js";

export const recommendationsRouter = Router();

const QuerySchema = z.object({
  limit: z.string().optional(),
  time_range: z.enum(["short_term", "medium_term", "long_term"]).optional(),
  track_id: z.string().optional(),
  use_current: z
    .preprocess((value) => {
      if (value === "true" || value === "1" || value === true) return true;
      if (value === "false" || value === "0" || value === false) return false;
      return undefined;
    }, z.boolean().optional())
});

recommendationsRouter.get("/", async (req, res) => {
  try {
    const auth = req.header("Authorization") ?? "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    const token = headerToken ?? (await getValidAccessToken());
    if (!token) {
      return res.status(401).json({
        error: "Missing Authorization: Bearer <token>"
      });
    }

    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

    const limit = parsed.data.limit ? Math.min(Math.max(Number(parsed.data.limit), 1), 50) : 25;
    const timeRange = parsed.data.time_range ?? "medium_term";
    const trackId = parsed.data.track_id;
    const useCurrent = parsed.data.use_current ?? true;

    const result = await buildRecommendations(token, {
      limit,
      timeRange,
      trackId,
      useCurrent
    });
    res.json({
      taste: result.taste,
      tracks: result.tracks,
      recommendations: result.tracks
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to build recommendations" });
  }
});
