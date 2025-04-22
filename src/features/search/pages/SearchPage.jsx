import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { musicService } from "../../../services/musicService";
import axios from 'axios';
import { ensureValidToken } from '../../../utils/refreshToken';
import { deezerService } from "../../../services/deezerServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause, faSearch, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";
import ScrollableSection from "../../../components/common/ui/ScrollableSection";
import { debounce } from "../../../utils/requestUtils";

export default function SearchPage() {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState('deezer');
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("query") || "";
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }

    setSearchInput(query);

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
  }, [query]);

  const memoizedSearch = useCallback(search, []);

  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      if (searchQuery) {
        const searchParams = new URLSearchParams();
        searchParams.set("query", searchQuery);
        navigate({
          pathname: location.pathname,
          search: searchParams.toString()
        }, { replace: true });
      }

      memoizedSearch(searchQuery);
    }, 800),
    [navigate, location.pathname, memoizedSearch]
  );

  const fetchWithRetry = async (fetchFunc, maxRetries = 3, delay = 6000) => {
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
  };

  const handleSearchInput = (event) => {
    const newQuery = event.target.value;
    setSearchInput(newQuery);

    if (newQuery.trim().length > 1) {
      debouncedSearch(newQuery);
    } else if (newQuery.trim() === '') {
      setSongs([]);
      setAlbums([]);
      setArtists([]);

      navigate({
        pathname: location.pathname
      }, { replace: true });
    }
  };

  async function search(searchQuery) {
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
      console.log(`Searching for "${searchQuery}"...`);
      let deezerResults = null;
      let spotifyResults = null;
      let preferSpotify = false;

      // Try Deezer first as primary source
      try {
        console.log('Searching with Deezer API as primary source');
        deezerResults = await fetchWithRetry(
          () => deezerService.searchAll(searchQuery)
        );

        if (deezerResults) {
          console.log('Received search results from Deezer');
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
          const token = await ensureValidToken();

          if (token) {
            console.log('Valid Spotify token available, searching with Spotify API');
            spotifyResults = await axios.get('https://api.spotify.com/v1/search', {
              params: {
                q: searchQuery,
                type: 'album,artist,track',
                limit: 50,
                market: 'US'
              },
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (spotifyResults.data) {
              setSource('spotify');
              console.log('Received search results from Spotify');

              // Process Spotify tracks
              let spotifyTracks = [];
              if (spotifyResults.data.tracks && spotifyResults.data.tracks.items) {
                spotifyTracks = spotifyResults.data.tracks.items.map(track => ({
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
              if (spotifyResults.data.albums && spotifyResults.data.albums.items) {
                spotifyAlbums = spotifyResults.data.albums.items.map(album => ({
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
              if (spotifyResults.data.artists && spotifyResults.data.artists.items) {
                spotifyArtists = spotifyResults.data.artists.items.map(artist => ({
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
  }

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

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-start">
          {query ? `Search Results for "${query}"` : "Search for music"}
        </h2>
        {(songs.length > 0 || albums.length > 0 || artists.length > 0) && 
          <span className="text-xs text-muted">via {source === 'spotify' ? 'Spotify' : 'Deezer'}</span>
        }
      </div>

      {error && (
        <div className="bg-primary-light/50 p-4 mb-6 rounded-lg text-center">
          <p className="text-amber-500 mb-2">{error}</p>
          {error.includes("quickly") && (
            <p className="text-xs text-muted">Our API has rate limits to prevent overuse</p>
          )}
        </div>
      )}

      {loading && songs.length === 0 && albums.length === 0 ? (
        <LoadingSpinner message="Searching..." />
      ) : (
        <>
          {songs.length > 0 && Object.entries(groupedSongs).map(([groupName, groupSongs]) => (
            <div key={groupName} className="mb-8">
              <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">{groupName}</h3>}>
                <div className="flex space-x-2">
                  {Array.from({ length: Math.ceil(groupSongs.length / 4) }).map((_, groupIndex) => {
                    const groupTracks = groupSongs.slice(groupIndex * 4, groupIndex * 4 + 4);
                    return (
                      <div 
                        key={groupIndex} 
                        className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
                      >
                        {groupTracks.map((song) => (
                          <div 
                            key={song.id} 
                            className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:bg-primary-light transition-colors cursor-pointer"
                            onClick={() => navigate(`/song/${song.id}`)}
                          >
                            <div className="w-12 h-12 flex-shrink-0 relative group">
                              <img 
                                src={song.albumArt} 
                                alt={song.name}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                                }}
                              />
                              {song.previewUrl && (
                                <button
                                  onClick={(e) => handlePlayPause(song.id, song.previewUrl, e)}
                                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                >
                                  <FontAwesomeIcon 
                                    icon={currentlyPlaying === song.id ? faPause : faPlay} 
                                    className="text-white"
                                  />
                                </button>
                              )}
                            </div>
                            
                            <div className="ml-3 flex-grow min-w-0 text-start">
                              <div className="font-semibold text-white truncate">{song.name}</div>
                              <div className="flex justify-between">
                                <div className="text-xs text-muted truncate">{song.artist}</div>
                              </div>
                            </div>
                            
                            <button 
                              className="ml-2 p-2 rounded-full hover:bg-muted/20 transition-colors"
                              onClick={(e) => handleLike(song.id, e)}
                              aria-label={likedSongs[song.id] ? "Unlike" : "Like"}
                            >
                              <FontAwesomeIcon 
                                icon={faHeart} 
                                className={`${likedSongs[song.id] ? "text-red-500" : "text-muted"}`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </ScrollableSection>
            </div>
          ))}

          {albums.length > 0 && (
            <ScrollableSection title="Albums">
              <div className="flex space-x-2 pb-1">
                {albums.map((album) => (
                  <div 
                    key={album.id} 
                    className="flex-shrink-0 w-32 sm:w-40 md:w-[11rem] overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
                    onClick={() => navigate(`/album/${album.id}`)}
                  >
                    <div className="relative">
                      <img 
                        src={album.coverArt}
                        alt={album.name}
                        className="w-full h-32 sm:h-40 md:h-48 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon 
                            icon={faExternalLinkAlt} 
                            className="text-white text-sm sm:text-base md:text-xl"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 md:p-4">
                      <div className="text-center">
                        <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{album.name}</h3>
                        <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">{album.artist}</p>
                        {album.releaseDate && (
                          <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
                            {album.releaseDate.substring(0, 4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollableSection>
          )}

          {artists.length > 0 && (
            <ScrollableSection title="Artists">
              <div className="flex space-x-2 pb-1">
                {artists.map((artist) => (
                  <div 
                    key={artist.id} 
                    className="flex-shrink-0 w-32 sm:w-40 md:w-[11rem] overflow-hidden cursor-pointer group relative border-muted hover:bg-opacity-80 transition-colors"
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    style={{ aspectRatio: '1.6/1.7' }}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                        style={{ backgroundImage: `url(${artist.picture_medium || artist.picture_big || artist.picture})` }}
                      ></div>
                      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    </div>
                    
                    <div className="relative h-full flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative mb-3 border-2 border-white overflow-hidden rounded-full">
                        <img 
                          src={artist.picture_medium || artist.picture_big || artist.picture}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x300?text=No+Artist+Image";
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FontAwesomeIcon 
                            icon={faExternalLinkAlt} 
                            className="text-white text-sm sm:text-base md:text-xl"
                          />
                        </div>
                      </div>
                      
                      <div className="text-center mt-1 z-10">
                        <h3 className="font-bold text-white text-xs sm:text-sm truncate drop-shadow">{artist.name}</h3>
                        {artist.nb_fan > 0 && (
                          <p className="text-[10px] sm:text-xs text-white mt-0.5 drop-shadow-lg">
                            {formatFanCount(artist.nb_fan)} fans
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollableSection>
          )}

          {!loading && songs.length === 0 && albums.length === 0 && query && (
            <div className="text-center p-8 bg-primary-light/30 rounded-lg">
              <p className="text-lg text-muted">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          )}
          
          {!loading && songs.length === 0 && albums.length === 0 && !query && (
            <div className="text-center p-8 bg-primary-light/30 rounded-lg">
              <p className="text-lg text-muted">Enter a search query to find music</p>
              <p className="text-sm mt-2">Search for your favorite artists, songs, or albums</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatPopularity(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

function formatFanCount(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}
