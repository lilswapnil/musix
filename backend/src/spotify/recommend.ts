import { spotifyFetch } from "./spotifyClient.js";

type TopTracksResponse = {
  items: Array<{
    id: string;
    name: string;
    artists: Array<{ id: string; name: string }>;
  }>;
};

type AudioFeaturesResponse = {
  audio_features: Array<{
    id: string;
    danceability: number | null;
    energy: number | null;
    valence: number | null;
    tempo: number | null;
    acousticness: number | null;
    instrumentalness: number | null;
    speechiness: number | null;
    liveness: number | null;
  }>;
};

type RecommendationsResponse = {
  tracks: Array<{
    id: string;
    name: string;
    preview_url: string | null;
    external_urls: { spotify: string };
    album: { images: Array<{ url: string }> };
    artists: Array<{ name: string }>;
  }>;
};

function avg(nums: Array<number | null | undefined>) {
  const clean = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (clean.length === 0) return undefined;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

export async function buildRecommendations(accessToken: string, opts?: { limit?: number; timeRange?: "short_term" | "medium_term" | "long_term" }) {
  const limit = opts?.limit ?? 25;
  const timeRange = opts?.timeRange ?? "medium_term";

  // 1) Top tracks
  const top = await spotifyFetch<TopTracksResponse>(
    accessToken,
    `/me/top/tracks?limit=20&time_range=${timeRange}`
  );

  const topTrackIds = top.items.map(t => t.id).filter(Boolean);
  if (topTrackIds.length < 5) {
    // Fallback: if Spotify returns too little
    return { taste: null, tracks: [] as any[] };
  }

  // 2) Audio features (up to 100 IDs per call)
  const feats = await spotifyFetch<AudioFeaturesResponse>(
    accessToken,
    `/audio-features?ids=${encodeURIComponent(topTrackIds.join(","))}`
  );

  // 3) Average taste vector
  const taste = {
    danceability: avg(feats.audio_features.map(f => f?.danceability)),
    energy: avg(feats.audio_features.map(f => f?.energy)),
    valence: avg(feats.audio_features.map(f => f?.valence)),
    tempo: avg(feats.audio_features.map(f => f?.tempo)),
    acousticness: avg(feats.audio_features.map(f => f?.acousticness)),
    instrumentalness: avg(feats.audio_features.map(f => f?.instrumentalness)),
    speechiness: avg(feats.audio_features.map(f => f?.speechiness))
  };

  // 4) Seeds (Spotify allows up to 5 combined seeds)
  const seedTracks = topTrackIds.slice(0, 2);
  const seedArtists = top.items
    .flatMap(t => t.artists.map(a => a.id))
    .filter(Boolean)
    .slice(0, 3);

  // 5) Spotify recommendations with targets
  const params = new URLSearchParams();
  seedArtists.forEach(a => params.append("seed_artists", a));
  seedTracks.forEach(t => params.append("seed_tracks", t));
  params.set("limit", String(limit));

  // Only set targets if they exist
  if (taste.danceability !== undefined) params.set("target_danceability", taste.danceability.toFixed(3));
  if (taste.energy !== undefined) params.set("target_energy", taste.energy.toFixed(3));
  if (taste.valence !== undefined) params.set("target_valence", taste.valence.toFixed(3));
  if (taste.tempo !== undefined) params.set("target_tempo", taste.tempo.toFixed(1));
  if (taste.acousticness !== undefined) params.set("target_acousticness", taste.acousticness.toFixed(3));
  if (taste.instrumentalness !== undefined) params.set("target_instrumentalness", taste.instrumentalness.toFixed(3));
  if (taste.speechiness !== undefined) params.set("target_speechiness", taste.speechiness.toFixed(3));

  const recs = await spotifyFetch<RecommendationsResponse>(
    accessToken,
    `/recommendations?${params.toString()}`
  );

  const tracks = recs.tracks.map(t => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map(a => a.name).join(", "),
    cover: t.album.images?.[0]?.url ?? null,
    preview_url: t.preview_url,
    spotify_url: t.external_urls.spotify
  }));

  return { taste, tracks };
}
