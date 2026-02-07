import { spotifyFetch, spotifyFetchNullable } from "./spotifyClient.js";

type TimeRange = "short_term" | "medium_term" | "long_term";

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
  } | null>;
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

type ArtistTopTracksResponse = {
  tracks: Array<{
    id: string;
    name: string;
    preview_url: string | null;
    external_urls: { spotify: string };
    album: { images: Array<{ url: string }> };
    artists: Array<{ name: string }>;
  }>;
};

type MeResponse = {
  country?: string;
};

type TrackResponse = {
  id: string;
  artists: Array<{ id: string; name: string }>;
};

type CurrentlyPlayingResponse = {
  is_playing: boolean;
  item: TrackResponse | null;
};

export type TasteVector = {
  danceability?: number;
  energy?: number;
  valence?: number;
  tempo?: number;
  acousticness?: number;
  instrumentalness?: number;
  speechiness?: number;
};

export type RecommendedTrack = {
  id: string;
  name: string;
  artists: string;
  cover: string | null;
  preview_url: string | null;
  spotify_url: string;
};

function avg(nums: Array<number | null | undefined>) {
  const clean = nums.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (clean.length === 0) return undefined;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function safeFixed(n: number, digits: number) {
  // Avoid "-0.000"
  const x = Math.abs(n) < 1e-12 ? 0 : n;
  return x.toFixed(digits);
}

function getSpotifyStatus(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  const match = error.message.match(/Spotify API error (\d+)/);
  return match ? Number(match[1]) : undefined;
}

function isRecommendationBlock(status?: number) {
  return status === 403 || status === 404;
}

function mapTracks(recs: RecommendationsResponse) {
  return recs.tracks.map((t) => ({
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a) => a.name).join(", "),
    cover: t.album?.images?.[0]?.url ?? null,
    preview_url: t.preview_url,
    spotify_url: t.external_urls.spotify,
  }));
}

async function getMarket(accessToken: string) {
  let market = "US";
  try {
    const me = await spotifyFetch<MeResponse>(accessToken, "/me");
    if (me.country) market = me.country;
  } catch {
    // Keep default market if profile is unavailable.
  }
  return market;
}

async function getCurrentPlaybackSeed(accessToken: string) {
  const playback = await spotifyFetchNullable<CurrentlyPlayingResponse>(
    accessToken,
    "/me/player/currently-playing"
  );

  if (!playback?.is_playing || !playback.item?.id) return null;

  const artistIds = (playback.item.artists || [])
    .map((artist) => artist.id)
    .filter(Boolean)
    .slice(0, 3);

  return { trackId: playback.item.id, artistIds };
}

async function getTrackSeed(accessToken: string, trackId: string) {
  const track = await spotifyFetch<TrackResponse>(accessToken, `/tracks/${trackId}`);
  const artistIds = (track.artists || [])
    .map((artist) => artist.id)
    .filter(Boolean)
    .slice(0, 3);
  return { trackId, artistIds };
}

async function buildRecommendationsFromSeed(
  accessToken: string,
  seed: { trackId: string; artistIds: string[] },
  limit: number
): Promise<{ taste: TasteVector | null; tracks: RecommendedTrack[] }> {
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const market = await getMarket(accessToken);
  params.set("market", market);

  params.set("seed_tracks", seed.trackId);
  if (seed.artistIds.length) params.set("seed_artists", seed.artistIds.slice(0, 2).join(","));

  let taste: TasteVector | null = null;
  try {
    const feats = await spotifyFetch<AudioFeaturesResponse>(
      accessToken,
      `/audio-features?ids=${encodeURIComponent(seed.trackId)}`
    );
    const feature = feats.audio_features?.[0] ?? null;
    if (feature) {
      taste = {
        danceability: feature.danceability ?? undefined,
        energy: feature.energy ?? undefined,
        valence: feature.valence ?? undefined,
        tempo: feature.tempo ?? undefined,
        acousticness: feature.acousticness ?? undefined,
        instrumentalness: feature.instrumentalness ?? undefined,
        speechiness: feature.speechiness ?? undefined,
      };
    }
  } catch (error) {
    if (getSpotifyStatus(error) !== 403) {
      throw error;
    }
  }

  if (taste?.danceability !== undefined) taste.danceability = clamp01(taste.danceability);
  if (taste?.energy !== undefined) taste.energy = clamp01(taste.energy);
  if (taste?.valence !== undefined) taste.valence = clamp01(taste.valence);
  if (taste?.acousticness !== undefined) taste.acousticness = clamp01(taste.acousticness);
  if (taste?.instrumentalness !== undefined) taste.instrumentalness = clamp01(taste.instrumentalness);
  if (taste?.speechiness !== undefined) taste.speechiness = clamp01(taste.speechiness);

  if (taste?.danceability !== undefined) params.set("target_danceability", safeFixed(taste.danceability, 3));
  if (taste?.energy !== undefined) params.set("target_energy", safeFixed(taste.energy, 3));
  if (taste?.valence !== undefined) params.set("target_valence", safeFixed(taste.valence, 3));
  if (taste?.tempo !== undefined) params.set("target_tempo", safeFixed(taste.tempo, 1));
  if (taste?.acousticness !== undefined) params.set("target_acousticness", safeFixed(taste.acousticness, 3));
  if (taste?.instrumentalness !== undefined) params.set("target_instrumentalness", safeFixed(taste.instrumentalness, 3));
  if (taste?.speechiness !== undefined) params.set("target_speechiness", safeFixed(taste.speechiness, 3));

  let recs: RecommendationsResponse | null = null;
  try {
    recs = await spotifyFetch<RecommendationsResponse>(accessToken, `/recommendations?${params.toString()}`);
  } catch (error) {
    if (!isRecommendationBlock(getSpotifyStatus(error))) {
      throw error;
    }
  }

  let tracks: RecommendedTrack[] = [];
  if (recs) {
    tracks = mapTracks(recs);
  } else if (seed.artistIds.length) {
    const fallback: RecommendedTrack[] = [];
    const fallbackSeen = new Set<string>();
    for (const artistId of seed.artistIds) {
      try {
        const artistTop = await spotifyFetch<ArtistTopTracksResponse>(
          accessToken,
          `/artists/${artistId}/top-tracks?market=${encodeURIComponent(market)}`
        );
        artistTop.tracks.forEach((t) => {
          if (fallbackSeen.has(t.id)) return;
          fallbackSeen.add(t.id);
          fallback.push({
            id: t.id,
            name: t.name,
            artists: (t.artists || []).map((a) => a.name).join(", "),
            cover: t.album?.images?.[0]?.url ?? null,
            preview_url: t.preview_url,
            spotify_url: t.external_urls.spotify,
          });
        });
      } catch (error) {
        if (!isRecommendationBlock(getSpotifyStatus(error))) {
          throw error;
        }
      }
      if (fallback.length >= limit) break;
    }
    tracks = fallback.slice(0, limit);
  }

  return { taste, tracks };
}

export async function buildRecommendations(
  accessToken: string,
  opts?: {
    limit?: number;
    timeRange?: TimeRange;
    excludeTopTracks?: boolean;
    trackId?: string;
    useCurrent?: boolean;
  }
): Promise<{ taste: TasteVector | null; tracks: RecommendedTrack[] }> {
  const limit = Math.max(1, Math.min(50, opts?.limit ?? 25));
  const timeRange = opts?.timeRange ?? "medium_term";
  const excludeTopTracks = opts?.excludeTopTracks ?? true;
  const trackId = opts?.trackId;
  const useCurrent = opts?.useCurrent ?? false;

  if (trackId) {
    const seed = await getTrackSeed(accessToken, trackId);
    return buildRecommendationsFromSeed(accessToken, seed, limit);
  }

  if (useCurrent) {
    const seed = await getCurrentPlaybackSeed(accessToken);
    if (!seed) return { taste: null, tracks: [] };
    return buildRecommendationsFromSeed(accessToken, seed, limit);
  }

  // 1) Top tracks (use up to 20 to compute taste)
  const top = await spotifyFetch<TopTracksResponse>(
    accessToken,
    `/me/top/tracks?limit=20&time_range=${timeRange}`
  );

  const topTrackIds = top.items.map((t) => t.id).filter(Boolean);

  // If not enough history, return empty (caller can fallback to something else)
  if (topTrackIds.length < 5) {
    return { taste: null, tracks: [] };
  }

  // 2) Audio features (up to 100 ids per call; we have <=20)
  let features: Array<AudioFeaturesResponse["audio_features"][number]> = [];
  try {
    const feats = await spotifyFetch<AudioFeaturesResponse>(
      accessToken,
      `/audio-features?ids=${encodeURIComponent(topTrackIds.join(","))}`
    );
    features = (feats.audio_features || []).filter(Boolean);
  } catch (error) {
    if (getSpotifyStatus(error) !== 403) {
      throw error;
    }
  }

  // 3) Average taste vector
  let taste: TasteVector | null = {
    danceability: avg(features.map((f) => f?.danceability)),
    energy: avg(features.map((f) => f?.energy)),
    valence: avg(features.map((f) => f?.valence)),
    tempo: avg(features.map((f) => f?.tempo)),
    acousticness: avg(features.map((f) => f?.acousticness)),
    instrumentalness: avg(features.map((f) => f?.instrumentalness)),
    speechiness: avg(features.map((f) => f?.speechiness)),
  };

  if (!features.length) {
    taste = null;
  }

  // Spotify target_* expects [0,1] for most except tempo
  if (taste?.danceability !== undefined) taste.danceability = clamp01(taste.danceability);
  if (taste?.energy !== undefined) taste.energy = clamp01(taste.energy);
  if (taste?.valence !== undefined) taste.valence = clamp01(taste.valence);
  if (taste?.acousticness !== undefined) taste.acousticness = clamp01(taste.acousticness);
  if (taste?.instrumentalness !== undefined) taste.instrumentalness = clamp01(taste.instrumentalness);
  if (taste?.speechiness !== undefined) taste.speechiness = clamp01(taste.speechiness);

  // 4) Seeds (max 5 combined across tracks/artists/genres)
  // Prefer a small mix: 2 tracks + 3 artists.
  const seedTracks = topTrackIds.slice(0, 2);

  const seedArtists = top.items
    .flatMap((t) => t.artists.map((a) => a.id))
    .filter(Boolean)
    .slice(0, 3);

  // 5) Spotify recommendations with targets
  const params = new URLSearchParams();
  params.set("limit", String(limit));

  const market = await getMarket(accessToken);

  // IMPORTANT: Spotify expects comma-separated values (not repeated params)
  if (seedArtists.length) params.set("seed_artists", seedArtists.join(","));
  if (seedTracks.length) params.set("seed_tracks", seedTracks.join(","));
  params.set("market", market);

  // Only set targets if they exist
  if (taste?.danceability !== undefined) params.set("target_danceability", safeFixed(taste.danceability, 3));
  if (taste?.energy !== undefined) params.set("target_energy", safeFixed(taste.energy, 3));
  if (taste?.valence !== undefined) params.set("target_valence", safeFixed(taste.valence, 3));
  if (taste?.tempo !== undefined) params.set("target_tempo", safeFixed(taste.tempo, 1));
  if (taste?.acousticness !== undefined) params.set("target_acousticness", safeFixed(taste.acousticness, 3));
  if (taste?.instrumentalness !== undefined) params.set("target_instrumentalness", safeFixed(taste.instrumentalness, 3));
  if (taste?.speechiness !== undefined) params.set("target_speechiness", safeFixed(taste.speechiness, 3));

  let recs: RecommendationsResponse | null = null;
  try {
    recs = await spotifyFetch<RecommendationsResponse>(accessToken, `/recommendations?${params.toString()}`);
  } catch (error) {
    if (!isRecommendationBlock(getSpotifyStatus(error))) {
      throw error;
    }
  }

  const topSet = new Set(topTrackIds);

  let tracks: RecommendedTrack[] = [];
  if (recs) {
    tracks = mapTracks(recs);
  } else if (seedArtists.length) {
    const fallback: RecommendedTrack[] = [];
    const fallbackSeen = new Set<string>();
    for (const artistId of seedArtists) {
      try {
        const artistTop = await spotifyFetch<ArtistTopTracksResponse>(
          accessToken,
          `/artists/${artistId}/top-tracks?market=${encodeURIComponent(market)}`
        );
        artistTop.tracks.forEach((t) => {
          if (fallbackSeen.has(t.id)) return;
          fallbackSeen.add(t.id);
          fallback.push({
            id: t.id,
            name: t.name,
            artists: (t.artists || []).map((a) => a.name).join(", "),
            cover: t.album?.images?.[0]?.url ?? null,
            preview_url: t.preview_url,
            spotify_url: t.external_urls.spotify,
          });
        });
      } catch (error) {
        if (!isRecommendationBlock(getSpotifyStatus(error))) {
          throw error;
        }
      }
      if (fallback.length >= limit) break;
    }
    tracks = fallback.slice(0, limit);
  }

  // Optional: don’t recommend what the user already has as top tracks
  if (excludeTopTracks) {
    tracks = tracks.filter((t) => !topSet.has(t.id));
  }

  return { taste, tracks };
}
