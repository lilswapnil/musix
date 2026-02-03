import { cachedFetch, throttle } from '../utils/requestUtils';
import { createApiClient, normalizeApiError } from './apiClient';

/**
 * Deezer API Services
 * Provides methods to interact with the Deezer API through our CORS proxy
 */
export const deezerService = {
  _apiClient: createApiClient(),
  // CORS proxy fallbacks (ordered)
  _corsProxies: [
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/'
  ],

  // Throttle configurations
  _throttle: {
    search: throttle(2000)('deezer-search'),
    chart: throttle(5000)('deezer-chart')
  },

  _buildProxyUrl: (proxyBase, targetUrl) => {
    const needsEncoding = proxyBase.includes('?');
    return `${proxyBase}${needsEncoding ? encodeURIComponent(targetUrl) : targetUrl}`;
  },

  _fetchWithProxy: async (deezerUrl, options = {}, controls = {}) => {
    let lastError;
    if (import.meta.env.PROD) {
      try {
        const proxyUrl = `/api/deezer?url=${encodeURIComponent(deezerUrl)}`;
        return await deezerService._apiClient.request(proxyUrl, options, {
          enhancedControls: {
          domain: 'musix-deezer-proxy',
          rateLimit: 200,
          timeWindow: 60000,
          cacheTime: 300000,
          retries: 0,
            ...controls
          }
        });
      } catch (error) {
        lastError = error;
      }
    }
    for (const proxyBase of deezerService._corsProxies) {
      const fullUrl = deezerService._buildProxyUrl(proxyBase, deezerUrl);
      try {
        return await deezerService._apiClient.request(fullUrl, options, {
          enhancedControls: {
            domain: 'api.deezer.com',
            rateLimit: 50,
            timeWindow: 60000,
            cacheTime: 300000,
            retries: 0,
            ...controls
          }
        });
      } catch (error) {
        const message = String(error?.message || '');
        const isTimeout = error?.status === 408 || message.includes('408') || message.toLowerCase().includes('timeout');
        if (isTimeout) {
          lastError = error;
          continue;
        }
        lastError = error;
      }
    }
    if (lastError) {
      throw normalizeApiError(lastError, 'deezer:proxy');
    }
    throw normalizeApiError(new Error('All Deezer CORS proxies failed'), 'deezer:proxy');
  },
  
  /**
   * Get trending tracks from Deezer's chart endpoint with throttling
   * @param {number} limit - Maximum number of tracks to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingTracks: async (limit = 20) => {
    try {
      const deezerUrl = `https://api.deezer.com/chart/0/tracks?limit=${limit}`;
      
      // Apply chart-specific throttling
      const throttledRequest = deezerService._throttle.chart(() => 
        deezerService._fetchWithProxy(deezerUrl, {}, {
          cacheTime: 300000 // 5 minutes cache
        })
      );
      
      return await throttledRequest();
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:chart/tracks');
      console.error('Error fetching trending tracks:', normalized);
      throw normalized;
    }
  },

  getFeaturedPlaylists: async (limit = 20) => {
    try {
      const deezerUrl = `https://api.deezer.com/chart/0/playlists?limit=${limit}`;
      return await deezerService._fetchWithProxy(deezerUrl, {}, {
        cacheTime: 300000
      });
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:chart/playlists');
      console.error('Error fetching featured playlists:', normalized);
      throw normalized;
    }
  },
  
  /**
   * Get trending albums from Deezer's chart endpoint
   * @param {number} limit - Maximum number of albums to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingAlbums: async (limit = 20) => {
    try {
      const deezerUrl = `https://api.deezer.com/chart/0/albums?limit=${limit}`;
      return await deezerService._fetchWithProxy(deezerUrl, {}, {
        cacheTime: 300000
      });
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:chart/albums');
      console.error('Error fetching trending albums:', normalized);
      throw normalized;
    }
  },

  /**
   * Get new releases from Deezer editorial endpoint
   * @param {number} limit - Maximum number of albums to return
   * @returns {Promise} - Promise containing release data
   */
  getNewReleases: async (limit = 20) => {
    try {
      const deezerUrl = `https://api.deezer.com/editorial/0/releases?limit=${limit}`;
      return await deezerService._fetchWithProxy(deezerUrl, {}, {
        cacheTime: 300000
      });
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:editorial/releases');
      console.error('Error fetching new releases:', normalized);
      throw normalized;
    }
  },
  
  /**
   * Get trending artists from Deezer's chart endpoint
   * @param {number} limit - Maximum number of artists to return
   * @returns {Promise} - Promise containing chart data
   */
  getTrendingArtists: async (limit = 10) => {
    try {
      const deezerUrl = `https://api.deezer.com/chart/0/artists?limit=${limit}`;
      return await deezerService._fetchWithProxy(deezerUrl, {}, {
        cacheTime: 300000
      });
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:chart/artists');
      console.error('Error fetching trending artists:', normalized);
      throw normalized;
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
      
      // cachedFetch returns data directly, not a response object
      const data = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      // Check if data contains an error from Deezer API
      if (data && data.error) {
        throw new Error(`Deezer API error: ${data.error.message || data.error.code}`);
      }
      
      return data;
    } catch (error) {
      const normalized = normalizeApiError(error, `deezer:track/${trackId}`);
      console.error('Error fetching track details:', normalized);
      throw normalized;
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
      const normalized = normalizeApiError(error, `deezer:artist/${artistId}`);
      console.error(`Error fetching artist ${artistId}:`, normalized);
      throw normalized;
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
      const normalized = normalizeApiError(error, `deezer:artist/${artistId}/top`);
      console.error(`Error fetching top tracks for artist ${artistId}:`, normalized);
      throw normalized;
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
      const normalized = normalizeApiError(error, `deezer:artist/${artistId}/albums`);
      console.error(`Error fetching albums for artist ${artistId}:`, normalized);
      throw normalized;
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
      const normalized = normalizeApiError(error, `deezer:search/${type}`);
      console.error(`Error searching ${type}:`, normalized);
      throw normalized;
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
      
      // cachedFetch returns data directly, not a response object
      const data = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      // Check if data contains an error from Deezer API
      if (data && data.error) {
        throw new Error(`Deezer API error: ${data.error.message || data.error.code}`);
      }
      
      return data;
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:search/track');
      console.error('Error searching tracks:', normalized);
      throw normalized;
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
      const normalized = normalizeApiError(error, `deezer:album/${albumId}`);
      console.error(`Error fetching album ${albumId}:`, normalized);
      throw normalized;
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
      
      // cachedFetch returns data directly, not a response object
      const data = await cachedFetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      // Check if data contains an error from Deezer API
      if (data && data.error) {
        throw new Error(`Deezer API error: ${data.error.message || data.error.code}`);
      }
      
      return data;
    } catch (error) {
      const normalized = normalizeApiError(error, `deezer:playlist/${playlistId}`);
      console.error('Error fetching playlist details:', normalized);
      throw normalized;
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
      
      // Use regular fetch like your other working methods
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:genre');
      console.error('Error fetching genres:', normalized);
      throw normalized;
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
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:editorial');
      console.error('Error fetching music categories:', normalized);
      throw normalized;
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
            // Include artist info with the album since Deezer's album object doesn't have it
            albumsMap.set(track.album.id, {
              ...track.album,
              artist: track.artist  // Add artist from the track
            });
          }
          
          if (track.artist && !artistsMap.has(track.artist.id)) {
            artistsMap.set(track.artist.id, track.artist);
          }
        });
      }
      
      const albums = { data: Array.from(albumsMap.values()) };
      
      // Process artist data from map into the results array
      const artists = { data: Array.from(artistsMap.values()) };
      
      // Compile search results from all data types
      const result = {
        tracks,
        albums,
        artists
      };
      
      /**
       * Memory cache implementation
       * Prevents repeated API calls for the same search query
       * More efficient than sessionStorage for large response data
       */
      try {
        // Store with timestamp for cache invalidation
        deezerService._memoryCache.set(cacheKey, {
          data: result,
          timestamp: now
        });
        
        // Prevent memory leaks by limiting cache size
        if (deezerService._memoryCache.size > 20) {
          const oldestKey = [...deezerService._memoryCache.keys()][0];
          deezerService._memoryCache.delete(oldestKey);
        }
      } catch (cacheErr) {
        console.warn('Could not cache search results:', cacheErr);
        // Non-critical error - continue execution
      }
      
      return result;
    } catch (error) {
      const normalized = normalizeApiError(error, 'deezer:search/all');
      console.error(`Error searching all types:`, normalized);
      throw normalized;
    }
  },

  getArtistTracks: async (artistId, page = 1, limit = 100, signal = null) => {
    try {
      if (!artistId) {
        throw new Error("Invalid artistId: artistId is required");
      }
      
      // Check the throttle to avoid rate limiting
      deezerService._throttle.search.check();
      
      // Use the artist/top endpoint to get actual artist tracks 
      // instead of radio (similar songs)
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/artist/${artistId}/top?limit=${limit}&index=${(page-1)*limit}`;
      const fullUrl = `${corsProxy}${encodeURIComponent(deezerUrl)}`;
      
      // Cache key based on artist ID, page and limit
      const cacheKey = `artist_tracks_${artistId}_${page}_${limit}`;
      
      // Check cache first
      if (deezerService._memoryCache) {
        const cachedItem = deezerService._memoryCache.get(cacheKey);
        
        if (cachedItem && Date.now() - cachedItem.timestamp < 3600000) { // 1 hour cache
          return cachedItem.data;
        }
      }
      
      const options = signal ? { signal } : {};
      const response = await fetch(fullUrl, options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (deezerService._memoryCache) {
        deezerService._memoryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      const normalized = normalizeApiError(error, `deezer:artist/${artistId}/top`);
      console.error(`Error fetching artist tracks:`, normalized);
      throw normalized;
    }
  },
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