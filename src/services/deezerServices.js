import { cachedFetch } from '../utils/requestUtils';

/**
 * Deezer API Services
 * Provides methods to interact with the Deezer API through our CORS proxy
 */
export const deezerService = {
  /**
   * Get trending tracks from Deezer's chart endpoint
   * @param {number} limit - Maximum number of tracks to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingTracks: async (limit = 20) => {
    try {
      // Use a public CORS proxy instead of our own backend
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/chart/0/tracks?limit=${limit}`;
      
      console.log(`Fetching from: ${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      throw error;
    }
  },

  fetFeturedPlaylists: async (limit = 20) => {
    try {
      // Use a public CORS proxy instead of our own backend
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/chart/0/playlists?limit=${limit}`;
      
      console.log(`Fetching from: ${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching featured playlists:', error);
      throw error;
    }
  },
  
  /**
   * Get trending albums from Deezer's chart endpoint
   * @param {number} limit - Maximum number of albums to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingAlbums: async (limit = 20) => {
    try {
      // Use a public CORS proxy instead of our own backend
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/chart/0/albums?limit=${limit}`;
      
      console.log(`Fetching trending albums from: ${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending albums:', error);
      throw error;
    }
  },
  
  /**
   * Get trending artists from Deezer's chart endpoint
   * @param {number} limit - Maximum number of artists to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingArtists: async (limit = 10) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/chart/0/artists?limit=${limit}`;
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending artists:', error);
      throw error;
    }
  },
  
  /**
   * Get track details by ID
   * @param {number} trackId - Deezer track ID
   * @returns {Promise} - Promise containing track data
   */
  getTrack: async (trackId) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/track/${trackId}`;
      
      const response = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching track details:', error);
      throw error;
    }
  },
  
  /**
   * Get artist details by ID
   * @param {number} artistId - Deezer artist ID
   * @returns {Promise} - Promise containing artist data
   */
  getArtist: async (artistId) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/artist/${artistId}`;
      
      const response = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching artist details:', error);
      throw error;
    }
  },
  
  /**
   * Search Deezer for tracks, albums, artists
   * @param {string} query - Search query
   * @param {string} type - Type of search: track, album, artist
   * @param {number} limit - Maximum results to return
   * @returns {Promise} - Promise containing search results
   */
  search: async (query, type = 'track', limit = 20) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      throw error;
    }
  },
  
  /**
   * Search tracks by query
   * @param {string} query - Search term
   * @param {number} limit - Maximum number of results
   * @returns {Promise} - Promise containing search results
   */
  searchTracks: async (query, limit = 10) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }
};