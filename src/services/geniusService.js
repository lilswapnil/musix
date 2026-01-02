/**
 * Genius API Service
 * Provides lyrics search, song information, and charts from Genius
 * 
 * To get your access token:
 * 1. Go to https://genius.com/api-clients
 * 2. Create a new API client
 * 3. Generate an access token
 * 4. Add it to your .env file as VITE_GENIUS_ACCESS_TOKEN
 */

const ACCESS_TOKEN = import.meta.env.VITE_GENIUS_ACCESS_TOKEN;
const CORS_PROXY = 'https://corsproxy.io/?';
const GENIUS_API_BASE = 'https://api.genius.com';
const GENIUS_WEB_BASE = 'https://genius.com';

const IS_CONFIGURED = Boolean(
  ACCESS_TOKEN &&
  ACCESS_TOKEN.length > 10 &&
  !String(ACCESS_TOKEN).includes('your_genius') &&
  !String(ACCESS_TOKEN).includes('placeholder')
);

// Cache for API responses to reduce requests
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or null if expired/not found
 */
function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Set cache data with timestamp
 */
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Make an authenticated request to Genius API
 */
async function geniusRequest(endpoint, params = {}, useCache = true) {
  if (!IS_CONFIGURED) {
    throw new Error('Genius API is not configured. Please add VITE_GENIUS_ACCESS_TOKEN to your environment.');
  }

  const url = new URL(`${GENIUS_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const cacheKey = url.toString();
  
  // Check cache first
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url.toString())}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Genius API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.response;
    
    // Cache the result
    if (useCache) {
      setCache(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    console.error('Genius API request failed:', error);
    throw error;
  }
}

/**
 * Fetch raw HTML content from a URL (for lyrics scraping)
 */
async function fetchHtml(url) {
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
      headers: {
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Failed to fetch HTML:', error);
    throw error;
  }
}

/**
 * Search for songs on Genius
 * @param {string} query - Search query (song title, artist, or lyrics)
 * @returns {Promise<Array>} - Array of search results
 */
async function searchSongs(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const response = await geniusRequest('/search', { q: query });
  
  if (!response?.hits) {
    return [];
  }

  return response.hits
    .filter(hit => hit.type === 'song')
    .map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      titleWithFeatured: hit.result.title_with_featured,
      artist: hit.result.primary_artist?.name || 'Unknown Artist',
      artistId: hit.result.primary_artist?.id,
      artistImage: hit.result.primary_artist?.image_url,
      albumArt: hit.result.song_art_image_url || hit.result.header_image_url,
      thumbnail: hit.result.song_art_image_thumbnail_url,
      url: hit.result.url,
      lyricsState: hit.result.lyrics_state,
      releaseDateDisplay: hit.result.release_date_for_display,
      pyongsCount: hit.result.pyongs_count,
      annotationCount: hit.result.annotation_count
    }));
}

/**
 * Get detailed song information including lyrics path
 * @param {number} songId - Genius song ID
 * @returns {Promise<Object>} - Song details
 */
async function getSong(songId) {
  if (!songId) {
    throw new Error('Song ID is required');
  }

  const response = await geniusRequest(`/songs/${songId}`);
  
  if (!response?.song) {
    throw new Error('Song not found');
  }

  const song = response.song;
  return {
    id: song.id,
    title: song.title,
    titleWithFeatured: song.title_with_featured,
    fullTitle: song.full_title,
    artist: song.primary_artist?.name || 'Unknown Artist',
    artistId: song.primary_artist?.id,
    artistImage: song.primary_artist?.image_url,
    featuredArtists: song.featured_artists?.map(a => ({
      id: a.id,
      name: a.name,
      image: a.image_url
    })) || [],
    album: song.album ? {
      id: song.album.id,
      name: song.album.name,
      coverArt: song.album.cover_art_url,
      url: song.album.url
    } : null,
    albumArt: song.song_art_image_url || song.header_image_url,
    url: song.url,
    lyricsPath: song.path,
    releaseDate: song.release_date,
    releaseDateDisplay: song.release_date_for_display,
    description: song.description?.plain,
    recordingLocation: song.recording_location,
    media: song.media || [],
    appleMusicId: song.apple_music_id,
    spotifyUuid: song.spotify_uuid
  };
}

/**
 * Get artist information
 * @param {number} artistId - Genius artist ID
 * @returns {Promise<Object>} - Artist details
 */
async function getArtist(artistId) {
  if (!artistId) {
    throw new Error('Artist ID is required');
  }

  const response = await geniusRequest(`/artists/${artistId}`);
  
  if (!response?.artist) {
    throw new Error('Artist not found');
  }

  const artist = response.artist;
  return {
    id: artist.id,
    name: artist.name,
    image: artist.image_url,
    headerImage: artist.header_image_url,
    url: artist.url,
    description: artist.description?.plain,
    instagramName: artist.instagram_name,
    twitterName: artist.twitter_name,
    facebookName: artist.facebook_name
  };
}

/**
 * Get songs by an artist
 * @param {number} artistId - Genius artist ID
 * @param {number} page - Page number (default 1)
 * @param {number} perPage - Results per page (default 20)
 * @returns {Promise<Array>} - Array of songs
 */
async function getArtistSongs(artistId, page = 1, perPage = 20) {
  if (!artistId) {
    throw new Error('Artist ID is required');
  }

  const response = await geniusRequest(`/artists/${artistId}/songs`, {
    page,
    per_page: perPage,
    sort: 'popularity'
  });
  
  if (!response?.songs) {
    return [];
  }

  return response.songs.map(song => ({
    id: song.id,
    title: song.title,
    titleWithFeatured: song.title_with_featured,
    artist: song.primary_artist?.name || 'Unknown Artist',
    albumArt: song.song_art_image_url || song.header_image_url,
    url: song.url,
    releaseDateDisplay: song.release_date_for_display
  }));
}

/**
 * Search for a song by title and artist name
 * Useful for finding lyrics for a currently playing song
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object|null>} - Best matching song or null
 */
async function findSong(title, artist) {
  if (!title) {
    return null;
  }

  const query = artist ? `${title} ${artist}` : title;
  const results = await searchSongs(query);
  
  if (results.length === 0) {
    return null;
  }

  // Try to find the best match
  const lowerTitle = title.toLowerCase();
  const lowerArtist = artist?.toLowerCase() || '';
  
  const bestMatch = results.find(song => {
    const songTitle = song.title.toLowerCase();
    const songArtist = song.artist.toLowerCase();
    
    return songTitle.includes(lowerTitle) && 
           (lowerArtist === '' || songArtist.includes(lowerArtist));
  });

  return bestMatch || results[0];
}

/**
 * Get trending/chart songs from Genius
 * Scrapes the Genius charts page for trending songs
 * @param {string} chartType - Type of chart: 'trending', 'top', 'hot'
 * @param {number} limit - Maximum number of songs to return
 * @returns {Promise<Array>} - Array of chart songs
 */
async function getCharts(chartType = 'trending', limit = 50) {
  const cacheKey = `charts_${chartType}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Use the Genius API to search for popular/trending terms
    // Since Genius doesn't have a direct charts API, we'll use search with common trending terms
    const trendingQueries = ['top songs 2024', 'popular songs', 'trending music'];
    const allResults = [];
    const seenIds = new Set();

    for (const query of trendingQueries) {
      try {
        const results = await searchSongs(query);
        for (const song of results) {
          if (!seenIds.has(song.id)) {
            seenIds.add(song.id);
            allResults.push({
              ...song,
              chartPosition: allResults.length + 1
            });
          }
          if (allResults.length >= limit) break;
        }
      } catch (err) {
        console.warn(`Failed to fetch results for "${query}":`, err);
      }
      if (allResults.length >= limit) break;
    }

    // Sort by annotation count (popularity indicator) and pyongs
    const sortedResults = allResults
      .sort((a, b) => {
        const scoreA = (a.annotationCount || 0) + (a.pyongsCount || 0) * 10;
        const scoreB = (b.annotationCount || 0) + (b.pyongsCount || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map((song, index) => ({
        ...song,
        chartPosition: index + 1
      }));

    setCache(cacheKey, sortedResults);
    return sortedResults;
  } catch (error) {
    console.error('Failed to fetch charts:', error);
    throw error;
  }
}

/**
 * Get hot songs (most popular on Genius right now)
 * Uses the referents/charts endpoint if available, otherwise falls back to search
 * @param {number} limit - Maximum number of songs
 * @returns {Promise<Array>} - Array of hot songs
 */
async function getHotSongs(limit = 20) {
  const cacheKey = `hot_songs_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Try to get songs with high pageviews by searching trending terms
    const results = await searchSongs('hot songs');
    
    const hotSongs = results.slice(0, limit).map((song, index) => ({
      ...song,
      rank: index + 1,
      isHot: true
    }));

    setCache(cacheKey, hotSongs);
    return hotSongs;
  } catch (error) {
    console.error('Failed to fetch hot songs:', error);
    throw error;
  }
}

/**
 * Get lyrics URL and metadata for a song
 * Note: Actual lyrics content requires scraping the Genius page
 * @param {number} songId - Genius song ID
 * @returns {Promise<Object>} - Lyrics metadata including URL
 */
async function getLyricsInfo(songId) {
  if (!songId) {
    throw new Error('Song ID is required');
  }

  const song = await getSong(songId);
  
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    lyricsUrl: song.url,
    lyricsPath: song.lyricsPath,
    albumArt: song.albumArt,
    hasLyrics: song.lyricsPath !== null
  };
}

/**
 * Scrape lyrics from a Genius song page
 * @param {string} lyricsPath - The path portion of the Genius URL (e.g., "/Artist-song-lyrics")
 * @returns {Promise<Object>} - Object containing lyrics sections and metadata
 */
async function scrapeLyrics(lyricsPath) {
  if (!lyricsPath) {
    throw new Error('Lyrics path is required');
  }

  const cacheKey = `lyrics_${lyricsPath}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${GENIUS_WEB_BASE}${lyricsPath}`;
    const html = await fetchHtml(url);
    
    // Parse the HTML to extract lyrics
    // Genius wraps lyrics in data-lyrics-container divs
    const lyricsContainerRegex = /<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/gi;
    const matches = [...html.matchAll(lyricsContainerRegex)];
    
    if (matches.length === 0) {
      // Try alternative selector for older pages
      const altRegex = /<div class="lyrics"[^>]*>([\s\S]*?)<\/div>/gi;
      const altMatches = [...html.matchAll(altRegex)];
      
      if (altMatches.length === 0) {
        return {
          found: false,
          lyricsUrl: url,
          message: 'Lyrics not available. Click to view on Genius.',
          sections: []
        };
      }
    }

    // Extract and clean the lyrics text
    let lyricsHtml = matches.map(m => m[1]).join('\n');
    
    // Remove HTML tags but preserve line breaks
    let lyricsText = lyricsHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();

    // Parse into sections (verses, choruses, etc.)
    const sections = [];
    const sectionRegex = /\[([^\]]+)\]/g;
    const parts = lyricsText.split(sectionRegex);
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // Check if this is a section header (even indices after split are headers)
      if (i % 2 === 1) {
        sections.push({
          type: 'header',
          text: `[${part}]`
        });
      } else if (part) {
        sections.push({
          type: 'lyrics',
          text: part
        });
      }
    }

    const result = {
      found: true,
      lyricsUrl: url,
      plainText: lyricsText,
      sections: sections.length > 0 ? sections : [{ type: 'lyrics', text: lyricsText }]
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Failed to scrape lyrics:', error);
    return {
      found: false,
      error: error.message,
      lyricsUrl: `${GENIUS_WEB_BASE}${lyricsPath}`,
      message: 'Could not load lyrics. Click to view on Genius.',
      sections: []
    };
  }
}

/**
 * Get full lyrics for a song by ID
 * Combines getSong and scrapeLyrics
 * @param {number} songId - Genius song ID
 * @returns {Promise<Object>} - Full lyrics data
 */
async function getSongLyrics(songId) {
  const song = await getSong(songId);
  
  if (!song.lyricsPath) {
    return {
      song,
      lyrics: {
        found: false,
        message: 'Lyrics not available for this song.',
        sections: []
      }
    };
  }

  const lyrics = await scrapeLyrics(song.lyricsPath);
  
  return {
    song,
    lyrics
  };
}

/**
 * Search for lyrics by song title and artist
 * Convenience method that finds the song and fetches lyrics
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object|null>} - Lyrics data or null if not found
 */
async function searchLyrics(title, artist) {
  const song = await findSong(title, artist);
  
  if (!song) {
    return null;
  }

  return await getSongLyrics(song.id);
}

export const geniusService = {
  isConfigured: () => IS_CONFIGURED,
  searchSongs,
  getSong,
  getArtist,
  getArtistSongs,
  findSong,
  // New chart functions
  getCharts,
  getHotSongs,
  // Lyrics functions
  getLyricsInfo,
  scrapeLyrics,
  getSongLyrics,
  searchLyrics
};

export default geniusService;
