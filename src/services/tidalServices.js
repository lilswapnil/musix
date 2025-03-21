import { cachedFetch } from '../utils/requestUtils.js';

/**
 * Tidal API Services
 * Provides methods to interact with the Tidal API through CORS proxy
 */
export const tidalService = {
  // API configuration
  _clientId: import.meta.env.VITE_TIDAL_CLIENT_ID || '',
  _clientSecret: import.meta.env.VITE_TIDAL_CLIENT_SECRET || '',
  _apiBase: 'https://api.tidal.com/v1',
  _corsProxy: 'https://corsproxy.io/?',
  _tokenKey: 'tidal_access_token',
  
  /**
   * Get authorization token for Tidal API
   * @returns {Promise<string>} - Access token
   */
  getAccessToken: async function() {
    // First check localStorage for existing token
    const storedToken = localStorage.getItem(this._tokenKey);
    if (storedToken) {
      try {
        const tokenData = JSON.parse(storedToken);
        // Check if token is still valid (with 1 minute buffer)
        if (tokenData.expires > Date.now() + 60000) {
          return tokenData.access_token;
        }
      } catch (err) {
        console.error('Error parsing stored token:', err);
      }
    }
    
    // If no valid token, request a new one
    try {
      const authUrl = `${this._apiBase}/oauth2/token`;
      const response = await fetch(`${this._corsProxy}${encodeURIComponent(authUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this._clientId,
          client_secret: this._clientSecret,
        }).toString(),
      });
      
      if (!response.ok) {
        throw new Error(`Tidal API auth error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save token with expiration
      const tokenData = {
        access_token: data.access_token,
        expires: Date.now() + (data.expires_in * 1000)
      };
      localStorage.setItem(this._tokenKey, JSON.stringify(tokenData));
      
      return data.access_token;
    } catch (error) {
      console.error('Error fetching Tidal access token:', error);
      throw error;
    }
  },
  
  /**
   * Make an authenticated API request to Tidal
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - JSON response
   */
  async apiRequest(endpoint, options = {}) {
    try {
      const token = await this.getAccessToken();
      const url = `${this._apiBase}${endpoint}`;
      
      const requestOptions = {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };
      
      const response = await fetch(`${this._corsProxy}${encodeURIComponent(url)}`, requestOptions);
      
      if (!response.ok) {
        throw new Error(`Tidal API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error in Tidal API request to ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Get trending tracks from Tidal
   * @param {number} limit - Maximum number of tracks to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingTracks: async (limit = 20) => {
    try {
      const data = await tidalService.apiRequest('/tracks/top', {
        params: { limit, countryCode: 'US' }
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      throw error;
    }
  },
  
  /**
   * Get featured playlists from Tidal
   * @param {number} limit - Maximum number of playlists to return
   * @returns {Promise} - Promise containing playlist data
   */
  getFeaturedPlaylists: async (limit = 20) => {
    try {
      const data = await tidalService.apiRequest('/playlists/featured', {
        params: { limit, countryCode: 'US' }
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching featured playlists:', error);
      throw error;
    }
  },
  
  /**
   * Get trending albums from Tidal
   * @param {number} limit - Maximum number of albums to return
   * @returns {Promise} - Promise containing album data
   */
  getTrendingAlbums: async (limit = 20) => {
    try {
      const data = await tidalService.apiRequest('/albums/new', {
        params: { limit, countryCode: 'US' }
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching trending albums:', error);
      throw error;
    }
  },
  
  /**
   * Get trending artists from Tidal
   * @param {number} limit - Maximum number of artists to return
   * @returns {Promise} - Promise containing artist data
   */
  getTrendingArtists: async (limit = 10) => {
    try {
      const data = await tidalService.apiRequest('/artists/top', {
        params: { limit, countryCode: 'US' }
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching trending artists:', error);
      throw error;
    }
  },
  
  /**
   * Get track details by ID
   * @param {number} trackId - Tidal track ID
   * @returns {Promise} - Promise containing track data
   */
  getTrack: async (trackId) => {
    try {
      return await tidalService.apiRequest(`/tracks/${trackId}`);
    } catch (error) {
      console.error('Error fetching track details:', error);
      throw error;
    }
  },
  
  /**
   * Get artist details by ID
   * @param {number} artistId - Tidal artist ID
   * @returns {Promise} - Promise containing artist data
   */
  getArtist: async (artistId) => {
    try {
      return await tidalService.apiRequest(`/artists/${artistId}`);
    } catch (error) {
      console.error('Error fetching artist details:', error);
      throw error;
    }
  },
  
  /**
   * Search Tidal for tracks, albums, artists
   * @param {string} query - Search query
   * @param {string} type - Type of search: track, album, artist, playlist
   * @param {number} limit - Maximum results to return
   * @returns {Promise} - Promise containing search results
   */
  search: async (query, type = 'track', limit = 20) => {
    try {
      const data = await tidalService.apiRequest('/search', {
        params: {
          query: encodeURIComponent(query),
          type,
          limit,
          countryCode: 'US'
        }
      });
      
      return data;
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      throw error;
    }
  },
  
  /**
   * Get album details by ID
   * @param {number} albumId - Tidal album ID
   * @returns {Promise} - Promise containing album data
   */
  getAlbum: async (albumId) => {
    try {
      return await tidalService.apiRequest(`/albums/${albumId}`);
    } catch (error) {
      console.error('Error fetching album details:', error);
      throw error;
    }
  },
  
  /**
   * Get playlist details by ID
   * @param {number} playlistId - Tidal playlist ID
   * @returns {Promise} - Promise containing playlist data
   */
  getPlaylist: async (playlistId) => {
    try {
      return await tidalService.apiRequest(`/playlists/${playlistId}`);
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      throw error;
    }
  },
  
  /**
   * Get music genres from Tidal
   * @returns {Promise} - Promise containing genres data
   */
  getGenres: async () => {
    try {
      return await tidalService.apiRequest('/genres');
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },
  
  /**
   * Get user's favorites
   * @param {string} type - Type of favorites (tracks, albums, artists, playlists)
   * @returns {Promise} - Promise containing favorites data
   */
  getFavorites: async (type = 'tracks') => {
    try {
      return await tidalService.apiRequest(`/favorites/${type}`);
    } catch (error) {
      console.error(`Error fetching favorite ${type}:`, error);
      throw error;
    }
  }
};