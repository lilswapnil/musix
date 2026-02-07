type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

const tokens: StoredTokens = {};

const EXPIRY_BUFFER_MS = 60_000;

export function setTokens(accessToken?: string, refreshToken?: string, expiresInSeconds?: number) {
  if (accessToken) {
    tokens.accessToken = accessToken;
  }
  if (refreshToken) {
    tokens.refreshToken = refreshToken;
  }
  if (expiresInSeconds) {
    tokens.expiresAt = Date.now() + expiresInSeconds * 1000;
  }
}

export function setStoredToken(accessToken: string, expiresInSeconds?: number) {
  setTokens(accessToken, undefined, expiresInSeconds);
}

export function getStoredAccessToken() {
  if (!tokens.accessToken) return null;
  if (!tokens.expiresAt) return tokens.accessToken;
  if (Date.now() < tokens.expiresAt - EXPIRY_BUFFER_MS) {
    return tokens.accessToken;
  }
  return null;
}

export function getStoredToken() {
  return getStoredAccessToken();
}

export function getStoredRefreshToken() {
  return tokens.refreshToken ?? null;
}

export async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";

  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }
  if (!clientId) {
    throw new Error("Missing SPOTIFY_CLIENT_ID configuration");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId
    }).toString()
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data?.error_description || data?.error || "Failed to refresh token"
    );
    (error as any).status = response.status;
    throw error;
  }

  setTokens(data.access_token, data.refresh_token, data.expires_in);
  return data.access_token as string;
}

export async function getValidAccessToken() {
  const token = getStoredAccessToken();
  if (token) return token;
  if (getStoredRefreshToken()) {
    return refreshAccessToken();
  }
  return null;
}
