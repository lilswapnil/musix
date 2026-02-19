import { Router } from "express";
import { z } from "zod";

export const deezerRouter = Router();

const isValidDeezerUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "api.deezer.com";
  } catch {
    return false;
  }
};

const QuerySchema = z.object({
  url: z.string().url(),
});

deezerRouter.get("/", async (req, res) => {
  try {
    const { url } = QuerySchema.parse(req.query);

    if (!isValidDeezerUrl(url)) {
      res.status(400).json({ error: "Invalid Deezer URL" });
      return;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const text = await response.text();
    res.setHeader("Content-Type", "application/json");
    res.status(response.status).send(text || "{}");
  } catch (error) {
    console.error("Deezer proxy error:", error);
    res.status(500).json({ error: "Deezer proxy failed" });
  }
});
