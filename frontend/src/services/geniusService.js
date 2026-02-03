/**
 * Genius API Service
 * Provides lyrics search and song information from Genius
 * 
 * To get your access token:
 * 1. Go to https://genius.com/api-clients
 * 2. Create a new API client
 * 3. Generate an access token
 * 4. Add it to your .env file as VITE_GENIUS_ACCESS_TOKEN
 */

import { normalizeApiError } from './apiClient';

const ACCESS_TOKEN = import.meta.env.VITE_GENIUS_ACCESS_TOKEN;
const CORS_PROXY = 'https://corsproxy.io/?';
const GENIUS_API_BASE = 'https://api.genius.com';

const IS_CONFIGURED = Boolean(
  ACCESS_TOKEN &&
  ACCESS_TOKEN.length > 10 &&
  !String(ACCESS_TOKEN).includes('your_genius') &&
  !String(ACCESS_TOKEN).includes('placeholder')
);

/**
 * Make an authenticated request to Genius API
 */

async function geniusRequest(endpoint, params = {}) {
  if (!IS_CONFIGURED) {
    throw new Error('Genius API is not configured. Please add VITE_GENIUS_ACCESS_TOKEN to your environment.');
  }

  const url = new URL(`${GENIUS_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const requestUrl = `${CORS_PROXY}${encodeURIComponent(url.toString())}`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = new Error(`Genius API error: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Genius API request failed:', error);
    throw normalizeApiError(error, requestUrl);
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

export const geniusService = {
  isConfigured: () => IS_CONFIGURED,
  searchSongs,
  getSong,
  getArtist,
  getArtistSongs,
  findSong
};

export default geniusService;
