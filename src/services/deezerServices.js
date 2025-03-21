import { cachedFetch, enhancedApiRequest, throttle } from '../utils/requestUtils';

/**
 * Deezer API Services
 * Provides methods to interact with the Deezer API through our CORS proxy
 */
export const deezerService = {
  // Throttle configurations
  _throttle: {
    search: throttle(2000)('deezer-search'),
    chart: throttle(5000)('deezer-chart')
  },
  
  /**
   * Get trending tracks from Deezer's chart endpoint with throttling
   * @param {number} limit - Maximum number of tracks to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingTracks: async (limit = 20) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/chart/0/tracks?limit=${limit}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Apply chart-specific throttling
      const throttledRequest = deezerService._throttle.chart(() => 
        enhancedApiRequest(fullUrl, {}, {
          domain: 'api.deezer.com',
          rateLimit: 50,
          timeWindow: 60000,
          cacheTime: 300000 // 5 minutes cache
        })
      );
      
      return await throttledRequest();
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
  getArtist: async (artistId, signal = null) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/artist/${artistId}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Check cache first
      if (deezerService._memoryCache) {
        const cacheKey = `artist_${artistId}`;
        const cachedItem = deezerService._memoryCache.get(cacheKey);
        
        if (cachedItem && Date.now() - cachedItem.timestamp < 3600000) { // 1 hour cache
          return cachedItem.data;
        }
      }
      
      const options = signal ? { signal } : {};
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
    
      // Cache the result
      if (deezerService._memoryCache) {
        deezerService._memoryCache.set(`artist_${artistId}`, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching artist ${artistId}:`, error);
      throw error;
    }
  },

  getArtistTopTracks: async (artistId, limit = 10, signal = null) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/artist/${artistId}/top?limit=${limit}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Check cache first
      if (deezerService._memoryCache) {
        const cacheKey = `artist_top_${artistId}_${limit}`;
        const cachedItem = deezerService._memoryCache.get(cacheKey);
        
        if (cachedItem && Date.now() - cachedItem.timestamp < 3600000) { // 1 hour cache
          return cachedItem.data;
        }
      }
      
      const options = signal ? { signal } : {};
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (deezerService._memoryCache) {
        deezerService._memoryCache.set(`artist_top_${artistId}_${limit}`, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching top tracks for artist ${artistId}:`, error);
      throw error;
    }
  },

  getArtistAlbums: async (artistId, limit = 50, signal = null) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/artist/${artistId}/albums?limit=${limit}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Check cache first
      if (deezerService._memoryCache) {
        const cacheKey = `artist_albums_${artistId}_${limit}`;
        const cachedItem = deezerService._memoryCache.get(cacheKey);
        
        if (cachedItem && Date.now() - cachedItem.timestamp < 3600000) { // 1 hour cache
          return cachedItem.data;
        }
      }
      
      const options = signal ? { signal } : {};
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (deezerService._memoryCache) {
        deezerService._memoryCache.set(`artist_albums_${artistId}_${limit}`, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching albums for artist ${artistId}:`, error);
      throw error;
    }
  },
  
  /**
   * Search Deezer with debouncing and throttling
   * @param {string} query - Search query
   * @param {string} type - Type of search: track, album, artist
   * @param {number} limit - Maximum results to return
   * @returns {Promise} - Promise containing search results
   */
  search: async (query, type = 'track', limit = 20) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Apply search-specific throttling
      const throttledRequest = deezerService._throttle.search(() => 
        enhancedApiRequest(fullUrl, {}, {
          domain: 'api.deezer.com',
          rateLimit: 10,
          timeWindow: 10000,
          cacheTime: 60000 // 1 minute cache for searches
        })
      );
      
      return await throttledRequest();
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
  getAlbum: async (albumId, signal = null) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/album/${albumId}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Check cache first
      if (deezerService._memoryCache) {
        const cacheKey = `album_${albumId}`;
        const cachedItem = deezerService._memoryCache.get(cacheKey);
        
        if (cachedItem && Date.now() - cachedItem.timestamp < 3600000) { // 1 hour cache
          return cachedItem.data;
        }
      }
      
      const options = signal ? { signal } : {};
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (deezerService._memoryCache) {
        deezerService._memoryCache.set(`album_${albumId}`, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching album ${albumId}:`, error);
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

  // Update the searchAll method:
  searchAll: async (query, signal = null) => {
    try {
      const corsProxy = 'https://corsproxy.io/?';
      
      // Use in-memory cache instead of sessionStorage for large responses
      // This helps avoid storage quota errors
      if (!deezerService._memoryCache) {
        deezerService._memoryCache = new Map();
      }
      
      const cacheKey = `search_${query}`;
      const now = Date.now();
      const cachedItem = deezerService._memoryCache.get(cacheKey);
      
      // Check memory cache first (valid for 5 minutes)
      if (cachedItem && now - cachedItem.timestamp < 300000) {
        return cachedItem.data;
      }
      
      // Make the API request
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=100`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      const options = signal ? { signal } : {};
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract unique albums and artists from tracks
      const tracks = data;
      const albumsMap = new Map();
      const artistsMap = new Map();
      
      if (tracks.data) {
        tracks.data.forEach(track => {
          if (track.album && !albumsMap.has(track.album.id)) {
            albumsMap.set(track.album.id, track.album);
          }
          
          if (track.artist && !artistsMap.has(track.artist.id)) {
            artistsMap.set(track.artist.id, track.artist);
          }
        });
      }
      
      const albums = { data: Array.from(albumsMap.values()) };
      const artists = { data: Array.from(artistsMap.values()) };
      
      // Build complete response
      const result = {
        tracks,
        albums,
        artists
      };
      
      // Cache the results in memory instead of sessionStorage
      try {
        deezerService._memoryCache.set(cacheKey, {
          data: result,
          timestamp: now
        });
        
        // Limit cache size to prevent memory issues (keep last 20 searches)
        if (deezerService._memoryCache.size > 20) {
          const oldestKey = [...deezerService._memoryCache.keys()][0];
          deezerService._memoryCache.delete(oldestKey);
        }
      } catch (cacheErr) {
        console.warn('Could not cache search results:', cacheErr);
        // Continue even if caching fails - it's just a performance optimization
      }
      
      return result;
    } catch (error) {
      console.error(`Error searching all types:`, error);
      throw error;
    }
  }
};

/**
 * Create a debounced Deezer search function
 */
export function createDebouncedDeezerSearch(wait = 500) {
  let timeout;
  
  return function(query, type = 'track', limit = 20) {
    return new Promise((resolve, reject) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(async () => {
        try {
          const result = await deezerService.search(query, type, limit);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}