import { spotifyService } from './spotifyServices';
import { normalizeApiError } from './apiClient';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const ENABLED = String(import.meta.env.VITE_ENABLE_AZURE_ML_RECS || '').toLowerCase() === 'true';
const DEFAULT_LIMIT = Number(import.meta.env.VITE_AZURE_ML_RECS_LIMIT || 20);

const sanitizeTrack = (track = {}) => ({
  id: track.id,
  name: track.name,
  duration_ms: track.duration_ms,
  popularity: track.popularity,
  explicit: track.explicit,
  artists: Array.isArray(track.artists)
    ? track.artists.map(artist => ({ id: artist.id, name: artist.name }))
    : [],
  album: track.album
    ? {
        id: track.album.id,
        name: track.album.name,
        release_date: track.album.release_date,
        total_tracks: track.album.total_tracks
      }
    : null,
  genres: track.genres || [],
  external_ids: track.external_ids || null
});

const sanitizeAudioFeatures = (features = {}) => ({
  acousticness: features.acousticness,
  danceability: features.danceability,
  duration_ms: features.duration_ms,
  energy: features.energy,
  instrumentalness: features.instrumentalness,
  key: features.key,
  liveness: features.liveness,
  loudness: features.loudness,
  mode: features.mode,
  speechiness: features.speechiness,
  tempo: features.tempo,
  time_signature: features.time_signature,
  valence: features.valence
});

const sanitizeHistory = (history = []) => history
  .filter(Boolean)
  .map(entry => ({
    timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
    currentTrackId: entry.currentTrack?.id,
    currentTrackArtists: entry.currentTrack?.artists,
    recommendedTrackId: entry.recommendedTrack?.id,
    recommendedTrackArtists: entry.recommendedTrack?.artists,
    audioFeatures: entry.audioFeatures ? sanitizeAudioFeatures(entry.audioFeatures) : undefined,
    source: entry.source || 'spotify'
  }));

const unwrapData = (data) => {
  if (data && typeof data === 'object') {
    if (Array.isArray(data.predictions)) {
      return unwrapData(data.predictions);
    }
    if (Array.isArray(data.outputs)) {
      return unwrapData(data.outputs);
    }
    if (Array.isArray(data.recommendations)) {
      return data.recommendations;
    }
    if ('data' in data) {
      return unwrapData(data.data);
    }
    if ('result' in data) {
      return unwrapData(data.result);
    }
    if ('output' in data) {
      return unwrapData(data.output);
    }
  }
  return data;
};

const extractTrackId = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    return item.trackId || item.id || item.spotifyId || item.track_id || null;
  }
  return null;
};

const normalizeTrackIds = (raw) => {
  const payload = unwrapData(raw);
  const ids = [];

  if (Array.isArray(payload)) {
    payload.forEach(entry => {
      const id = extractTrackId(entry);
      if (id) ids.push(id);
    });
  } else if (payload && typeof payload === 'object') {
    const possibleArrays = [payload.trackIds, payload.ids, payload.tracks];
    possibleArrays.forEach(candidate => {
      if (Array.isArray(candidate)) {
        candidate.forEach(value => {
          const id = extractTrackId(value);
          if (id) ids.push(id);
        });
      }
    });
  }

  return { trackIds: [...new Set(ids)], raw };
};

const buildPayload = ({ track, audioFeatures, history }) => {
  const payload = {};
  if (track) payload.track = sanitizeTrack(track);
  if (audioFeatures) payload.audioFeatures = sanitizeAudioFeatures(audioFeatures);
  if (history?.length) payload.history = sanitizeHistory(history);
  return payload;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw normalizeApiError(error, url);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('Azure ML response parse failure:', error);
    throw normalizeApiError(new Error('Failed to parse Azure ML response'), url);
  }
};

export const azureMlService = {
  isEnabled() {
    return ENABLED && Boolean(BACKEND_BASE_URL);
  },

  async invokeRecommendation(body = {}) {
    if (!this.isEnabled()) {
      throw new Error('Azure ML recommender is disabled');
    }

    const payload = body.payload && Object.keys(body.payload).length > 0
      ? body
      : { payload: body };

    return fetchJson(`${BACKEND_BASE_URL}/api/azure/ml/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async getTrackRecommendations({ track, audioFeatures, history = [] } = {}) {
    if (!this.isEnabled()) {
      return { tracks: [], raw: null };
    }

    const payload = buildPayload({ track, audioFeatures, history });
    const rawResponse = await this.invokeRecommendation({ payload });
    const { trackIds, raw } = normalizeTrackIds(rawResponse.data ?? rawResponse);

    if (!trackIds.length) {
      return { tracks: [], raw };
    }

    const limitedIds = trackIds.slice(0, Math.max(1, DEFAULT_LIMIT));
    const spotifyResponse = await spotifyService.apiRequest('/tracks', {
      params: { ids: limitedIds.join(',') }
    });

    const tracks = spotifyResponse?.tracks?.filter(Boolean) || [];
    return { tracks, raw };
  }
};

export default azureMlService;
