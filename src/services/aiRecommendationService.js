import { spotifyService } from './spotifyServices';

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
      const seedTracks = [currentTrack.id];
      const seedArtists = currentTrack.artists.slice(0, 2).map(artist => artist.id);

      let audioFeatures = null;
      try {
        audioFeatures = await spotifyService.getAudioFeatures(currentTrack.id);
      } catch (error) {
        console.warn('Could not fetch audio features:', error);
      }

      const recommendationOptions = {
        seed_tracks: seedTracks,
        seed_artists: seedArtists,
        limit: 10
      };

      if (audioFeatures) {
        recommendationOptions.target_energy = audioFeatures.energy;
        recommendationOptions.target_danceability = audioFeatures.danceability;
        recommendationOptions.target_valence = audioFeatures.valence;
      }

      const recommendations = await spotifyService.getRecommendations(recommendationOptions);

      if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
        this._notifyListeners({ type: 'no_recommendations', currentTrack: currentTrack.name });
        return;
      }

      const availableTracks = recommendations.tracks.filter(track =>
        !this.queuedTracks.has(track.id) && track.id !== currentTrack.id
      );

      if (availableTracks.length === 0) {
        this.queuedTracks.clear();
        return;
      }

      const recommendedTrack = availableTracks[0];
      await spotifyService.addToQueue(recommendedTrack.uri);
      this.queuedTracks.add(recommendedTrack.id);

      this._addToHistory({
        timestamp: new Date(),
        currentTrack: {
          id: currentTrack.id,
          name: currentTrack.name,
          artists: currentTrack.artists.map(a => a.name)
        },
        recommendedTrack: {
          id: recommendedTrack.id,
          name: recommendedTrack.name,
          artists: recommendedTrack.artists.map(a => a.name),
          album: recommendedTrack.album.name,
          uri: recommendedTrack.uri
        },
        audioFeatures
      });

      this._notifyListeners({
        type: 'track_queued',
        currentTrack: { name: currentTrack.name, artists: currentTrack.artists.map(a => a.name) },
        recommendedTrack: {
          id: recommendedTrack.id,
          name: recommendedTrack.name,
          artists: recommendedTrack.artists.map(a => a.name),
          album: recommendedTrack.album.name,
          preview_url: recommendedTrack.preview_url,
          external_urls: recommendedTrack.external_urls
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
      let currentTrack = options.track;

      if (!currentTrack) {
        const currentlyPlaying = await spotifyService.getCurrentlyPlaying();
        if (!currentlyPlaying || !currentlyPlaying.item) return [];
        currentTrack = currentlyPlaying.item;
      }

      const seedTracks = [currentTrack.id];
      const seedArtists = currentTrack.artists.slice(0, 2).map(artist => artist.id);

      let audioFeatures = null;
      try {
        audioFeatures = await spotifyService.getAudioFeatures(currentTrack.id);
      } catch (error) {
        console.warn('Could not fetch audio features:', error);
      }

      const recommendationOptions = {
        seed_tracks: seedTracks,
        seed_artists: seedArtists,
        limit: options.limit || 20
      };

      if (audioFeatures) {
        recommendationOptions.target_energy = audioFeatures.energy;
        recommendationOptions.target_danceability = audioFeatures.danceability;
        recommendationOptions.target_valence = audioFeatures.valence;
      }

      const recommendations = await spotifyService.getRecommendations(recommendationOptions);

      if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
        return [];
      }

      return recommendations.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => ({ id: a.id, name: a.name })),
        album: { id: track.album.id, name: track.album.name, images: track.album.images },
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        uri: track.uri,
        duration_ms: track.duration_ms,
        popularity: track.popularity
      }));
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
