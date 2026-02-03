import { throttle } from '../utils/requestUtils';
import { getAccessToken as getStoredAccessToken, getRefreshToken, getTokenExpiry } from '../utils/tokenStorage';
import { refreshAccessToken as refreshToken } from './spotifyAuthService';
import { createApiClient } from './apiClient';

/**
 * Spotify API Services with debouncing and throttling
 */
export const spotifyService = {
  // API configuration
  _clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
  _redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback',
  _scopes: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played'
  ],
  _apiBase: 'https://api.spotify.com/v1',
  _authBase: 'https://accounts.spotify.com/api',
  _tokenKey: 'spotify_auth_data',
  _apiClient: null,

  // API rate limits
  _rateLimit: {
    search: { max: 10, window: 30000 },
    browse: { max: 20, window: 60000 },
    default: { max: 50, window: 60000 }
  },
  
  // Throttle configurations
  _throttle: {
    search: throttle(2000)('spotify-search'),
    browse: throttle(1000)('spotify-browse'),
    track: throttle(500)
  },

  // Player configurations
  _player: null,
  _deviceId: null,
  _isPlayerReady: false,
  _onPlayerStateChanged: null,

  
  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken: async () => {
    try {
      return await refreshToken();
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
  
  /**
   * Get an access token (user token only, no client credentials fallback)
   */
  getAccessToken: async () => {
    try {
      const token = getStoredAccessToken();
      if (!token) {
        throw new Error('No access token available and user not authenticated');
      }

      const expiry = getTokenExpiry();
      if (expiry && expiry <= Date.now() + 60000) {
        return await spotifyService.refreshAccessToken();
      }

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  },
  
  /**
   * Get a user token (not client credentials)
   */
  getUserToken: async function() {
    try {
      const token = getStoredAccessToken();
      const expiry = getTokenExpiry();
      const refreshTokenValue = getRefreshToken();

      if (!token) {
        throw new Error('No user token available');
      }

      // Check if token is expired or about to expire (within 1 minute)
      if (expiry && expiry <= Date.now() + 60000) {
        if (refreshTokenValue) {
          return await refreshToken();
        }
        throw new Error('Token expired and no refresh token available');
      }

      return token;
    } catch (error) {
      console.error('Error getting user token:', error);
      throw error;
    }
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn: () => {
    try {
      const token = getStoredAccessToken();
      const refreshTokenValue = getRefreshToken();
      return !!(token && refreshTokenValue);
    } catch {
      return false;
    }
  },
  
  /**
   * Log user out by clearing token
   */
  logout: () => {
    localStorage.removeItem(spotifyService._tokenKey);
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
  },

  /**
   * Make an authenticated API request to Spotify with enhanced controls
   */
  async apiRequest(endpoint, options = {}, useClientTokenFallback = false) { // Changed default to false
    try {
      // For user-specific endpoints, don't fallback to client credentials
      const isUserEndpoint = endpoint.startsWith('/me') || 
                            endpoint.includes('/me/') ||
                            endpoint.includes('oauth-required');
      
      // If we're not logged in and it's not a public endpoint, throw an error
      if (!this.isLoggedIn() && (isUserEndpoint || !useClientTokenFallback)) {
        throw new Error('Authentication required for this request');
      }
      
      if (!this._apiClient) {
        this._apiClient = createApiClient({
          baseUrl: this._apiBase,
          getToken: () => this.getUserToken(),
          refreshToken: () => this.refreshAccessToken(),
          onAuthFailure: () => this.logout()
        });
      }

      // Rest of the method remains the same...
      let rateLimitConfig = this._rateLimit.default;
      let throttleFn = null;
      
      if (endpoint.includes('/search')) {
        rateLimitConfig = this._rateLimit.search;
        throttleFn = this._throttle.search;
      } else if (endpoint.includes('/browse')) {
        rateLimitConfig = this._rateLimit.browse;
        throttleFn = this._throttle.browse;
      } else if (endpoint.includes('/tracks')) {
        throttleFn = this._throttle.track(`spotify-track-${endpoint}`);
      }
      
      const cacheTime = endpoint.includes('/search') ? 60000 : 300000;
      
      const enhancedControls = {
        domain: 'api.spotify.com',
        rateLimit: rateLimitConfig.max,
        timeWindow: rateLimitConfig.window,
        cacheTime
      };

      const requestFn = throttleFn
        ? throttleFn(() => this._apiClient.request(endpoint, {
            method: options.method || 'GET',
            headers: options.headers,
            body: options.body
          }, {
            params: options.params,
            auth: true,
            enhancedControls
          }))
        : () => this._apiClient.request(endpoint, {
            method: options.method || 'GET',
            headers: options.headers,
            body: options.body
          }, {
            params: options.params,
            auth: true,
            enhancedControls
          });
      
      try {
        return await requestFn();
      } catch (err) {
        // Gracefully handle 403 Forbidden for missing scopes on specific endpoints
        const isForbidden = (err?.status === 403) || (String(err?.message || '').includes('403'));
        if (isForbidden) {
          if (endpoint.startsWith('/me/player/recently-played')) {
            console.warn('Missing scope for recently played; returning empty result');
            return { items: [] };
          }
          // For other user endpoints, bubble up
        }
        throw err;
      }
    } catch (error) {
      // Reduce noisy logging for 403/404
      if (!(error?.status === 403 || error?.status === 404 ||
            String(error?.message || '').includes('403') ||
            String(error?.message || '').includes('404'))) {
        console.error(`Error in Spotify API request to ${endpoint}:`, error);
      }
      throw error;
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    try {
      return await spotifyService.apiRequest('/me');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  /**
   * Get user's top tracks
   */
  getUserTopTracks: async (limit = 20, timeRange = 'short_term') => {
    try {
      return await spotifyService.apiRequest('/me/top/tracks', {
        params: { limit, time_range: timeRange }
      });
    } catch (error) {
      console.error('Error fetching user top tracks:', error);
      throw error;
    }
  },

  /**
   * Get user's saved albums
   */
  getSavedAlbums: async function(limit = 20, offset = 0) {
    try {
      if (!this.isLoggedIn()) {
        throw new Error('Authentication required to view saved albums');
      }
      
      const userProfile = await this.getCurrentUser().catch(() => null);
      const market = userProfile?.country || 'US';
      
      return await this.apiRequest('/me/albums', {
        params: { 
          limit, 
          offset,
          market
        }
      }, false); // Don't use client credentials fallback
    } catch (error) {
      console.error('Error fetching saved albums:', error);
      throw error;
    }
  },

  /**
   * Get trending tracks from Spotify
   */
  getTrendingTracks: async (limit = 20) => {
    try {
      const market = await spotifyService.getUserMarket().catch(() => 'US');
      const fetchPlaylistTracks = async (playlistId) =>
        spotifyService.apiRequest(`/playlists/${playlistId}/tracks`, {
          params: {
            limit,
            fields: 'items(track(id,name,album,artists,preview_url,external_urls))',
            market
          }
        });

      // Global Top 50
      try {
        const globalTop50Id = '37i9dQZEVXbMDoHDwVN2tF';
        return await fetchPlaylistTracks(globalTop50Id);
      } catch (globalErr) {
        console.warn('Global Top 50 unavailable, trying toplists:', globalErr);
      }

      // Fallback: first playlist from toplists category
      const toplists = await spotifyService.apiRequest('/browse/categories/toplists/playlists', {
        params: { limit: 1, country: market }
      });
      const fallbackPlaylist = toplists?.playlists?.items?.[0];
      if (fallbackPlaylist?.id) {
        return await fetchPlaylistTracks(fallbackPlaylist.id);
      }

      throw new Error('No Spotify toplist playlist available');
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      throw error;
    }
  },
  
  /**
   * Get featured playlists from Spotify
   */
  getFeaturedPlaylists: async (limit = 20) => {
    try {
      const market = await spotifyService.getUserMarket().catch(() => 'US');
      try {
        return await spotifyService.apiRequest('/browse/featured-playlists', {
          params: { limit, country: market }
        });
      } catch {
        // Fallback to toplists category if featured-playlists is unavailable
        const toplists = await spotifyService.apiRequest('/browse/categories/toplists/playlists', {
          params: { limit, country: market }
        });
        return toplists;
      }
    } catch (error) {
      console.error('Error fetching featured playlists:', error);
      throw error;
    }
  },

  /**
   * Get user market (country)
   */
  getUserMarket: async () => {
    try {
      const profile = await spotifyService.getCurrentUser();
      return profile?.country || 'US';
    } catch {
      return 'US';
    }
  },
  
  /**
   * Get new releases (albums) from Spotify
   */
  getNewReleases: async (limit = 20, offset = 0) => {
    try {
      // Check if user is logged in before attempting to use user token
      if (spotifyService.isLoggedIn()) {
        const market = await spotifyService.getUserMarket().catch(() => 'US');
        return await spotifyService.apiRequest('/browse/new-releases', {
          params: { 
            limit,
            offset,
            country: market
          }
        });
      } else {
        // Don't attempt API call without authentication
        throw new Error('Authentication required for Spotify new releases');
      }
    } catch (error) {
      console.error('Error fetching new releases:', error);
      throw error;
    }
  },

  /**
   * Search Spotify
   */
  search: async function(query, type = 'track', limit = 20) {
    try {
      return await this.apiRequest('/search', {
        params: { q: query, type, limit, market: 'US' }
      });
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      throw error;
    }
  },
  
  /**
   * Get track details by ID
   */
  getTrack: async (trackId) => {
    try {
      return await spotifyService.apiRequest(`/tracks/${trackId}`);
    } catch (error) {
      console.error('Error fetching track details:', error);
      throw error;
    }
  },
  
  /**
   * Get artist details by ID
   */
  getArtist: async (artistId) => {
    try {
      return await spotifyService.apiRequest(`/artists/${artistId}`);
    } catch (error) {
      console.error('Error fetching artist details:', error);
      throw error;
    }
  },
  
  /**
   * Get top tracks for an artist
   */
  getArtistTopTracks: async (artistId) => {
    try {
      return await spotifyService.apiRequest(`/artists/${artistId}/top-tracks`, {
        params: { market: 'US' }
      });
    } catch (error) {
      console.error('Error fetching artist top tracks:', error);
      throw error;
    }
  },
  
  /**
   * Get album details by ID
   */
  getAlbum: async (albumId) => {
    try {
      return await spotifyService.apiRequest(`/albums/${albumId}`);
    } catch (error) {
      console.error('Error fetching album details:', error);
      throw error;
    }
  },
  
  /**
   * Get playlist details by ID
   */
  getPlaylist: async (playlistId) => {
    try {
      return await spotifyService.apiRequest(`/playlists/${playlistId}`);
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      throw error;
    }
  },
  
  /**
   * Get music categories from Spotify
   */
  getCategories: async (limit = 50) => {
    try {
      return await spotifyService.apiRequest('/browse/categories', {
        params: { country: 'US', limit }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  
  /**
   * Get user's saved tracks
   */
  getSavedTracks: async (limit = 50) => {
    try {
      return await spotifyService.apiRequest('/me/tracks', {
        params: { limit }
      });
    } catch (error) {
      console.error('Error fetching saved tracks:', error);
      throw error;
    }
  },
  
  /**
   * Save a track for the user
   */
  saveTrack: async (trackId) => {
    try {
      return await spotifyService.apiRequest(`/me/tracks`, {
        method: 'PUT',
        body: { ids: [trackId] }
      });
    } catch (error) {
      console.error('Error saving track:', error);
      throw error;
    }
  },
  
  /**
   * Remove a saved track
   */
  removeSavedTrack: async (trackId) => {
    try {
      return await spotifyService.apiRequest(`/me/tracks`, {
        method: 'DELETE',
        body: { ids: [trackId] }
      });
    } catch (error) {
      console.error('Error removing saved track:', error);
      throw error;
    }
  },
  
  /**
   * Check if tracks are saved in user's library
   */
  checkSavedTracks: async (trackIds) => {
    try {
      return await spotifyService.apiRequest(`/me/tracks/contains`, {
        params: { ids: trackIds.join(',') }
      });
    } catch (error) {
      console.error('Error checking saved tracks:', error);
      throw error;
    }
  },
  

  /**
   * Initialize Spotify Web Playback SDK
   * Only works for Premium users - non-premium users should skip this
   */
  initializePlayer: async function(onPlayerStateChanged = null) {
    if (this._player && this._isPlayerReady && this._deviceId) {
      this._onPlayerStateChanged = onPlayerStateChanged;
      return true;
    }
    // Check premium status first to avoid unnecessary SDK errors
    const hasPremium = await this.isPremiumAccount();
    if (!hasPremium) {
      this._player = null;
      this._deviceId = null;
      this._isPlayerReady = false;
      throw new Error('Spotify Premium required for playback');
    }

    // Robust SDK loading with error handling
    try {
      if (!window.Spotify) {
        await this._loadSpotifyScript();
      }
    } catch {
      this._player = null;
      this._deviceId = null;
      this._isPlayerReady = false;
      throw new Error('Failed to load Spotify Web Playback SDK');
    }

    this._onPlayerStateChanged = onPlayerStateChanged;

    try {
      this._player = new window.Spotify.Player({
        name: 'Musix Web Player',
        getOAuthToken: async cb => {
          try {
            const freshToken = await this.getAccessToken();
            cb(freshToken);
          } catch (tokenError) {
            console.error('Error fetching Spotify access token:', tokenError);
          }
        },
      volume: 0.5,
      // Reduce playback errors by ensuring proper content protection config
      robustness: 'SW_SECURE_CRYPTO'
      });

      // Setup player event listeners
      this._player.addListener('initialization_error', e => {
        console.error('Failed to initialize player', e);
      });

      this._player.addListener('authentication_error', async e => {
        console.error('Spotify authentication error', e);
      });

      this._player.addListener('account_error', e => {
        console.error('Spotify account error', e);
      });

      this._player.addListener('playback_error', e => {
        const message = e?.message || '';
        if (message.includes('no list was loaded')) return;
        console.error('Playback error', e);
      });

      this._player.addListener('player_state_changed', state => {
        if (!state) return;
        if (this._onPlayerStateChanged) {
          this._onPlayerStateChanged(state);
        }
      });

      // Wait for player to be ready
      const readyPromise = new Promise((resolve, reject) => {
        this._player.addListener('ready', async ({ device_id: devId }) => {
          this._deviceId = devId;
          this._isPlayerReady = true;
          resolve(true);
        });
        this._player.addListener('not_ready', () => {
          this._isPlayerReady = false;
        });
        // Fallback: timeout if not ready in 10s
        setTimeout(() => {
          if (!this._isPlayerReady) {
            reject(new Error('Spotify player did not become ready'));
          }
        }, 10000);
      });

      await this._player.connect();
      await readyPromise;
      return true;
    } catch (error) {
      this._player = null;
      this._deviceId = null;
      this._isPlayerReady = false;
      console.error('Error initializing Spotify player:', error);
      throw new Error('Failed to initialize Spotify player: ' + (error?.message || error));
    }
  },

  /**
   * Load Spotify Web Playback SDK script
   */
  _loadSpotifyScript: function() {
    return new Promise((resolve, reject) => {
      if (window.Spotify) {
        resolve();
        return;
      }

      // Define readiness callback expected by the SDK
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (window.Spotify) {
          resolve();
        } else {
          // Fallback resolve to avoid hanging
          resolve();
        }
      };

      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load Spotify Web Playback SDK'));
      document.body.appendChild(script);

      // Fallback timeout in case callback isn’t fired
      setTimeout(() => {
        if (window.Spotify) resolve();
      }, 5000);
    });
  },

  /**
   * Ensure the web player is ready before issuing playback commands
   */
  ensurePlayerReady: async function() {
    if (this._isPlayerReady && this._deviceId) return true;
    await this.initializePlayer(this._onPlayerStateChanged);
    return this._isPlayerReady && !!this._deviceId;
  },

  /**
   * Attempt to activate the web player device for playback
   */
  ensureActiveDevice: async function() {
    if (!this._deviceId) return false;
    try {
      await this.transferPlayback(this._deviceId, true);
      return true;
    } catch (error) {
      if (error?.status !== 404) {
        console.warn('Could not activate web player device:', error);
      }
      return false;
    }
  },

  // Playback control methods
  play: async function(uri, options = {}) {
    if (!this._isPlayerReady || !this._deviceId) {
      await this.ensurePlayerReady();
    }
    if (!this._isPlayerReady || !this._deviceId) {
      throw new Error('Spotify player not ready');
    }
    
    try {
      const hasActiveDevice = await this.ensureActiveDevice();
      if (!hasActiveDevice) {
        throw new Error('No active Spotify device. Open Spotify and start playback.');
      }
      const playData = {};
      
      if (uri) {
        playData[uri.includes('track') ? 'uris' : 'context_uri'] = 
          uri.includes('track') ? [uri] : uri;
      }
      
      if (options.position_ms) {
        playData.position_ms = options.position_ms;
      }
      
      await this.apiRequest(`/me/player/play?device_id=${this._deviceId}`, {
        method: 'PUT',
        body: playData
      });
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  },

  pause: async function() {
    if (this._player && this._isPlayerReady) {
      try {
        await this._player.pause();
        return;
      } catch (error) {
        console.warn('SDK pause failed, falling back to API:', error);
      }
    }
    if (!this._isPlayerReady || !this._deviceId) {
      await this.ensurePlayerReady();
    }
    if (!this._isPlayerReady) throw new Error('Spotify player not ready');
    
    try {
      await this.apiRequest('/me/player/pause', { method: 'PUT' });
    } catch (error) {
      console.error('Error pausing playback:', error);
      throw error;
    }
  },

  resume: async function() {
    if (this._player && this._isPlayerReady) {
      try {
        await this._player.resume();
        return;
      } catch (error) {
        console.warn('SDK resume failed, falling back to API:', error);
      }
    }
    if (!this._isPlayerReady || !this._deviceId) {
      await this.ensurePlayerReady();
    }
    if (!this._isPlayerReady) throw new Error('Spotify player not ready');
    
    try {
      await this.apiRequest('/me/player/play', { method: 'PUT' });
    } catch (error) {
      console.error('Error resuming playback:', error);
      throw error;
    }
  },

  togglePlayPause: async function() {
    if (!this._player) {
      await this.ensurePlayerReady();
    }
    if (!this._player) throw new Error('Spotify player not initialized');
    
    try {
      await this._player.togglePlay();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      throw error;
    }
  },

  seekToPosition: async function(positionMs) {
    if (this._player && this._isPlayerReady) {
      try {
        await this._player.seek(positionMs);
        return;
      } catch (error) {
        console.warn('SDK seek failed, falling back to API:', error);
      }
    }
    if (!this._isPlayerReady || !this._deviceId) {
      await this.ensurePlayerReady();
    }
    if (!this._isPlayerReady) throw new Error('Spotify player not ready');
    
    try {
      await this.apiRequest('/me/player/seek', {
        method: 'PUT',
        params: {
          position_ms: positionMs,
          device_id: this._deviceId
        }
      });
    } catch (error) {
      console.error('Error seeking to position:', error);
      throw error;
    }
  },

  /**
   * Transfer playback to a specific device ID
   */
  transferPlayback: async function(deviceId, play = false) {
    try {
      await this.apiRequest('/me/player', {
        method: 'PUT',
        body: {
          device_ids: [deviceId],
          play
        }
      });
    } catch (error) {
      if (error?.status !== 404) {
        console.error('Error transferring playback:', error);
      }
      throw error;
    }
  },

  /**
   * Set playback volume (0-100)
   * @param {number} volumePercent
   */
  setVolume: async function(volumePercent, deviceId = null) {
    try {
      if (this._player && this._isPlayerReady) {
        try {
          await this._player.setVolume(Math.max(0, Math.min(100, volumePercent)) / 100);
          return;
        } catch (error) {
          console.warn('SDK setVolume failed, falling back to API:', error);
        }
      }
      if (!this._isPlayerReady || !this._deviceId) {
        await this.ensurePlayerReady();
      }
      const params = { volume_percent: Math.max(0, Math.min(100, Math.round(volumePercent))) };
      if (deviceId || this._deviceId) {
        params.device_id = deviceId || this._deviceId;
      }
      await this.apiRequest('/me/player/volume', {
        method: 'PUT',
        params
      });
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  },

  getPlaybackState: async function() {
    try {
      return await this.apiRequest('/me/player');
    } catch (error) {
      console.error('Error getting playback state:', error);
      throw error;
    }
  },

  /**
   * Check if a Spotify Premium account is connected
   * @returns {Promise<boolean>} - Premium status
   */
  isPremiumAccount: async function() {
    // Check for debug override
    if (window.localStorage.getItem('spotify_force_premium') === 'true') {
      return true;
    }
    
    try {
      const userData = await this.getCurrentUser();
      
      // More robust check
      if (!userData) return false;
      
      // Check for premium in a case-insensitive way
      const product = userData.product || '';
      return product.toLowerCase() === 'premium';
    } catch (error) {
      // On token errors, silently return false 
      if (error.message?.includes('401') || error.message?.includes('403')) {
        console.warn('Token invalid; premium check skipped, showing player as display-only');
        return true; // Return true to show player despite auth errors (display mode)
      }
      console.error('Error checking premium status:', error);
      return false;
    }
  },

  disconnectPlayer: function() {
    if (this._player) {
      this._player.disconnect();
      this._player = null;
      this._deviceId = null;
      this._isPlayerReady = false;
    }
  },

  /**
   * Get currently playing track
   * @returns {Promise<Object>} Currently playing track data
   */
  getCurrentlyPlaying: async function() {
    try {
      const response = await this.apiRequest('/me/player/currently-playing');
      // Spotify returns 204 No Content when nothing is playing
      if (!response || Object.keys(response).length === 0) {
        return null;
      }
      return response;
    } catch (error) {
      console.error('Error getting currently playing track:', error);
      throw error;
    }
  },

  /**
   * Get AI-powered track recommendations based on seeds
   * @param {Object} options - Recommendation parameters
   * @param {Array<string>} options.seed_tracks - Track IDs to use as seeds (max 5 combined with artists and genres)
   * @param {Array<string>} options.seed_artists - Artist IDs to use as seeds
   * @param {Array<string>} options.seed_genres - Genre names to use as seeds
   * @param {number} options.limit - Number of recommendations (default 20, max 100)
   * @param {Object} options.target_* - Target audio features (energy, danceability, etc.)
   * @returns {Promise<Object>} Recommended tracks
   */
  getRecommendations: async function(options = {}) {
    try {
      const params = {
        limit: options.limit || 20,
        market: 'US'
      };

      // Add seeds (max 5 total across all seed types)
      if (options.seed_tracks && options.seed_tracks.length > 0) {
        params.seed_tracks = options.seed_tracks.slice(0, 5).join(',');
      }
      if (options.seed_artists && options.seed_artists.length > 0) {
        params.seed_artists = options.seed_artists.slice(0, 5).join(',');
      }
      if (options.seed_genres && options.seed_genres.length > 0) {
        params.seed_genres = options.seed_genres.slice(0, 5).join(',');
      }

      // Add target audio features if provided
      const audioFeatures = [
        'target_acousticness', 'target_danceability', 'target_energy',
        'target_instrumentalness', 'target_liveness', 'target_loudness',
        'target_speechiness', 'target_tempo', 'target_valence',
        'min_energy', 'max_energy', 'min_tempo', 'max_tempo'
      ];

      audioFeatures.forEach(feature => {
        if (options[feature] !== undefined) {
          params[feature] = options[feature];
        }
      });

      return await this.apiRequest('/recommendations', { params });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  },

  /**
   * Add a track to the user's playback queue
   * @param {string} trackUri - Spotify URI of the track to add (e.g., 'spotify:track:xxxxx')
   * @param {string} deviceId - Optional device ID (uses active device if not specified)
   * @returns {Promise<void>}
   */
  addToQueue: async function(trackUri, deviceId = null) {
    try {
      if (!deviceId && (!this._isPlayerReady || !this._deviceId)) {
        await this.ensurePlayerReady();
      }
      const hasActiveDevice = await this.ensureActiveDevice();
      if (!hasActiveDevice) {
        throw new Error('No active Spotify device. Open Spotify and start playback.');
      }
      const params = { uri: trackUri };
      const resolvedDeviceId = deviceId || this._deviceId;
      if (resolvedDeviceId) {
        params.device_id = resolvedDeviceId;
      }
      await this.apiRequest('/me/player/queue', {
        method: 'POST',
        params
      });
    } catch (error) {
      console.error('Error adding track to queue:', error);
      throw error;
    }
  },

  /**
   * Skip to next track in queue
   * @param {string} deviceId - Optional device ID
   * @returns {Promise<void>}
   */
  skipToNext: async function(deviceId = null) {
    try {
      if (this._player && this._isPlayerReady) {
        try {
          await this._player.nextTrack();
          return;
        } catch (error) {
          console.warn('SDK nextTrack failed, falling back to API:', error);
        }
      }
      if (!this._isPlayerReady || !this._deviceId) {
        await this.ensurePlayerReady();
      }
      const params = {};
      const resolvedDeviceId = deviceId || this._deviceId;
      if (resolvedDeviceId) {
        params.device_id = resolvedDeviceId;
      }

      await this.apiRequest('/me/player/next', {
        method: 'POST',
        params
      });
    } catch (error) {
      console.error('Error skipping to next track:', error);
      throw error;
    }
  },

  /**
   * Skip to previous track
   * @param {string} deviceId - Optional device ID
   * @returns {Promise<void>}
   */
  skipToPrevious: async function(deviceId = null) {
    try {
      if (this._player && this._isPlayerReady) {
        try {
          await this._player.previousTrack();
          return;
        } catch (error) {
          console.warn('SDK previousTrack failed, falling back to API:', error);
        }
      }
      if (!this._isPlayerReady || !this._deviceId) {
        await this.ensurePlayerReady();
      }
      const params = {};
      const resolvedDeviceId = deviceId || this._deviceId;
      if (resolvedDeviceId) {
        params.device_id = resolvedDeviceId;
      }

      await this.apiRequest('/me/player/previous', {
        method: 'POST',
        params
      });
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      throw error;
    }
  },

  /**
   * Get audio features for a track
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} Audio features data
   */
  getAudioFeatures: async function(trackId) {
    try {
      return await this.apiRequest(`/audio-features/${trackId}`);
    } catch (error) {
      // Gracefully handle 403 (missing scope)
      const isForbidden = (error?.status === 403) || String(error?.message || '').includes('403');
      if (isForbidden) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get audio features for multiple tracks
   * @param {Array<string>} trackIds - Array of track IDs (max 100)
   * @returns {Promise<Object>} Audio features data for multiple tracks
   */
  getMultipleAudioFeatures: async function(trackIds) {
    try {
      return await this.apiRequest('/audio-features', {
        params: { ids: trackIds.join(',') }
      });
    } catch (error) {
      // Gracefully handle 403 (missing scope) by returning empty features
      const isForbidden = (error?.status === 403) || String(error?.message || '').includes('403');
      if (isForbidden) {
        return { audio_features: [] };
      }
      throw error;
    }
  }
};

/**
 * Create a debounced search function for component use
 */
export function createDebouncedSpotifySearch(wait = 500) {
  let timeout;
  
  return function(query, type = 'track', limit = 20) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeout);
      
      timeout = setTimeout(async () => {
        try {
          resolve(await spotifyService.search(query, type, limit));
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

/**
 * Add a fallback function that returns curated data when auth fails
 */
// Removed unused fetchFallbackNewReleases