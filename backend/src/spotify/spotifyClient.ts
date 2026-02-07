type SpotifyMethod = "GET" | "POST" | "PUT" | "DELETE";

export async function spotifyFetch<T>(
  accessToken: string,
  path: string,
  method: SpotifyMethod = "GET",
  body?: unknown
): Promise<T> {
  const url = `https://api.spotify.com/v1${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const error = new Error(`Spotify API error ${res.status} on ${path}: ${text}`);
    (error as any).status = res.status;
    (error as any).retryAfter = res.headers.get("retry-after") ?? undefined;
    throw error;
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}

export async function spotifyFetchNullable<T>(
  accessToken: string,
  path: string,
  method: SpotifyMethod = "GET",
  body?: unknown
): Promise<T | null> {
  const url = `https://api.spotify.com/v1${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 204 || res.headers.get("content-length") === "0") return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const error = new Error(`Spotify API error ${res.status} on ${path}: ${text}`);
    (error as any).status = res.status;
    (error as any).retryAfter = res.headers.get("retry-after") ?? undefined;
    throw error;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  if (!text) return null;
  return text as T;
}
