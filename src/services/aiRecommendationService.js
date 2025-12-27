import { spotifyService } from './spotifyServices';
import { azureMlService } from './azureMlService';

class AIRecommendationService {
  constructor() {
    this.isEnabled = false;
    this.currentTrackId = null;
    this.queuedTracks = new Set();
    this.checkInterval = null;
    this.checkIntervalMs = 30000;
    this.listeners = new Set();
    this.recommendationHistory = [];
    this.maxHistorySize = 50;
  }

  start(options = {}) {
    if (this.isEnabled) return;

    this.checkIntervalMs = options.checkInterval || 30000;
    this.isEnabled = true;
    this._notifyListeners({ type: 'started' });

    this._checkAndQueueRecommendation();
    this.checkInterval = setInterval(() => {
      this._checkAndQueueRecommendation();
    }, this.checkIntervalMs);
  }

  stop() {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this._notifyListeners({ type: 'stopped' });
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  _notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  _mapTrackSummary(track) {
    if (!track) return null;

    return {
      id: track.id,
      name: track.name,
      artists: (track.artists || []).map(artist => ({ id: artist.id, name: artist.name })),
      album: track.album
        ? { id: track.album.id, name: track.album.name, images: track.album.images }
        : null,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      uri: track.uri,
      duration_ms: track.duration_ms,
      popularity: track.popularity
    };
  }

  async _getAudioFeatures(trackId) {
    if (!trackId) return null;
    try {
      return await spotifyService.getAudioFeatures(trackId);
    } catch (error) {
      console.warn('Could not fetch audio features:', error);
      return null;
    }
  }

  _buildSpotifyRecommendationOptions(track, audioFeatures, limit = 20) {
    const options = {
      seed_tracks: [track.id],
      seed_artists: track.artists.slice(0, 2).map(artist => artist.id),
      limit
    };

    if (audioFeatures) {
      options.target_energy = audioFeatures.energy;
      options.target_danceability = audioFeatures.danceability;
      options.target_valence = audioFeatures.valence;
    }

    return options;
  }

  async _fetchAzureRecommendations(track, audioFeatures, limit = 20) {
    if (!azureMlService.isEnabled()) {
      return [];
    }

    try {
      const azureResponse = await azureMlService.getTrackRecommendations({
        track,
        audioFeatures,
        history: this.getHistory(10)
      });

      return (azureResponse?.tracks || []).slice(0, limit).filter(Boolean);
    } catch (error) {
      console.warn('Azure ML recommendation failed:', error);
      this._notifyListeners({ type: 'azure_ml_error', error: error.message });
      return [];
    }
  }

  _filterAvailableTracks(tracks, currentTrackId) {
    if (!Array.isArray(tracks)) {
      return [];
    }

    return tracks.filter(track =>
      track && track.id && !this.queuedTracks.has(track.id) && track.id !== currentTrackId
    );
  }

  async _resolveTrack(track) {
    if (track) return track;
    const currentlyPlaying = await spotifyService.getCurrentlyPlaying();
    return currentlyPlaying?.item || null;
  }

  async _checkAndQueueRecommendation() {
    try {
      const currentlyPlaying = await spotifyService.getCurrentlyPlaying();

      if (!currentlyPlaying || !currentlyPlaying.item) {
        this._notifyListeners({ type: 'no_track_playing' });
        return;
      }

      const track = currentlyPlaying.item;
      const trackId = track.id;

      if (trackId === this.currentTrackId) return;

      this.currentTrackId = trackId;
      this._notifyListeners({
        type: 'track_changed',
        track: {
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album
        }
      });

      await this._queueAIRecommendation(track);
    } catch (error) {
      console.error('Error checking recommendations:', error);
      this._notifyListeners({ type: 'error', error: error.message });
    }
  }

  async _queueAIRecommendation(currentTrack) {
    try {
      const audioFeatures = await this._getAudioFeatures(currentTrack.id);
      const limit = 10;
      const recommendationOptions = this._buildSpotifyRecommendationOptions(currentTrack, audioFeatures, limit);

      let candidateTracks = await this._fetchAzureRecommendations(currentTrack, audioFeatures, limit);
      let recommendationSource = candidateTracks.length > 0 ? 'azure-ml' : 'spotify';

      if (candidateTracks.length === 0) {
        const recommendations = await spotifyService.getRecommendations(recommendationOptions);
        candidateTracks = recommendations?.tracks || [];
      }

      let availableTracks = this._filterAvailableTracks(candidateTracks, currentTrack.id);

      if (availableTracks.length === 0 && recommendationSource === 'azure-ml') {
        const fallback = await spotifyService.getRecommendations(recommendationOptions);
        candidateTracks = fallback?.tracks || [];
        availableTracks = this._filterAvailableTracks(candidateTracks, currentTrack.id);
        recommendationSource = 'spotify';
      }

      if (availableTracks.length === 0) {
        this.queuedTracks.clear();
        this._notifyListeners({ type: 'no_recommendations', currentTrack: currentTrack.name });
        return;
      }

      const recommendedTrack = availableTracks[0];
      await spotifyService.addToQueue(recommendedTrack.uri);
      this.queuedTracks.add(recommendedTrack.id);

      const summary = this._mapTrackSummary(recommendedTrack);

      this._addToHistory({
        timestamp: new Date(),
        currentTrack: {
          id: currentTrack.id,
          name: currentTrack.name,
          artists: currentTrack.artists.map(a => a.name)
        },
        recommendedTrack: summary,
        audioFeatures,
        source: recommendationSource
      });

      this._notifyListeners({
        type: 'track_queued',
        source: recommendationSource,
        currentTrack: { name: currentTrack.name, artists: currentTrack.artists.map(a => a.name) },
        recommendedTrack: {
          id: summary.id,
          name: summary.name,
          artists: summary.artists.map(a => a.name),
          album: summary.album?.name,
          preview_url: summary.preview_url,
          external_urls: summary.external_urls
        }
      });
    } catch (error) {
      console.error('Error queueing recommendation:', error);
      this._notifyListeners({ type: 'queue_error', error: error.message });
      throw error;
    }
  }

  _addToHistory(entry) {
    this.recommendationHistory.unshift(entry);
    if (this.recommendationHistory.length > this.maxHistorySize) {
      this.recommendationHistory = this.recommendationHistory.slice(0, this.maxHistorySize);
    }
  }

  getHistory(limit = 10) {
    return this.recommendationHistory.slice(0, limit);
  }

  clearHistory() {
    this.recommendationHistory = [];
    this.queuedTracks.clear();
  }

  getStatus() {
    return {
      isEnabled: this.isEnabled,
      currentTrackId: this.currentTrackId,
      queuedTracksCount: this.queuedTracks.size,
      historyCount: this.recommendationHistory.length,
      checkIntervalMs: this.checkIntervalMs
    };
  }

  async getRecommendationsList(options = {}) {
    try {
      const limit = options.limit || 20;
      const currentTrack = await this._resolveTrack(options.track);
      if (!currentTrack) return [];

      const audioFeatures = await this._getAudioFeatures(currentTrack.id);
      const recommendationOptions = this._buildSpotifyRecommendationOptions(currentTrack, audioFeatures, limit);

      const azureTracks = await this._fetchAzureRecommendations(currentTrack, audioFeatures, limit);
      if (azureTracks.length > 0) {
        return azureTracks.map(track => this._mapTrackSummary(track));
      }

      const recommendations = await spotifyService.getRecommendations(recommendationOptions);

      if (!recommendations?.tracks?.length) {
        return [];
      }

      return recommendations.tracks.map(track => this._mapTrackSummary(track));
    } catch (error) {
      console.error('Error getting recommendations list:', error);
      throw error;
    }
  }

  async getNextRecommendation() {
    try {
      const recommendations = await this.getRecommendationsList({ limit: 1 });
      return recommendations.length > 0 ? recommendations[0] : null;
    } catch (error) {
      console.error('Error getting next recommendation:', error);
      return null;
    }
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;
