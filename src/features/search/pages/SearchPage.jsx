import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";
import ScrollableSection from "../../../components/common/ui/ScrollableSection";

export default function SearchPage() {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("query");
  const audioRef = useRef(null);

  useEffect(() => {
    // Load liked songs from localStorage
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
  }, []);

  useEffect(() => {
    if (query) {
      search(query);
    }
  }, [query]);

  async function search(searchInput) {
    setLoading(true);
    setError("");
    try {
      // Search for tracks
      const trackResults = await deezerService.search(searchInput, 'track', 100);
      
      // Map and sort by popularity
      const mappedTracks = trackResults.data.map(track => ({
        id: track.id,
        name: track.title,
        artist: track.artist.name,
        album: track.album.title,
        albumArt: track.album.cover_medium || track.album.cover_small,
        previewUrl: track.preview,
        externalUrl: track.link,
        popularity: track.rank || 0, // Deezer uses "rank" for popularity
      }));
      
      // Sort tracks by popularity (highest first)
      const sortedTracks = mappedTracks.sort((a, b) => b.popularity - a.popularity);
      setSongs(sortedTracks);
      
      // Search for albums
      const albumResults = await deezerService.search(searchInput, 'album', 20);
      setAlbums(albumResults.data.map(album => ({
        id: album.id,
        name: album.title,
        artist: album.artist.name,
        coverArt: album.cover_big || album.cover_medium,
        releaseDate: album.release_date,
        trackCount: album.nb_tracks,
        link: album.link
      })));
      
      // Search for artists
      const artistResults = await deezerService.search(searchInput, 'artist', 10);
      setArtists(artistResults.data);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Something went wrong with the search.");
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
      <h2 className="text-3xl font-bold mb-6 text-start">Search Results for "{query}"</h2>
      
      {error && (
        <div className="bg-primary-light p-6 text-center rounded-lg mb-8">
          <p className="text-error mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
            onClick={() => search(query)}
          >
            Try Again
          </button>
        </div>
      )}
      
      {loading ? (
        <LoadingSpinner message="Searching..." />
      ) : (
        <>
          {/* Songs Section - Now with horizontal scrolling and popularity-based grouping */}
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
                            onClick={() => window.open(song.externalUrl, '_blank')}
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

          {/* Albums Section */}
          {albums.length > 0 && (
            <div className="mb-10">
              <h3 className="text-2xl font-semibold mb-4 text-start">Albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <div 
                    key={album.id} 
                    className="overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer"
                    onClick={() => window.open(album.link, '_blank')}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={album.coverArt}
                        alt={album.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 w-full">
                      <h3 className="font-semibold text-white text-sm truncate max-w-full">{album.name}</h3>
                      <p className="text-xs text-muted mt-1 truncate max-w-full">{album.artist}</p>
                      {album.releaseDate && (
                        <p className="text-xs text-muted mt-1">{album.releaseDate.substring(0, 4)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state if no results */}
          {songs.length === 0 && albums.length === 0 && !loading && (
            <div className="text-center p-8 bg-primary-light/30 rounded-lg">
              <p className="text-lg text-muted">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try searching with different keywords</p>
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