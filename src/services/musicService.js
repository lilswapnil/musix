import { spotifyService } from './spotifyServices';
import { deezerService } from './deezerServices';
// import { getAccessToken } from '../utils/tokenStorage';

/**
 * Unified Music Service - Routes to Spotify when authenticated, falls back to Deezer
 */
export const musicService = {
  /**
   * Determines which service to use based on authentication status
   * @returns {Object} The service to use (spotify or deezer)
   */
  getPreferredService: () => {
    // Check if user is authenticated with Spotify
    if (spotifyService.isLoggedIn()) {
      console.log('Using Spotify API (authenticated)');
      return spotifyService;
    }
    
    // Fallback to Deezer
    console.log('Using Deezer API (fallback)');
    return deezerService;
  },

  /**
   * Get artist details by ID
   * @param {string} artistId - Artist ID
   * @param {AbortSignal} signal - Optional AbortSignal for cancellation
   */
  getArtist: async (artistId, signal = null) => {
    if (spotifyService.isLoggedIn()) {
      try {
        const spotifyArtist = await spotifyService.getArtist(artistId);
        // Transform Spotify artist format to common format
        return {
          id: spotifyArtist.id,
          name: spotifyArtist.name,
          picture_xl: spotifyArtist.images?.[0]?.url,
          picture_big: spotifyArtist.images?.[1]?.url,
          picture_medium: spotifyArtist.images?.[2]?.url,
          picture: spotifyArtist.images?.[2]?.url || spotifyArtist.images?.[1]?.url,
          nb_fan: spotifyArtist.followers?.total || 0,
          nb_album: 0, // Spotify doesn't provide this directly
          link: spotifyArtist.external_urls?.spotify
        };
      } catch (error) {
        console.error('Spotify artist fetch failed, falling back to Deezer:', error);
        // Fall back to Deezer on error
        return await deezerService.getArtist(artistId, signal);
      }
    } else {
      // Use Deezer if not authenticated with Spotify
      return await deezerService.getArtist(artistId, signal);
    }
  },

  /**
   * Get artist's top tracks
   * @param {string} artistId - Artist ID
   * @param {number} limit - Number of tracks to fetch
   */
  getArtistTopTracks: async (artistId, limit = 10, signal = null) => {
    if (spotifyService.isLoggedIn()) {
      try {
        const spotifyTracks = await spotifyService.getArtistTopTracks(artistId);
        // Transform to common format
        return {
          data: spotifyTracks.tracks.map(track => ({
            id: track.id,
            title: track.name,
            duration: Math.round(track.duration_ms / 1000),
            preview: track.preview_url,
            link: track.external_urls?.spotify,
            artist: {
              id: track.artists[0]?.id,
              name: track.artists[0]?.name
            },
            album: {
              id: track.album?.id,
              title: track.album?.name,
              cover: track.album?.images[2]?.url,
              cover_small: track.album?.images[2]?.url,
              cover_medium: track.album?.images[1]?.url
            }
          }))
        };
      } catch (error) {
        console.error('Spotify tracks fetch failed, falling back to Deezer:', error);
        return await deezerService.getArtistTopTracks(artistId, limit, signal);
      }
    } else {
      return await deezerService.getArtistTopTracks(artistId, limit, signal);
    }
  },

  /**
   * Get artist's albums
   * @param {string} artistId - Artist ID
   * @param {number} limit - Number of albums to fetch
   */
  getArtistAlbums: async (artistId, limit = 50, signal = null) => {
    if (spotifyService.isLoggedIn()) {
      try {
        const spotifyAlbums = await spotifyService.apiRequest(`/artists/${artistId}/albums`, {
          params: { limit, include_groups: 'album,single', market: 'from_token' }
        });
        // Transform to common format
        return {
          data: spotifyAlbums.items.map(album => ({
            id: album.id,
            title: album.name,
            cover: album.images[2]?.url,
            cover_small: album.images[2]?.url,
            cover_medium: album.images[1]?.url,
            cover_big: album.images[0]?.url,
            release_date: album.release_date,
            nb_tracks: album.total_tracks,
            link: album.external_urls?.spotify,
            artist: {
              id: album.artists[0]?.id,
              name: album.artists[0]?.name
            }
          }))
        };
      } catch (error) {
        console.error('Spotify albums fetch failed, falling back to Deezer:', error);
        return await deezerService.getArtistAlbums(artistId, limit, signal);
      }
    } else {
      return await deezerService.getArtistAlbums(artistId, limit, signal);
    }
  },

  /**
   * Get album details by ID
   * @param {string} albumId - Album ID
   */
  getAlbum: async (albumId, signal = null) => {
    if (spotifyService.isLoggedIn()) {
      try {
        const spotifyAlbum = await spotifyService.getAlbum(albumId);
        // Transform to common format
        return {
          id: spotifyAlbum.id,
          title: spotifyAlbum.name,
          cover: spotifyAlbum.images[2]?.url,
          cover_small: spotifyAlbum.images[2]?.url,
          cover_medium: spotifyAlbum.images[1]?.url,
          cover_big: spotifyAlbum.images[0]?.url,
          cover_xl: spotifyAlbum.images[0]?.url,
          release_date: spotifyAlbum.release_date,
          nb_tracks: spotifyAlbum.total_tracks,
          link: spotifyAlbum.external_urls?.spotify,
          artist: {
            id: spotifyAlbum.artists[0]?.id,
            name: spotifyAlbum.artists[0]?.name
          },
          tracks: {
            data: spotifyAlbum.tracks.items.map((track, index) => ({
              id: track.id,
              title: track.name,
              duration: Math.round(track.duration_ms / 1000),
              preview: track.preview_url,
              link: track.external_urls?.spotify,
              track_position: index + 1,
              artist: {
                id: track.artists[0]?.id,
                name: track.artists[0]?.name
              }
            }))
          }
        };
      } catch (error) {
        console.error('Spotify album fetch failed, falling back to Deezer:', error);
        return await deezerService.getAlbum(albumId, signal);
      }
    } else {
      return await deezerService.getAlbum(albumId, signal);
    }
  },

  /**
   * Get artist's tracks (includes pagination)
   */
  getArtistTracks: async (artistId, page = 1, limit = 50, signal = null) => {
    if (spotifyService.isLoggedIn()) {
      try {
        // Spotify doesn't have a direct endpoint for all artist tracks
        // We'll use albums endpoint and then get tracks for each album
        const offset = (page - 1) * limit;
        const spotifyAlbums = await spotifyService.apiRequest(`/artists/${artistId}/albums`, {
          params: { 
            limit: 50, // Get many albums to ensure we have enough tracks
            include_groups: 'album,single',
            market: 'from_token'
          }
        });
        
        // Get tracks for each album (first few albums only to avoid rate limits)
        const trackPromises = spotifyAlbums.items.slice(0, 5).map(album => 
          spotifyService.apiRequest(`/albums/${album.id}/tracks`, {
            params: { limit: 50, market: 'from_token' }
          })
        );
        
        const albumsTracksResults = await Promise.all(trackPromises);
        
        // Combine all tracks and paginate
        const allTracks = albumsTracksResults.flatMap(result => result.items);
        const paginatedTracks = allTracks.slice(offset, offset + limit);
        
        return {
          data: paginatedTracks.map(track => ({
            id: track.id,
            title: track.name,
            duration: Math.round(track.duration_ms / 1000) || 0,
            preview: track.preview_url,
            link: track.external_urls?.spotify,
            artist: {
              id: track.artists[0]?.id,
              name: track.artists[0]?.name
            },
            album: {
              id: track.album?.id || "",
              title: track.album?.name || "Unknown Album",
              cover_medium: ""
            }
          })),
          next: paginatedTracks.length === limit
        };
      } catch (error) {
        console.error('Spotify artist tracks fetch failed, falling back to Deezer:', error);
        return await deezerService.getArtistTracks(artistId, page, limit, signal);
      }
    } else {
      return await deezerService.getArtistTracks(artistId, page, limit, signal);
    }
  },

  /**
   * Search across all content types
   */
  searchAll: async (query, signal = null) => {
    if (spotifyService.isLoggedIn()) {
      try {
        const results = await spotifyService.search(query, 'album,artist,track', 50);
        
        return {
          tracks: {
            data: (results.tracks?.items || []).map(track => ({
              id: track.id,
              title: track.name,
              duration: Math.round(track.duration_ms / 1000),
              preview: track.preview_url,
              link: track.external_urls?.spotify,
              rank: track.popularity || 0,
              artist: {
                id: track.artists[0]?.id,
                name: track.artists[0]?.name
              },
              album: {
                id: track.album?.id,
                title: track.album?.name,
                cover: track.album?.images[2]?.url,
                cover_small: track.album?.images[2]?.url,
                cover_medium: track.album?.images[1]?.url
              }
            }))
          },
          albums: {
            data: (results.albums?.items || []).map(album => ({
              id: album.id,
              title: album.name,
              cover: album.images[2]?.url,
              cover_small: album.images[2]?.url,
              cover_medium: album.images[1]?.url,
              cover_big: album.images[0]?.url,
              release_date: album.release_date,
              nb_tracks: album.total_tracks || 0,
              link: album.external_urls?.spotify,
              artist: {
                id: album.artists[0]?.id,
                name: album.artists[0]?.name
              }
            }))
          },
          artists: {
            data: (results.artists?.items || []).map(artist => ({
              id: artist.id,
              name: artist.name,
              picture: artist.images[1]?.url || artist.images[0]?.url,
              picture_medium: artist.images[1]?.url,
              picture_big: artist.images[0]?.url,
              nb_fan: artist.followers?.total || 0
            }))
          }
        };
      } catch (error) {
        console.error('Spotify search failed, falling back to Deezer:', error);
        return await deezerService.searchAll(query, signal);
      }
    } else {
      return await deezerService.searchAll(query, signal);
    }
  }
};