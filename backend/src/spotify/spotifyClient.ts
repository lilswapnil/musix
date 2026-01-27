type SpotifyMethod = "GET" | "POST";

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
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}
