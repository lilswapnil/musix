import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { spotifyService } from "../../../services/spotifyServices";
import { deezerService } from "../../../services/deezerServices";
import SearchHeader from "../components/search/SearchHeader";
import SearchError from "../components/search/SearchError";
import SearchLoading from "../components/search/SearchLoading";
import SearchSongsSection from "../components/search/SearchSongsSection";
import SearchAlbumsSection from "../components/search/SearchAlbumsSection";
import SearchArtistsSection from "../components/search/SearchArtistsSection";
import SearchEmptyState from "../components/search/SearchEmptyState";
// Removed unused debounce import

export default function SearchPage() {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState('deezer');
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  // local searchInput state removed (unused)
  // const [searchInput, setSearchInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("query") || "";
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchWithRetry = useCallback(async (fetchFunc, maxRetries = 3, delay = 6000) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await fetchFunc();
      } catch (err) {
        if ((err.message && err.message.includes('Rate limit exceeded') || 
             err.status === 429) && 
            retries < maxRetries - 1) {
          // Get retry delay from error if available, or use default
          const retryDelay = (err.retryAfter ? err.retryAfter * 1000 : delay);
          console.log(`Rate limited, retrying in ${retryDelay / 1000}s... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retries++;
        } else {
          throw err;
        }
      }
    }
  }, []);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError("");

    try {
      let deezerResults = null;
      let spotifyResults = null;
      let preferSpotify = false;

      // Try Deezer first as primary source
      try {
        deezerResults = await fetchWithRetry(
          () => deezerService.searchAll(searchQuery)
        );

        if (deezerResults) {
          setSource('deezer');

          // Process Deezer tracks
          let deezerTracks = [];
          if (deezerResults.tracks && deezerResults.tracks.data) {
            deezerTracks = deezerResults.tracks.data.map(track => ({
              id: track.id,
              name: track.title,
              artist: track.artist.name,
              album: track.album.title,
              albumArt: track.album.cover_medium || track.album.cover_small,
              previewUrl: track.preview,
              externalUrl: track.link,
              popularity: track.rank || 0,
              source: 'deezer'
            }));
          }

          // Process Deezer albums
          let deezerAlbums = [];
          if (deezerResults.albums && deezerResults.albums.data) {
            deezerAlbums = deezerResults.albums.data.map(album => ({
              id: album.id,
              name: album.title || album.name,
              artist: album.artist?.name || "Unknown Artist",
              coverArt: album.cover_big || album.cover_medium || album.cover || "https://via.placeholder.com/300x300?text=No+Cover",
              releaseDate: album.release_date,
              trackCount: album.nb_tracks,
              link: album.link || `https://www.deezer.com/album/${album.id}`,
              source: 'deezer'
            }));
          }

          // Process Deezer artists
          let deezerArtists = [];
          if (deezerResults.artists && deezerResults.artists.data) {
            deezerArtists = deezerResults.artists.data.map(artist => ({
              id: artist.id,
              name: artist.name,
              picture: artist.picture_medium || artist.picture_big || artist.picture,
              nb_fan: artist.nb_fan || 0,
              source: 'deezer'
            }));
          }

          setSongs(deezerTracks.sort((a, b) => b.popularity - a.popularity));
          setAlbums(deezerAlbums);
          setArtists(deezerArtists);
        }
      } catch (deezerErr) {
        console.warn('Failed to search with Deezer API:', deezerErr);
        preferSpotify = true;
      }

      // Fallback to Spotify if Deezer fails or no results
      if (preferSpotify || (!deezerResults || (!deezerResults.tracks && !deezerResults.albums && !deezerResults.artists))) {
        try {
          spotifyResults = await spotifyService.search(searchQuery, 'album,artist,track', 50);

          if (spotifyResults) {
              setSource('spotify');

              // Process Spotify tracks
              let spotifyTracks = [];
              if (spotifyResults.tracks && spotifyResults.tracks.items) {
                spotifyTracks = spotifyResults.tracks.items.map(track => ({
                  id: track.id,
                  name: track.name,
                  artist: track.artists[0]?.name || "Unknown Artist",
                  album: track.album?.name || "Unknown Album",
                  albumArt: track.album?.images[1]?.url || track.album?.images[0]?.url || "https://via.placeholder.com/300x300?text=No+Cover",
                  previewUrl: track.preview_url,
                  externalUrl: track.external_urls?.spotify,
                  popularity: track.popularity || 0,
                  source: 'spotify'
                }));
              }

              // Process Spotify albums
              let spotifyAlbums = [];
              if (spotifyResults.albums && spotifyResults.albums.items) {
                spotifyAlbums = spotifyResults.albums.items.map(album => ({
                  id: album.id,
                  name: album.name,
                  artist: album.artists[0]?.name || "Unknown Artist",
                  coverArt: album.images[0]?.url || album.images[1]?.url || "https://via.placeholder.com/300x300?text=No+Cover",
                  releaseDate: album.release_date,
                  trackCount: album.total_tracks || 0,
                  link: album.external_urls?.spotify,
                  source: 'spotify'
                }));
              }

              // Process Spotify artists
              let spotifyArtists = [];
              if (spotifyResults.artists && spotifyResults.artists.items) {
                spotifyArtists = spotifyResults.artists.items.map(artist => ({
                  id: artist.id,
                  name: artist.name,
                  picture: artist.images[1]?.url || artist.images[0]?.url,
                  nb_fan: artist.followers?.total || 0,
                  source: 'spotify'
                }));
              }

              setSongs(spotifyTracks.sort((a, b) => b.popularity - a.popularity));
              setAlbums(spotifyAlbums);
              setArtists(spotifyArtists);
          }
        } catch (spotifyErr) {
          console.warn('Failed to search with Spotify API:', spotifyErr);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Search error:", err);
        setError(err.message === 'Rate limited' 
          ? "Searching too quickly. Please wait a moment." 
          : (err.message || "Something went wrong with the search."));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry]);

  // Load liked songs and trigger search when query changes
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch {
      // Ignore
    }

    if (query) {
      search(query);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [query, search]);

  const handlePlayPause = (songId, previewUrl, event) => {
    if (event) {
      event.stopPropagation();
    }

    if (currentlyPlaying === songId) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => setCurrentlyPlaying(null));
      audioRef.current = audio;
      audio.play().catch(err => console.error("Error playing audio:", err));
      setCurrentlyPlaying(songId);
    }
  };

  const handleLike = (songId, event) => {
    if (event) {
      event.stopPropagation();
    }

    setLikedSongs(prev => {
      const newLikes = {
        ...prev,
        [songId]: !prev[songId]
      };

      localStorage.setItem('likedSongs', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  const groupedSongs = songs.reduce((groups, song) => {
    let groupName;

    if (song.popularity > 500000) {
      groupName = 'Top Results';
    } else {
      groupName = 'Songs';
    }

    if (!groups[groupName]) {
      groups[groupName] = [];
    }

    groups[groupName].push(song);
    return groups;
  }, {});

  const hasResults = songs.length > 0 || albums.length > 0 || artists.length > 0;

  return (
    <div className="my-4">
      <SearchHeader query={query} hasResults={hasResults} source={source} />
      <SearchError error={error} />

      {loading ? (
        <SearchLoading />
      ) : (
        <>
          {songs.length > 0 && (
            <SearchSongsSection
              groupedSongs={groupedSongs}
              currentlyPlaying={currentlyPlaying}
              likedSongs={likedSongs}
              onPlayPause={handlePlayPause}
              onLike={handleLike}
              onSongClick={(songId) => navigate(`/song/${songId}`)}
            />
          )}

          <SearchAlbumsSection
            albums={albums}
            onAlbumClick={(albumId) => navigate(`/album/${albumId}`)}
          />

          <SearchArtistsSection
            artists={artists}
            onArtistClick={(artistId) => navigate(`/artist/${artistId}`)}
            formatFanCount={formatFanCount}
          />

          <SearchEmptyState query={query} hasResults={hasResults} />
        </>
      )}
    </div>
  );
}

// Removed unused formatPopularity

function formatFanCount(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}
