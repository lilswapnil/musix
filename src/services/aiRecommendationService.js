import { spotifyService } from './spotifyServices';

/**
 * AI Recommendation Service
 * Automatically captures what's playing and queues AI-recommended tracks
 */
class AIRecommendationService {
  constructor() {
    this.isEnabled = false;
    this.currentTrackId = null;
    this.queuedTracks = new Set(); // Track already queued songs to avoid duplicates
    this.checkInterval = null;
    this.checkIntervalMs = 30000; // Check every 30 seconds
    this.listeners = new Set();
    this.recommendationHistory = []; // Track recommendation history
    this.maxHistorySize = 50;
  }

  /**
   * Start the AI recommendation service
   * @param {Object} options - Configuration options
   * @param {number} options.checkInterval - How often to check for track changes (ms)
   * @param {number} options.limit - Number of recommendations to fetch
   */
  start(options = {}) {
    if (this.isEnabled) {
      console.log('AI Recommendation service is already running');
      return;
    }

    this.checkIntervalMs = options.checkInterval || 30000;
    this.isEnabled = true;

    console.log('Starting AI Recommendation service...');
    this._notifyListeners({ type: 'started' });

    // Initial check
    this._checkAndQueueRecommendation();

    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      this._checkAndQueueRecommendation();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the AI recommendation service
   */
  stop() {
    if (!this.isEnabled) {
      console.log('AI Recommendation service is not running');
      return;
    }

    this.isEnabled = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('Stopped AI Recommendation service');
    this._notifyListeners({ type: 'stopped' });
  }

  /**
   * Add a listener for recommendation events
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove a listener
   * @param {Function} listener - Callback function to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of an event
   * @private
   */
  _notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in recommendation listener:', error);
      }
    });
  }

  /**
   * Main logic: Check current track and queue a recommendation
   * @private
   */
  async _checkAndQueueRecommendation() {
    try {
      // Get currently playing track
      const currentlyPlaying = await spotifyService.getCurrentlyPlaying();

      if (!currentlyPlaying || !currentlyPlaying.item) {
        console.log('No track currently playing');
        this._notifyListeners({ type: 'no_track_playing' });
        return;
      }

      const track = currentlyPlaying.item;
      const trackId = track.id;

      // Check if this is a new track
      if (trackId === this.currentTrackId) {
        // Same track still playing
        return;
      }

      // New track detected!
      console.log(`New track detected: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`);
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

      // Get AI recommendations based on current track
      await this._queueAIRecommendation(track);

    } catch (error) {
      console.error('Error in AI recommendation check:', error);
      this._notifyListeners({
        type: 'error',
        error: error.message
      });
    }
  }

  /**
   * Get AI recommendation and add to queue
   * @private
   */
  async _queueAIRecommendation(currentTrack) {
    try {
      // Extract seed data from current track
      const seedTracks = [currentTrack.id];
      const seedArtists = currentTrack.artists.slice(0, 2).map(artist => artist.id);

      console.log('Fetching AI recommendations based on:', {
        track: currentTrack.name,
        artists: currentTrack.artists.map(a => a.name)
      });

      // Get audio features to better match recommendations
      let audioFeatures = null;
      try {
        audioFeatures = await spotifyService.getAudioFeatures(currentTrack.id);
      } catch (error) {
        console.warn('Could not fetch audio features:', error);
      }

      // Build recommendation options
      const recommendationOptions = {
        seed_tracks: seedTracks,
        seed_artists: seedArtists,
        limit: 10 // Get 10 recommendations to choose from
      };

      // Add audio features as targets if available
      if (audioFeatures) {
        // Use current track's audio features as targets for similar songs
        recommendationOptions.target_energy = audioFeatures.energy;
        recommendationOptions.target_danceability = audioFeatures.danceability;
        recommendationOptions.target_valence = audioFeatures.valence; // mood/positivity
      }

      // Fetch recommendations from Spotify
      const recommendations = await spotifyService.getRecommendations(recommendationOptions);

      if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
        console.log('No recommendations found');
        this._notifyListeners({
          type: 'no_recommendations',
          currentTrack: currentTrack.name
        });
        return;
      }

      // Filter out already queued tracks and the current track
      const availableTracks = recommendations.tracks.filter(track =>
        !this.queuedTracks.has(track.id) && track.id !== currentTrack.id
      );

      if (availableTracks.length === 0) {
        console.log('All recommendations already queued, clearing queue history');
        this.queuedTracks.clear(); // Reset if we've queued everything
        return;
      }

      // Pick the first available recommendation
      const recommendedTrack = availableTracks[0];

      // Add to queue
      const trackUri = recommendedTrack.uri;
      await spotifyService.addToQueue(trackUri);

      // Mark as queued
      this.queuedTracks.add(recommendedTrack.id);

      // Add to history
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
        audioFeatures: audioFeatures
      });

      console.log(`✅ Queued AI recommendation: ${recommendedTrack.name} by ${recommendedTrack.artists.map(a => a.name).join(', ')}`);

      this._notifyListeners({
        type: 'track_queued',
        currentTrack: {
          name: currentTrack.name,
          artists: currentTrack.artists.map(a => a.name)
        },
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
      console.error('Error queueing AI recommendation:', error);
      this._notifyListeners({
        type: 'queue_error',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add recommendation to history
   * @private
   */
  _addToHistory(entry) {
    this.recommendationHistory.unshift(entry);

    // Keep history size limited
    if (this.recommendationHistory.length > this.maxHistorySize) {
      this.recommendationHistory = this.recommendationHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get recommendation history
   * @param {number} limit - Number of history entries to return
   * @returns {Array} History entries
   */
  getHistory(limit = 10) {
    return this.recommendationHistory.slice(0, limit);
  }

  /**
   * Clear recommendation history
   */
  clearHistory() {
    this.recommendationHistory = [];
    this.queuedTracks.clear();
    console.log('Cleared recommendation history');
  }

  /**
   * Get current status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      currentTrackId: this.currentTrackId,
      queuedTracksCount: this.queuedTracks.size,
      historyCount: this.recommendationHistory.length,
      checkIntervalMs: this.checkIntervalMs
    };
  }
}

// Export singleton instance
export const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;
