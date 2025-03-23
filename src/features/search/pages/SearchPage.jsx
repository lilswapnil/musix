import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause, faSearch, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";
import ScrollableSection from "../../../components/common/ui/ScrollableSection";
import { debounce } from "../../../utils/requestUtils";

export default function SearchPage() {
  // Keep existing state variables
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const [searchInput, setSearchInput] = useState(""); // Track input field separately
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("query") || "";
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Load liked songs on mount
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
    
    // Set input field to match URL query
    setSearchInput(query);
    
    // Initial search if query exists
    if (query) {
      search(query);
    }
    
    // Cleanup function to cancel any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]); // Add query as a dependency

  // Memoize the search function to use in dependencies
  const memoizedSearch = useCallback(search, []);

  // Create debounced search function with a longer delay
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      // Update URL with debounced query
      if (searchQuery) {
        const searchParams = new URLSearchParams();
        searchParams.set("query", searchQuery);
        navigate({
          pathname: location.pathname,
          search: searchParams.toString()
        }, { replace: true });
      }
      
      // Execute the actual search
      memoizedSearch(searchQuery);
    }, 800), // Increased debounce time
    [navigate, location.pathname, memoizedSearch] // Include search in dependencies
  );
  
  // Search handler for input changes
  const handleSearchInput = (event) => {
    const newQuery = event.target.value;
    setSearchInput(newQuery);
    
    if (newQuery.trim().length > 1) {
      debouncedSearch(newQuery);
    } else if (newQuery.trim() === '') {
      // Clear results if search is emptied
      setSongs([]);
      setAlbums([]);
      setArtists([]);
      
      // Update URL to remove query
      navigate({
        pathname: location.pathname
      }, { replace: true });
    }
  };

  // Main search function with request batching and cache
  async function search(searchQuery) {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return;
    }
    
    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this search
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError("");
    
    // Use a single API call to fetch all types rather than three separate calls
    try {
      const response = await deezerService.searchAll(searchQuery, abortControllerRef.current.signal);
      
      if (response.tracks && response.tracks.data) {
        const mappedTracks = response.tracks.data.map(track => ({
          id: track.id,
          name: track.title,
          artist: track.artist.name,
          album: track.album.title,
          albumArt: track.album.cover_medium || track.album.cover_small,
          previewUrl: track.preview,
          externalUrl: track.link,
          popularity: track.rank || 0,
        }));
        
        const sortedTracks = mappedTracks.sort((a, b) => b.popularity - a.popularity);
        setSongs(sortedTracks);
      }
      
      if (response.albums && response.albums.data) {
        const processedAlbums = response.albums.data.map(album => ({
          id: album.id,
          name: album.title || album.name,
          artist: album.artist?.name || "Unknown Artist",
          coverArt: album.cover_big || album.cover_medium || album.cover || "https://via.placeholder.com/300x300?text=No+Cover",
          releaseDate: album.release_date,
          trackCount: album.nb_tracks,
          link: album.link || `https://www.deezer.com/album/${album.id}`
        }));
        
        setAlbums(processedAlbums);
      }
      
      if (response.artists && response.artists.data) {
        setArtists(response.artists.data);
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') { // Ignore abort errors
        console.error("Search error:", err);
        setError(err.message === 'Rate limited' 
          ? "Searching too quickly. Please wait a moment." 
          : (err.message || "Something went wrong with the search."));
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle song playback
  const handlePlayPause = (songId, previewUrl, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    // If clicked on currently playing song, pause it
    if (currentlyPlaying === songId) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
      return;
    }
    
    // If there's currently a song playing, pause it
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Play the new song
    if (previewUrl) {
      // Create a new audio element
      const audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => setCurrentlyPlaying(null));
      audioRef.current = audio;
      audio.play();
      setCurrentlyPlaying(songId);
    }
  };

  // Handle like button click
  const handleLike = (songId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    setLikedSongs(prev => {
      const newLikes = {
        ...prev,
        [songId]: !prev[songId]
      };
      
      // Save to localStorage
      localStorage.setItem('likedSongs', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  // Group songs into categories based on popularity
  const groupedSongs = songs.reduce((groups, song) => {
    let groupName;
    
    // Group songs based on popularity ranking
    if (song.popularity > 500000) {
      groupName = 'Top Results';
    } else {
      groupName = 'Songs';
    } 
    
    // Create group if it doesn't exist
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    groups[groupName].push(song);
    return groups;
  }, {});

  return (
    <div className="my-4">
      {/* Improved search input for immediate searching */}      
      <h2 className="text-3xl font-bold mb-6 text-start">
        {query ? `Search Results for "${query}"` : "Search for music"}
      </h2>
      
      {/* Display user-friendly error */}
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
          {/* Songs Section - With horizontal scrolling and popularity-based grouping */}
          {songs.length > 0 && Object.entries(groupedSongs).map(([groupName, groupSongs]) => (
            <div key={groupName} className="mb-8">
              <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">{groupName}</h3>}>
                <div className="flex space-x-2">
                  {/* Split tracks into groups of 4 for horizontal scrolling */}
                  {Array.from({ length: Math.ceil(groupSongs.length / 4) }).map((_, groupIndex) => {
                    const groupTracks = groupSongs.slice(groupIndex * 4, groupIndex * 4 + 4);
                    return (
                      <div 
                        key={groupIndex} 
                        className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
                      >
                        {groupTracks.map((song) => (
                          <div 
                            key={song.id} 
                            className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:bg-primary-light transition-colors cursor-pointer"
                            onClick={() => navigate(`/song/${song.id}`)} // Changed from /album/ to /song/
                          >
                            <div className="w-12 h-12 flex-shrink-0 relative group">
                              <img 
                                src={song.albumArt} 
                                alt={song.name}
                                className="w-full h-full object-cover rounded"
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

          {/* Albums Section - Now with same style as TopAlbums */}
          {albums.length > 0 && (
            <ScrollableSection title="Albums">
              <div className="flex space-x-2 pb-1">
                {albums.map((album) => (
                  <div 
                    key={album.id} 
                    className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
                    onClick={() => navigate(`/album/${album.id}`)}
                  >
                    <div className="relative">
                      <img 
                        src={album.coverArt}
                        alt={album.name}
                        className="w-full h-32 sm:h-40 md:h-48 object-cover"
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
                        <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">{album.artist.name}</p>
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

          {/* Artists Section - Now with same style as TopArtists */}
          {artists.length > 0 && (
            <ScrollableSection title="Artists">
              <div className="flex space-x-2 pb-1">
                {artists.map((artist) => (
                  <div 
                    key={artist.id} 
                    className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden cursor-pointer group relative border-muted hover:bg-opacity-80 transition-colors"
                    //Testing
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    style={{ aspectRatio: '1.6/1.7' }}
                  >
                    {/* Blurred background image */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                        style={{ backgroundImage: `url(${artist.picture_medium || artist.picture_big || artist.picture})` }}
                      ></div>
                      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    </div>
                    
                    {/* Card content with circular image */}
                    <div className="relative h-full flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative mb-3 border-2 border-white overflow-hidden rounded-full">
                        <img 
                          src={artist.picture_medium || artist.picture_big || artist.picture}
                          alt={artist.name}
                          className="w-full h-full object-cover"
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

          {/* Empty state if no results */}
          {!loading && songs.length === 0 && albums.length === 0 && query && (
            <div className="text-center p-8 bg-primary-light/30 rounded-lg">
              <p className="text-lg text-muted">No results found for "{query}"</p>
              <p className="text-sm mt-2">Refreshing</p>
            </div>
          )}
          
          {/* Initial state */}
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

// Helper function to format popularity for display
function formatPopularity(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

// Helper function to format fan count
function formatFanCount(value) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}
