import { Router } from "express";
import { spotifyFetch } from "../spotify/spotifyClient.js";
import { getValidAccessToken, setTokens } from "../spotify/tokenStore.js";

export const spotifyRouter = Router();

const getSpotifyClientId = () => process.env.SPOTIFY_CLIENT_ID ?? "";
const getSpotifyRedirectUri = () => process.env.SPOTIFY_REDIRECT_URI ?? "";
const getSpotifyLocalRedirectUri = () => process.env.SPOTIFY_LOCAL_REDIRECT_URI ?? "";

const splitUris = (value: string) =>
  value
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);

const addHostVariants = (uri: string) => {
  if (uri.includes("127.0.0.1")) return [uri, uri.replace("127.0.0.1", "localhost")];
  if (uri.includes("localhost")) return [uri, uri.replace("localhost", "127.0.0.1")];
  return [uri];
};

const isAllowedRedirectUri = (redirectUri: string) => {
  if (!redirectUri) return false;
  const allowed = new Set<string>();
  splitUris(getSpotifyRedirectUri()).forEach((uri) => {
    addHostVariants(uri).forEach((variant) => allowed.add(variant));
  });
  splitUris(getSpotifyLocalRedirectUri()).forEach((uri) => {
    addHostVariants(uri).forEach((variant) => allowed.add(variant));
  });
  return allowed.has(redirectUri);
};

spotifyRouter.post("/auth/token", async (req, res) => {
  try {
    const { code, codeVerifier, redirectUri } = req.body ?? {};
    if (!code || !codeVerifier || !redirectUri) {
      return res.status(400).json({ error: "Missing code, codeVerifier, or redirectUri" });
    }
    const spotifyClientId = getSpotifyClientId();
    if (!spotifyClientId) {
      return res.status(500).json({ error: "Missing SPOTIFY_CLIENT_ID configuration" });
    }
    if (!isAllowedRedirectUri(redirectUri)) {
      return res.status(400).json({ error: "Invalid redirectUri" });
    }

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: spotifyClientId,
        code_verifier: codeVerifier
      }).toString()
    });

    const data = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        error: data?.error_description || data?.error || "Failed to exchange token"
      });
    }

    setTokens(data?.access_token, data?.refresh_token, data?.expires_in);
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to exchange token" });
  }
});

spotifyRouter.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refreshToken" });
    }
    const spotifyClientId = getSpotifyClientId();
    if (!spotifyClientId) {
      return res.status(500).json({ error: "Missing SPOTIFY_CLIENT_ID configuration" });
    }

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: spotifyClientId
      }).toString()
    });

    const data = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        error: data?.error_description || data?.error || "Failed to refresh token"
      });
    }

    setTokens(data?.access_token, data?.refresh_token, data?.expires_in);
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to refresh token" });
  }
});

spotifyRouter.all("/*", async (req, res) => {
  try {
    const auth = req.header("Authorization") ?? "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
    const token = headerToken ?? (await getValidAccessToken());
    if (!token) return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });

    const pathWithQuery = req.url;
    const method = req.method as "GET" | "POST" | "PUT" | "DELETE";
    const body = req.body && Object.keys(req.body).length > 0 ? req.body : undefined;

    const data = await spotifyFetch<any>(token, pathWithQuery, method, body);
    if (data === null || data === undefined) {
      return res.status(204).send();
    }
    return res.json(data);
  } catch (e: any) {
    const status = e?.status ?? 500;
    return res.status(status).json({
      error: e?.message ?? "Spotify proxy failed",
      retryAfter: e?.retryAfter
    });
  }
});
