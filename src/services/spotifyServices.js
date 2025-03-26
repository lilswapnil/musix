import { enhancedApiRequest, throttle } from '../utils/requestUtils';

/**
 * Spotify API Services with debouncing and throttling
 */
export const spotifyService = {
  // API configuration
  _clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
  _clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
  _redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback',
  _scopes: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative'
  ],
  _apiBase: 'https://api.spotify.com/v1',
  _authBase: 'https://accounts.spotify.com/api',
  _tokenKey: 'spotify_auth_data',

  // API rate limits
  _rateLimit: {
    search: { max: 10, window: 30000 }, // 10 requests per 30 seconds
    browse: { max: 20, window: 60000 },  // 20 requests per minute
    default: { max: 50, window: 60000 }  // Default 50 requests per minute
  },
  
  // Throttle configurations
  _throttle: {
    search: throttle(2000)('spotify-search'),  // 1 search request per 2 seconds
    browse: throttle(1000)('spotify-browse'),  // 1 browse request per second
    track: throttle(500)('spotify-track')      // 2 track requests per second
  },

  /**
   * Generate random string for state parameter
   * @param {number} length - Length of string
   * @returns {string} - Random string
   */
  _generateRandomString: (length = 32) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  },

  /**
   * Generate a code challenge for PKCE flow
   * @param {string} codeVerifier - Code verifier
   * @returns {Promise<string>} - Code challenge
   */
  _generateCodeChallenge: async (codeVerifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  },

  /**
   * Generate authorization URL for Spotify OAuth
   * @returns {Promise<Object>} - Auth URL and verifier
   */
  createAuthUrl: async () => {
    try {
      const state = spotifyService._generateRandomString();
      const codeVerifier = spotifyService._generateRandomString(64);
      const codeChallenge = await spotifyService._generateCodeChallenge(codeVerifier);
      
      // Store state and code verifier for later verification
      localStorage.setItem('spotify_auth_state', state);
      localStorage.setItem('spotify_code_verifier', codeVerifier);
      
      const params = new URLSearchParams({
        client_id: spotifyService._clientId,
        response_type: 'code',
        redirect_uri: spotifyService._redirectUri,
        state: state,
        scope: spotifyService._scopes.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        show_dialog: 'false'
      });
      
      return {
        url: `https://accounts.spotify.com/authorize?${params.toString()}`,
        verifier: codeVerifier
      };
    } catch (error) {
      console.error('Error creating auth URL:', error);
      throw error;
    }
  },
  
  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @param {string} verifier - Code verifier from initial request
   * @returns {Promise<Object>} - Token response
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
          code: code,
          redirect_uri: spotifyService._redirectUri,
          code_verifier: verifier
        }).toString()
      });
      
      if (!response.ok) {
        throw new Error(`Spotify auth error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save token with expiration
      const tokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires: Date.now() + (data.expires_in * 1000)
      };
      localStorage.setItem(spotifyService._tokenKey, JSON.stringify(tokenData));
      
      return data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  },
  
  /**
   * Refresh access token using refresh token
   * @returns {Promise<string>} - New access token
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
        }).toString()
      });
      
      if (!response.ok) {
        throw new Error(`Refresh token error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update stored token
      tokenData.access_token = data.access_token;
      tokenData.expires = Date.now() + (data.expires_in * 1000);
      
      // If a new refresh token was provided, update that too
      if (data.refresh_token) {
        tokenData.refresh_token = data.refresh_token;
      }
      
      localStorage.setItem(spotifyService._tokenKey, JSON.stringify(tokenData));
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem(spotifyService._tokenKey); // Clear invalid token
      throw error;
    }
  },
  
  /**
   * Get client credentials token (app-only, no user context)
   * @returns {Promise<string>} - Access token
   */
  getClientCredentialsToken: async () => {
    try {
      const clientCreds = btoa(`${spotifyService._clientId}:${spotifyService._clientSecret}`);
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${clientCreds}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      
      if (!response.ok) {
        throw new Error(`Client credentials error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store client token separately
      localStorage.setItem('spotify_client_token', JSON.stringify({
        access_token: data.access_token,
        expires: Date.now() + (data.expires_in * 1000)
      }));
      
      return data.access_token;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      throw error;
    }
  },
  
  /**
   * Get an access token (user token if available, client token as fallback)
   * @returns {Promise<string>} - Access token
   */
  getAccessToken: async () => {
    try {
      // Check for user token first
      const tokenData = JSON.parse(localStorage.getItem(spotifyService._tokenKey) || '{}');
      
      // If we have a valid user token
      if (tokenData.access_token && tokenData.expires) {
        // If token is expired but we have refresh token, refresh it
        if (tokenData.expires <= Date.now() + 60000) {
          if (tokenData.refresh_token) {
            return await spotifyService.refreshAccessToken();
          }
        } else {
          // Token is still valid
          return tokenData.access_token;
        }
      }
      
      // Fall back to client credentials if no valid user token
      const clientTokenData = JSON.parse(localStorage.getItem('spotify_client_token') || '{}');
      
      if (clientTokenData.access_token && clientTokenData.expires > Date.now() + 60000) {
        return clientTokenData.access_token;
      }
      
      // Get a new client credentials token
      return await spotifyService.getClientCredentialsToken();
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  },
  
  /**
   * Make an authenticated API request to Spotify with enhanced controls
   */
  async apiRequest(endpoint, options = {}) {
    try {
      const token = await this.getAccessToken();
      const url = `${this._apiBase}${endpoint}`;
      
      // Add query params if provided
      const urlWithParams = options.params
        ? `${url}?${new URLSearchParams(options.params).toString()}`
        : url;
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };
      
      // Don't include params in the request options since they're now in URL
      delete requestOptions.params;
      
      if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
      }
      
      // Determine rate limits based on endpoint type
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
      
      // Apply throttling if configured for this endpoint type
      const requestFn = throttleFn
        ? throttleFn(() => enhancedApiRequest(urlWithParams, requestOptions, {
            domain: 'api.spotify.com',
            rateLimit: rateLimitConfig.max,
            timeWindow: rateLimitConfig.window,
            cacheTime: endpoint.includes('/search') ? 60000 : 300000 // Shorter cache for searches
          }))
        : () => enhancedApiRequest(urlWithParams, requestOptions, {
            domain: 'api.spotify.com',
            rateLimit: rateLimitConfig.max,
            timeWindow: rateLimitConfig.window
          });
      
      // Execute the request
      return await requestFn();
    } catch (error) {
      // Handle 401 unauthorized errors
      if (error.message && error.message.includes('401')) {
        try {
          const newToken = await this.refreshAccessToken();
          return this.apiRequest(endpoint, options); // Retry with new token
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw error; // If refresh fails, throw the original error
        }
      }
      
      console.error(`Error in Spotify API request to ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Check if user is logged in
   * @returns {boolean} - Login status
   */
  isLoggedIn: () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem(spotifyService._tokenKey) || '{}');
      return !!(tokenData.access_token && tokenData.refresh_token);
    } catch (error) {
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
   * Get current user profile
   * @returns {Promise<Object>} - User data
   */
  getCurrentUser: async () => {
    try {
      const userData = await spotifyService.apiRequest('/me');
      
      // Cache the user profile
      if (userData) {
        setUserProfile(userData);
      }
      
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  /**
   * Get user's top tracks
   * @param {number} limit - Maximum number of tracks to return
   * @param {string} timeRange - short_term, medium_term, or long_term
   * @returns {Promise<Object>} - Top tracks data
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
   * Get trending tracks from Spotify
   * @param {number} limit - Maximum number of tracks to return
   * @returns {Promise<Object>} - Chart data
   */
  getTrendingTracks: async (limit = 20) => {
    try {
      // Get global top 50 playlist
      const globalTop50Id = '37i9dQZEVXbMDoHDwVN2tF';
      return await spotifyService.apiRequest(`/playlists/${globalTop50Id}/tracks`, {
        params: { limit, fields: 'items(track(id,name,album,artists,preview_url,external_urls))' }
      });
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      throw error;
    }
  },
  
  /**
   * Get featured playlists from Spotify
   * @param {number} limit - Maximum number of playlists to return
   * @returns {Promise<Object>} - Playlist data
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
   * @param {number} limit - Maximum number of albums to return
   * @returns {Promise<Object>} - Album data
   */
  getNewReleases: async (limit = 20) => {
    try {
      return await spotifyService.apiRequest('/browse/new-releases', {
        params: { limit, country: 'US' }
      });
    } catch (error) {
      console.error('Error fetching new releases:', error);
      throw error;
    }
  },
  
  /**
   * Search Spotify
   * @param {string} query - Search query
   * @param {string} type - Type of search: track, album, artist, playlist
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Object>} - Search results
   */
  search: async function(query, type = 'track', limit = 20) {
    try {
      // For search, we use the existing API request with the throttling applied
      return await this.apiRequest('/search', {
        params: {
          q: query,
          type,
          limit,
          market: 'US'
        }
      });
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      throw error;
    }
  },
  
  /**
   * Get track details by ID
   * @param {string} trackId - Spotify track ID
   * @returns {Promise<Object>} - Track data
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
   * @param {string} artistId - Spotify artist ID
   * @returns {Promise<Object>} - Artist data
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
   * @param {string} artistId - Spotify artist ID
   * @returns {Promise<Object>} - Artist's top tracks
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
   * @param {string} albumId - Spotify album ID
   * @returns {Promise<Object>} - Album data
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
   * @param {string} playlistId - Spotify playlist ID
   * @returns {Promise<Object>} - Playlist data
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
   * @param {number} limit - Maximum number of categories
   * @returns {Promise<Object>} - Category data
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
   * @param {number} limit - Maximum number of tracks
   * @returns {Promise<Object>} - Saved tracks data
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
   * @param {string} trackId - Spotify track ID to save
   * @returns {Promise<Object>} - Response
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
   * @param {string} trackId - Spotify track ID to remove
   * @returns {Promise<Object>} - Response
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
   * @param {Array<string>} trackIds - Array of track IDs to check
   * @returns {Promise<Array<boolean>>} - Array of booleans
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

  refreshToken: async () => {
    try {
      // Your existing refresh token code...
      
      // After successful token refresh, trigger genre generation
      // to keep genres fresh even if user doesn't log out/in often
      const genreService = await import('./genreService').then(m => m.default);
      genreService.generateUserGenresInBackground();
      
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },
};

/**
 * Create a debounced search function for component use
 * @param {number} wait - Debounce delay in ms
 * @returns {Function} - Debounced search function
 */
export function createDebouncedSpotifySearch(wait = 500) {
  let timeout;
  
  return function(query, type = 'track', limit = 20) {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(async () => {
        try {
          const result = await spotifyService.search(query, type, limit);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}