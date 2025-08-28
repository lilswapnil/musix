import { enhancedApiRequest, throttle } from '../utils/requestUtils';

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
    'user-read-currently-playing'
  ],
  _apiBase: 'https://api.spotify.com/v1',
  _authBase: 'https://accounts.spotify.com/api',
  _tokenKey: 'spotify_auth_data',

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
    track: throttle(500)('spotify-track')
  },

  // Player configurations
  _player: null,
  _deviceId: null,
  _isPlayerReady: false,
  _onPlayerStateChanged: null,

  /**
   * Generate random string for state parameter
   */
  _generateRandomString: (length = 32) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => 
      possible.charAt(Math.floor(Math.random() * possible.length))).join('');
  },

  /**
   * Generate authorization URL for Spotify OAuth
   */
  createAuthUrl: async () => {
    try {
      const state = spotifyService._generateRandomString();
      const codeVerifier = spotifyService._generateRandomString(64);
      const codeChallenge = await spotifyService._generateCodeChallenge(codeVerifier);
      
      localStorage.setItem('spotify_auth_state', state);
      localStorage.setItem('spotify_code_verifier', codeVerifier);
      
      const params = new URLSearchParams({
        client_id: spotifyService._clientId,
        response_type: 'code',
        redirect_uri: spotifyService._redirectUri,
        state,
        scope: spotifyService._scopes.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        show_dialog: 'false'
      });
      
      return {
        url: `https://accounts.spotify.com/authorize?${params}`,
        verifier: codeVerifier
      };
    } catch (error) {
      console.error('Error creating auth URL:', error);
      throw error;
    }
  },
  
  /**
   * Exchange authorization code for access token
   */
  getTokenFromCode: async (code, verifier) => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: spotifyService._clientId,
          grant_type: 'authorization_code',
          code,
          redirect_uri: spotifyService._redirectUri,
          code_verifier: verifier
        })
      });
      
      if (!response.ok) {
        throw new Error(`Spotify auth error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save token with expiration
      localStorage.setItem(spotifyService._tokenKey, JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires: Date.now() + (data.expires_in * 1000)
      }));
      
      return data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  },
  
  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken: async () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem(spotifyService._tokenKey) || '{}');
      const refreshToken = tokenData.refresh_token;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: spotifyService._clientId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Refresh token error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update stored token
      const newTokenData = {
        access_token: data.access_token,
        expires: Date.now() + (data.expires_in * 1000),
        refresh_token: data.refresh_token || refreshToken
      };
      
      localStorage.setItem(spotifyService._tokenKey, JSON.stringify(newTokenData));
      
      // Refresh genres after token refresh
      import('./genreService').then(m => m.default.generateUserGenresInBackground());
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem(spotifyService._tokenKey);
      throw error;
    }
  },
  
  /**
   * Get an access token (user token only, no client credentials fallback)
   */
  getAccessToken: async () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem(spotifyService._tokenKey) || '{}');
      
      if (tokenData.access_token && tokenData.expires) {
        if (tokenData.expires <= Date.now() + 60000) {
          if (tokenData.refresh_token) {
            return await spotifyService.refreshAccessToken();
          }
        } else {
          return tokenData.access_token;
        }
      }
      
      throw new Error('No access token available and user not authenticated');
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
      const tokenData = JSON.parse(localStorage.getItem(this._tokenKey) || '{}');
      
      if (tokenData.access_token && tokenData.expires) {
        if (tokenData.expires <= Date.now() + 60000) {
          if (tokenData.refresh_token) {
            return await this.refreshAccessToken();
          }
          throw new Error('Token expired and no refresh token available');
        } else {
          return tokenData.access_token;
        }
      }
      
      throw new Error('No user token available');
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
      const tokenData = JSON.parse(localStorage.getItem(spotifyService._tokenKey) || '{}');
      return !!(tokenData.access_token && tokenData.refresh_token);
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
      
      // Try to get a token - only use user token, not client credentials
      const token = await this.getUserToken().catch(e => {
        console.error('Failed to get user token:', e);
        throw new Error('Authentication required');
      });
      
      const url = `${this._apiBase}${endpoint}`;
      
      const urlWithParams = options.params
        ? `${url}?${new URLSearchParams(options.params)}`
        : url;
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };
      
      if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
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
        throttleFn = this._throttle.track;
      }
      
      const cacheTime = endpoint.includes('/search') ? 60000 : 300000;
      
      const requestFn = throttleFn
        ? throttleFn(() => enhancedApiRequest(urlWithParams, requestOptions, {
            domain: 'api.spotify.com',
            rateLimit: rateLimitConfig.max,
            timeWindow: rateLimitConfig.window,
            cacheTime
          }))
        : () => enhancedApiRequest(urlWithParams, requestOptions, {
            domain: 'api.spotify.com',
            rateLimit: rateLimitConfig.max,
            timeWindow: rateLimitConfig.window,
            cacheTime
          });
      
      return await requestFn();
    } catch (error) {
      // Handle 401 unauthorized errors
      if (error.message?.includes('401')) {
        try {
          await this.refreshAccessToken();
          return this.apiRequest(endpoint, options); // Retry with new token
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw new Error(`Authentication failed: ${refreshError.message || 'Token refresh failed'}`);
        }
      }
      
      console.error(`Error in Spotify API request to ${endpoint}:`, error);
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
      const globalTop50Id = '37i9dQZEVXbMDoHDwVN2tF';
      return await spotifyService.apiRequest(`/playlists/${globalTop50Id}/tracks`, {
        params: { 
          limit, 
          fields: 'items(track(id,name,album,artists,preview_url,external_urls))' 
        }
      });
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
      return await spotifyService.apiRequest('/browse/featured-playlists', {
        params: { limit, country: 'US' }
      });
    } catch (error) {
      console.error('Error fetching featured playlists:', error);
      throw error;
    }
  },
  
  /**
   * Get new releases (albums) from Spotify
   */
  getNewReleases: async (limit = 20) => {
    try {
      // Check if user is logged in before attempting to use user token
      if (spotifyService.isLoggedIn()) {
        return await spotifyService.apiRequest('/browse/new-releases', {
          params: { 
            limit,
            country: 'US'
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
   * Create a redirect to the Spotify login page
   */
  redirectToSpotify: async () => {
    try {
      const { url } = await spotifyService.createAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Error redirecting to Spotify:', error);
      throw error;
    }
  },

  /**
   * Initialize Spotify Web Playback SDK
   */
  initializePlayer: async function(onPlayerStateChanged = null) {
    if (!window.Spotify) {
      await this._loadSpotifyScript();
    }
    
    this._onPlayerStateChanged = onPlayerStateChanged;
    
    try {
      const token = await this.getAccessToken();
      
      this._player = new window.Spotify.Player({
        name: 'Musix Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });
      
      // Setup player event listeners
      this._player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize player:', message);
      });
      
      this._player.addListener('authentication_error', async ({ message }) => {
        console.error('Failed to authenticate player:', message);
        try {
          await this.refreshAccessToken();
          this._player.disconnect();
          await this.initializePlayer(onPlayerStateChanged);
        } catch (err) {
          console.error('Could not recover from authentication error:', err);
        }
      });
      
      this._player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        alert('Spotify Premium is required for playback functionality');
      });
      
      this._player.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
      });
      
      this._player.addListener('player_state_changed', state => {
        if (!state) return;
        if (this._onPlayerStateChanged) {
          this._onPlayerStateChanged(state);
        }
      });
      
      this._player.addListener('ready', ({ device_id: devId }) => {
        console.log('Spotify player ready with device ID:', devId);
        this._deviceId = devId;
        this._isPlayerReady = true;
      });
      
      this._player.addListener('not_ready', () => {
        console.log('Spotify player disconnected');
        this._isPlayerReady = false;
      });
      
      await this._player.connect();
      return true;
    } catch (error) {
      console.error('Error initializing Spotify player:', error);
      return false;
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
      
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Spotify Web Playback SDK'));
      
      document.body.appendChild(script);
    });
  },

  // Playback control methods
  play: async function(uri, options = {}) {
    if (!this._isPlayerReady || !this._deviceId) {
      throw new Error('Spotify player not ready');
    }
    
    try {
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
    if (!this._isPlayerReady) throw new Error('Spotify player not ready');
    
    try {
      await this.apiRequest('/me/player/pause', { method: 'PUT' });
    } catch (error) {
      console.error('Error pausing playback:', error);
      throw error;
    }
  },

  resume: async function() {
    if (!this._isPlayerReady) throw new Error('Spotify player not ready');
    
    try {
      await this.apiRequest('/me/player/play', { method: 'PUT' });
    } catch (error) {
      console.error('Error resuming playback:', error);
      throw error;
    }
  },

  togglePlayPause: async function() {
    if (!this._player) throw new Error('Spotify player not initialized');
    
    try {
      await this._player.togglePlay();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      throw error;
    }
  },

  seekToPosition: async function(positionMs) {
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
      console.log('Using forced premium mode from localStorage');
      return true;
    }
    
    try {
      const userData = await this.getCurrentUser();
      console.log('Spotify user data for premium check:', userData);
      
      // More robust check
      if (!userData) return false;
      
      // Check for premium in a case-insensitive way
      const product = userData.product || '';
      return product.toLowerCase() === 'premium';
    } catch (error) {
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