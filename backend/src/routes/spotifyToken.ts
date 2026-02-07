import { Router } from "express";
import { z } from "zod";
import { getStoredToken, setStoredToken } from "../spotify/tokenStore.js";

export const spotifyTokenRouter = Router();

const getSpotifyClientId = () => process.env.SPOTIFY_CLIENT_ID ?? "";

const BodySchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return Number(value);
    },
    z.number().optional()
  )
});

spotifyTokenRouter.post("/token", (req, res) => {
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid token payload" });
  }

  setStoredToken(parsed.data.accessToken, parsed.data.expiresIn);
  return res.json({ ok: true });
});

const ExchangeSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().min(1)
});

spotifyTokenRouter.post("/auth/exchange", async (req, res) => {
  const spotifyClientId = getSpotifyClientId();
  if (!spotifyClientId) {
    return res.status(500).json({ error: "Missing SPOTIFY_CLIENT_ID" });
  }

  const parsed = ExchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid exchange payload" });
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: parsed.data.code,
      redirect_uri: parsed.data.redirectUri,
      client_id: spotifyClientId,
      code_verifier: parsed.data.codeVerifier
    }).toString();

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).send(text || "Token exchange failed");
    }

    const data = text ? JSON.parse(text) : {};
    if (data?.access_token) {
      setStoredToken(data.access_token, data.expires_in);
    }
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? "Token exchange failed" });
  }
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1)
});

spotifyTokenRouter.post("/auth/refresh", async (req, res) => {
  const spotifyClientId = getSpotifyClientId();
  if (!spotifyClientId) {
    return res.status(500).json({ error: "Missing SPOTIFY_CLIENT_ID" });
  }

  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid refresh payload" });
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: parsed.data.refreshToken,
      client_id: spotifyClientId
    }).toString();

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).send(text || "Token refresh failed");
    }

    const data = text ? JSON.parse(text) : {};
    if (data?.access_token) {
      setStoredToken(data.access_token, data.expires_in);
    }
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? "Token refresh failed" });
  }
});

spotifyTokenRouter.all("/*", async (req, res) => {
  try {
    const auth = req.header("Authorization") ?? "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    const token = headerToken || getStoredToken();
    if (!token) {
      return res.status(401).json({
        error: "Missing Authorization: Bearer <token> and no stored token"
      });
    }

    const method = req.method.toUpperCase();
    if (!["GET", "POST", "PUT", "DELETE"].includes(method)) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const path = req.url;
    if (!path || path === "/") {
      return res.status(400).json({ error: "Missing Spotify path" });
    }

    const response = await fetch(`https://api.spotify.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body:
        method === "GET"
          ? undefined
          : req.body && Object.keys(req.body).length
            ? JSON.stringify(req.body)
            : undefined
    });

    const text = await response.text();
    if (!response.ok) {
      if (text) return res.status(response.status).send(text);
      return res.status(response.status).send();
    }

    if (response.status === 204 || !text) {
      return res.status(response.status).send();
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return res.status(response.status).json(JSON.parse(text));
    }
    return res.status(response.status).send(text);
  } catch (error: any) {
    return res.status(502).json({ error: error?.message ?? "Spotify proxy failed" });
  }
});
