import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart, 
  faPlay, 
  faPause, 
  faArrowLeft, 
  faClock,
  faUser,
  faCompactDisc,
  faMusic,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../components/common/ui/ScrollableSection";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";

export default function Artist() {
  const { artistId } = useParams();
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const audioRef = useRef(null);
  const navigate = useNavigate();
  
  const [allSongs, setAllSongs] = useState([]);
  const [loadingMoreSongs, setLoadingMoreSongs] = useState(false);
  const [hasMoreSongs, setHasMoreSongs] = useState(false);
  const [page, setPage] = useState(1);

  // Load artist data and liked songs on mount
  useEffect(() => {
    async function fetchArtist() {
      // Scroll to top of page when component mounts
      window.scrollTo(0, 0);

      if (!artistId) {
        setError("No artist ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get artist details with better error handling
        const artistData = await deezerService.getArtist(artistId);
        setArtist(artistData);

        if (artistData.artists && artistData.artists.data) {
          setArtists(artistData.artists.data);
        }

        if (!artistData) {
          setError("Artist not found");
          return;
        }

        // Process artist data with explicit image handling
        const processedArtist = {
          id: artistData.id,
          name: artistData.name,
          picture_xl: artistData.picture_xl,
          picture_big: artistData.picture_big,
          picture_medium: artistData.picture_medium,
          picture: artistData.picture,
          nb_fan: artistData.nb_fan || 0,
          nb_album: artistData.nb_album || 0,
          link: artistData.link
        };

        console.log(artist)
        // Set artist data with all image URLs
        setArtist(processedArtist);

        // Get artist top tracks
        const topTracksData = await deezerService.getArtistTopTracks(artistId);
        
        if (topTracksData && topTracksData.data) {
          // Map tracks to consistent format
          const processedTracks = topTracksData.data.map((track, index) => ({
            id: track.id,
            name: track.title,
            artist: track.artist ? track.artist.name : artistData.name,
            albumName: track.album ? track.album.title : "Unknown Album",
            albumId: track.album ? track.album.id : null,
            duration: track.duration,
            trackNumber: index + 1,
            previewUrl: track.preview,
            externalUrl: track.link || `https://www.deezer.com/track/${track.id}`,
            albumArt: track.album?.cover_medium || "https://via.placeholder.com/300x300?text=No+Cover"
          }));
          
          setTopTracks(processedTracks);
        }
        
        // Get artist albums
        const albumsData = await deezerService.getArtistAlbums(artistId);
        
        if (albumsData && albumsData.data) {
          const processedAlbums = albumsData.data.map(album => ({
            id: album.id,
            name: album.title || album.name,
            artist: album.artist?.name || artistData.name,
            coverArt: album.cover_big || album.cover_medium || album.cover,
            releaseDate: album.release_date,
            trackCount: album.nb_tracks,
            link: album.link || `https://www.deezer.com/album/${album.id}`
          }));
          
          setAlbums(processedAlbums);
        }

        const corsProxy = 'https://corsproxy.io/?';
        const deezerUrl = `https://api.deezer.com/artist/${artistId}/radio?limit=50&index=0`;
        
        const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const tracksData = await response.json();
        
        if (tracksData && tracksData.data) {
          const processedTracks = tracksData.data.map(track => ({
            id: track.id,
            name: track.title,
            artist: track.artist ? track.artist.name : artistData.name,
            albumName: track.album ? track.album.title : "Unknown Album",
            albumId: track.album ? track.album.id : null,
            duration: track.duration,
            previewUrl: track.preview,
            externalUrl: track.link || `https://www.deezer.com/track/${track.id}`,
            albumArt: track.album?.cover_medium || "https://via.placeholder.com/300x300?text=No+Cover",
            releaseDate: track.release_date
          }));
          
          setAllSongs(processedTracks);
          setPage(2);
          setHasMoreSongs(tracksData.next || false);
        }
        
      } catch (err) {
        console.error("Error fetching artist:", err);
        setError("Failed to load artist. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    // Load liked songs from localStorage
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
    
    fetchArtist();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [artistId]);
  
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
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        // Show a message to the user that playback failed
      });
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
  
  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format fan count for display
  const formatFanCount = (value) => {
    if (!value) return "0";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Navigate to album
  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  const loadMoreSongs = async () => {
    if (loadingMoreSongs) return;
    
    try {
      setLoadingMoreSongs(true);
      
      // Use the corsProxy directly since we see it's defined that way in other functions
      const corsProxy = 'https://corsproxy.io/?';
      const deezerUrl = `https://api.deezer.com/artist/${artistId}/radio?limit=50&index=${(page-1)*50}`;
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(deezerUrl)}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const tracksData = await response.json();
      
      if (tracksData && tracksData.data) {
        const newTracks = tracksData.data.map(track => ({
          id: track.id,
          name: track.title,
          artist: track.artist ? track.artist.name : artist.name,
          albumName: track.album ? track.album.title : "Unknown Album",
          albumId: track.album ? track.album.id : null,
          duration: track.duration,
          previewUrl: track.preview,
          externalUrl: track.link || `https://www.deezer.com/track/${track.id}`,
          albumArt: track.album?.cover_medium || "https://via.placeholder.com/300x300?text=No+Cover",
          releaseDate: track.release_date
        }));
        
        setAllSongs(prev => [...prev, ...newTracks]);
        setPage(page + 1);
        setHasMoreSongs(tracksData.next || false);
      }
    } catch (err) {
      console.error("Error loading more songs:", err);
    } finally {
      setLoadingMoreSongs(false);
    }
  };

  // If still loading, show spinner
  if (loading) {
    return <LoadingSpinner message="Loading artist..." />;
  }
  
  // If there was an error, show error message
  if (error) {
    return (
      <div className="my-8 text-center">
        <div className="bg-primary-light/50 p-6 rounded-lg inline-block">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={handleGoBack}
            className="bg-accent hover:bg-accent/80 px-4 py-2 rounded-lg text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // If artist data hasn't loaded, show message
  if (!artist) {
    return (
      <div className="my-8 text-center">
        <div className="bg-primary-light/50 p-6 rounded-lg inline-block">
          <p className="text-muted mb-4">Artist not found</p>
          <button 
            onClick={handleGoBack}
            className="bg-accent hover:bg-accent/80 px-4 py-2 rounded-lg text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-1">
      {/* Back button */}
      <button 
        onClick={handleGoBack} 
        className="flex items-center text-muted hover:text-white mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Back
      </button>
      
      {/* Artist header with circular image and background */}
      <div className="flex flex-col mb-6 bg-primary-light/30 rounded-lg p-4 relative overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* Blurred background image - now uses newest album art */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-80"
            style={{ 
              backgroundImage: `url(${
                // First try newest album art if available
                (albums.length > 0 && 
                 albums.sort((a, b) => new Date(b.releaseDate || "1900-01-01") - new Date(a.releaseDate || "1900-01-01"))[0]?.coverArt)
                // Fall back to artist image if no albums
                || artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture
              })`
            }}
          ></div>
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        </div>
        
        {/* Rest of the header remains the same... */}
        <div className="flex-grow"></div>
        
        {/* Card content with circular image - positioned at bottom now */}
        <div className="relative flex flex-col md:flex-row items-start md:items-start justify-center py-4 md:py-6 mt-auto">
          {/* Circular artist image with better fallback and error handling */}
          <div className="w-24 h-24 md:w-28 md:h-28 relative mb-4 md:mb-0 md:mr-6 border-2 border-white overflow-hidden rounded-full shadow-xl">
          <img 
              src={artist.cover_xl || artist.cover_big || artist.cover_medium || artist.cover} 
              alt={artist.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Rest of the artist info continues... */}
          <div className="text-center md:text-left z-10 flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow">{artist.name}</h1>
            
            {/* Artist metadata - new layout with latest album */}
            <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6 justify-center md:justify-start">
              {artist.nb_fan > 0 && (
                <div className="flex items-center justify-center md:justify-start text-white drop-shadow">
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  {formatFanCount(artist.nb_fan)} fans
                </div>
              )}
              
              {/* Latest album/release section */}
              {albums.length > 0 && albums.sort((a, b) => 
                new Date(b.releaseDate || "1900-01-01") - new Date(a.releaseDate || "1900-01-01")
              )[0] && (
                <div 
                  className="flex items-center justify-center md:justify-start text-white drop-shadow cursor-pointer group"
                  onClick={() => handleAlbumClick(albums[0].id)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-2 overflow-hidden rounded">
                      <img 
                        src={albums[0].coverArt} 
                        alt={albums[0].name}
                        className="w-full h-full "
                      />
                    </div>
                    <div>
                      <span className="text-xs text-accent">Latest Release</span>
                      <div className="flex items-center">
                        <span className="group-hover:underline">{albums[0].name}</span>
                        <span className="text-xs text-muted ml-2">
                          {albums[0].releaseDate && `(${albums[0].releaseDate.substring(0, 4)})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Display top track count if we have no albums but we have tracks */}
              {albums.length === 0 && topTracks.length > 0 && (
                <div className="flex items-center justify-center md:justify-start text-white drop-shadow">
                  <FontAwesomeIcon icon={faMusic} className="mr-2" />
                  {topTracks.length} top tracks
                </div>
              )}
            </div>

            {/* External links - smaller buttons */}
            <div className="flex gap-2 justify-center md:justify-start">
              <a 
                href={artist.link || `https://www.deezer.com/artist/${artist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/80 border border-white hover:border-accent text-white px-3 py-2 text-sm rounded-md inline-block transition-colors shadow-md"
              >
                Listen on Deezer
              </a>
              <a 
                href={`https://open.spotify.com/search/${encodeURIComponent(artist.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-spotify hover:bg-[#1DB954]/80 text-white px-3 py-2 text-sm rounded-md inline-block transition-colors shadow-md"
              >
                Play on Spotify
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Tracks Section - Now horizontally scrollable like TrendingSongs */}
      {topTracks.length > 0 && (
        <div className="mb-8">
          <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">Popular Tracks</h3>}>
            <div className="flex space-x-2">
              {/* Split tracks into groups of 4 for horizontal scrolling */}
              {Array.from({ length: Math.ceil(topTracks.length / 4) }).map((_, groupIndex) => {
                const groupTracks = topTracks.slice(groupIndex * 4, groupIndex * 4 + 4);
                return (
                  <div 
                    key={groupIndex} 
                    className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
                  >
                    {groupTracks.map((track) => (
                      <div 
                        key={track.id} 
                        className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:bg-primary-light transition-colors cursor-pointer"
                        onClick={() => window.open(track.externalUrl, '_blank')}
                      >
                        <div className="w-12 h-12 flex-shrink-0 relative group">
                          <img 
                            src={track.albumArt} 
                            alt={track.name}
                            className="w-full h-full object-cover rounded"
                          />
                          {track.previewUrl && (
                            <button
                              onClick={(e) => handlePlayPause(track.id, track.previewUrl, e)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                            >
                              <FontAwesomeIcon 
                                icon={currentlyPlaying === track.id ? faPause : faPlay} 
                                className="text-white"
                              />
                            </button>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-grow min-w-0 text-start">
                          <div className="font-semibold text-white truncate">{track.name}</div>
                          <div className="flex justify-between">
                            <div className="text-xs text-accent truncate">
                              {track.albumId ? (
                                <span 
                                  className="cursor-pointer hover:underline" 
                                  onClick={(e) => { e.stopPropagation(); handleAlbumClick(track.albumId); }}
                                >
                                  {track.albumName}
                                </span>
                              ) : track.albumName}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center ml-2">
                          <button 
                            className="p-1.5 rounded-full hover:bg-muted/20 transition-colors"
                            onClick={(e) => handleLike(track.id, e)}
                            aria-label={likedSongs[track.id] ? "Unlike" : "Like"}
                          >
                            <FontAwesomeIcon 
                              icon={faHeart} 
                              className={`${likedSongs[track.id] ? "text-red-500" : "text-muted"} text-sm`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollableSection>
        </div>
      )}
      
      {/* Albums Section */}
      {albums.length > 0 && (
        <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">Albums</h3>}>
          <div className="flex space-x-2 pb-1">
            {albums.map((album) => (
              <div 
                key={album.id} 
                className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
                onClick={() => handleAlbumClick(album.id)}
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
                        icon={faPlay} 
                        className="text-white text-sm sm:text-base md:text-xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2 sm:p-3 md:p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{album.name}</h3>
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
      
      {/* All Songs Section - Similar to TrendingSongs */}
      {allSongs.length > 0 && (
        <div className="mb-8">
          <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">Songs</h3>}>
            <div className="flex space-x-2">
              {/* Split tracks into groups of 4 for horizontal scrolling */}
              {Array.from({ length: Math.ceil(allSongs.length / 4) }).map((_, groupIndex) => {
                const groupTracks = allSongs.slice(groupIndex * 4, groupIndex * 4 + 4);
                return (
                  <div 
                    key={groupIndex} 
                    className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
                  >
                    {groupTracks.map((track) => (
                      <div 
                        key={track.id} 
                        className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:bg-primary-light transition-colors cursor-pointer"
                        onClick={() => navigate(`/song/${track.id}`)}
                      >
                        <div className="w-12 h-12 flex-shrink-0 relative group">
                          <img 
                            src={track.albumArt} 
                            alt={track.name}
                            className="w-full h-full object-cover rounded"
                          />
                          {track.previewUrl && (
                            <button
                              onClick={(e) => handlePlayPause(track.id, track.previewUrl, e)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                            >
                              <FontAwesomeIcon 
                                icon={currentlyPlaying === track.id ? faPause : faPlay} 
                                className="text-white"
                              />
                            </button>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-grow min-w-0 text-start">
                          <div className="font-semibold text-white truncate">{track.name}</div>
                          <div className="flex justify-between">
                            <div className="text-xs text-accent truncate">
                              {track.albumId ? (
                                <span 
                                  className="cursor-pointer hover:underline" 
                                  onClick={(e) => { e.stopPropagation(); handleAlbumClick(track.albumId); }}
                                >
                                  {track.albumName}
                                </span>
                              ) : track.albumName}
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          className="ml-2 p-1.5 rounded-full hover:bg-muted/20 transition-colors"
                          onClick={(e) => handleLike(track.id, e)}
                          aria-label={likedSongs[track.id] ? "Unlike" : "Like"}
                        >
                          <FontAwesomeIcon 
                            icon={faHeart} 
                            className={`${likedSongs[track.id] ? "text-red-500" : "text-muted"} text-sm`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollableSection>
          
          {hasMoreSongs && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMoreSongs}
                disabled={loadingMoreSongs}
                className="bg-primary-light/50 hover:bg-primary/80 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {loadingMoreSongs ? 'Loading...' : 'Load More Songs'}
              </button>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}