import { Router } from "express";
import { spotifyFetch } from "../spotify/spotifyClient.js";

export const meRouter = Router();

meRouter.get("/", async (req, res) => {
  try {
    const auth = req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

    if (!token) return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });

    const me = await spotifyFetch<any>(token, "/me");
    res.json({
      id: me.id,
      display_name: me.display_name,
      email: me.email,
      product: me.product
    });
  } catch (e: any) {
    res.status(401).json({ error: e?.message ?? "Unauthorized" });
  }
});
