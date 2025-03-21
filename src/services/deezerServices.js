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

  getFeaturedPlaylists: async (limit = 20) => {
    try {
      // Use a public CORS proxy instead of our own backend
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/chart/0/playlists?limit=${limit}`;
      
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
  },

  /**
   * Get album details by ID
   * @param {number} albumId - Deezer album ID
   * @returns {Promise} - Promise containing album data
   */
  getAlbum: async (albumId) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/album/${albumId}`;
      
      const response = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching album details:', error);
      throw error;
    }
  },
  /**
   * Get playlist details by ID
   * @param {number} playlistId - Deezer playlist ID
   * @returns {Promise} - Promise containing playlist data
   */

  getPlaylist: async (playlistId) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/playlist/${playlistId}`;
      
      const response = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      throw error;
    }
  },

  /**
   * Get all music genres from Deezer
   * @returns {Promise} - Promise containing genres data
   */
  getGenres: async () => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      // The URL was malformed in previous attempts - fix it
      const deezerUrl = 'https://api.deezer.com/genre';
      
      console.log(`Fetching genres from: ${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      // Use regular fetch like your other working methods
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  /**
   * Get music categories from Deezer's editorial selections
   * @returns {Promise} - Promise containing editorial data (similar to genres)
   */
  getMusicCategories: async () => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = 'https://api.deezer.com/editorial';
      
      console.log(`Fetching music categories from: ${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching music categories:', error);
      throw error;
    }
  },
};