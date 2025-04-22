import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart, 
  faPlay, 
  faPause, 
  faArrowLeft, 
  faCompactDisc,
  faUsers,
  faExternalLinkAlt,
  faMusic
} from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../components/common/ui/ScrollableSection";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";

export default function Songs() {
  const { songId } = useParams();
  const [song, setSong] = useState(null);
  const [artist, setArtist] = useState(null);
  const [album, setAlbum] = useState(null);
  const [relatedTracks, setRelatedTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const audioRef = useRef(null);
  const navigate = useNavigate();
  
  // Load song data and liked songs on mount
  useEffect(() => {
    async function fetchSong() {
      if (!songId) {
        setError("No song ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get song details
        const songData = await deezerService.getTrack(songId);

        if (!songData) {
          setError("Song not found");
          return;
        }

        // Process song data
        const processedSong = {
          id: songData.id,
          name: songData.title,
          artist: songData.artist?.name,
          artistId: songData.artist?.id,
          album: songData.album?.title,
          albumId: songData.album?.id,
          albumArt: songData.album?.cover_xl || songData.album?.cover_big || songData.album?.cover_medium,
          duration: songData.duration,
          previewUrl: songData.preview,
          releaseDate: songData.release_date,
          bpm: songData.bpm,
          link: songData.link,
          rank: songData.rank,
          contributors: songData.contributors?.map(c => c.name).join(', ')
        };
        
        setSong(processedSong);
        
        // Get artist details if available
        if (songData.artist && songData.artist.id) {
          const artistData = await deezerService.getArtist(songData.artist.id);
          setArtist(artistData);
        }
        
        // Get album details if available
        if (songData.album && songData.album.id) {
          const albumData = await deezerService.getAlbum(songData.album.id);
          setAlbum(albumData);
          
          // Get related tracks from the same album
          if (albumData.tracks && albumData.tracks.data) {
            const processedTracks = albumData.tracks.data
              .filter(track => track.id !== parseInt(songId))
              .map((track, index) => ({
                id: track.id,
                name: track.title,
                artist: track.artist?.name,
                artistId: track.artist?.id,
                albumName: albumData.title,
                albumId: albumData.id,
                duration: track.duration,
                trackNumber: track.track_position,
                previewUrl: track.preview,
                externalUrl: track.link,
                albumArt: albumData.cover_medium || "https://via.placeholder.com/300x300?text=No+Cover"
              }));
            
            setRelatedTracks(processedTracks);
          }
        }
        
      } catch (err) {
        console.error("Error fetching song:", err);
        setError("Failed to load song. Please try again later.");
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
    
    fetchSong();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [songId]);
  
  // Handle song playback
  const handlePlayPause = () => {
    if (!song || !song.previewUrl) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(song.previewUrl);
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Handle related track playback
  const handleRelatedPlayPause = (trackId, previewUrl, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    // If currently playing the same song, pause it
    if (currentlyPlaying === trackId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
      return;
    }
    
    // If there's currently a song playing, pause it
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // If main song is playing, stop it
    if (isPlaying) {
      setIsPlaying(false);
    }
    
    // Play the new song
    if (previewUrl) {
      // Create a new audio element
      const audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => setCurrentlyPlaying(null));
      audioRef.current = audio;
      audio.play();
      setCurrentlyPlaying(trackId);
    }
  };

  // Handle like button click
  const handleLike = (id = null, event = null) => {
    if (event) {
      event.stopPropagation();
    }
    
    const songId = id || (song ? song.id : null);
    if (!songId) return;
    
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
  
  // Format popularity for display
  const formatPopularity = (value) => {
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
  
  // Navigate to artist
  const handleArtistClick = (artistId) => {
    navigate(`/artist/${artistId}`);
  };
  
  // If still loading, show spinner
  if (loading) {
    return <LoadingSpinner message="Loading song..." />;
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
  
  // If song data hasn't loaded, show message
  if (!song) {
    return (
      <div className="my-8 text-center">
        <div className="bg-primary-light/50 p-6 rounded-lg inline-block">
          <p className="text-muted mb-4">Song not found</p>
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
      
      {/* Song header with artist/album image and background - matches Artists.jsx style */}
      <div className="flex flex-col mb-6 bg-primary-light/30 rounded-lg p-4 relative overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* Blurred background image - uses album art or artist image */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-80"
            style={{ 
              backgroundImage: `url(${
                // Try artist image first if available
                (artist && (artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture)) ||
                // Then album art
                song.albumArt || 
                // Fallback
                "https://via.placeholder.com/1200x800?text=Music"
              })`
            }}
          ></div>
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="flex-grow"></div>
        
        {/* Card content with album art - positioned like in Artists.jsx */}
        <div className="relative flex flex-col md:flex-row items-start md:items-start justify-center py-4 md:py-6 mt-auto">
          {/* Album cover art - positioned like the circular image in Artists.jsx */}
          <div className="w-32 h-32 md:w-36 md:h-36 relative mb-4 md:mb-0 md:mr-6 border-2 border-white overflow-hidden shadow-xl">
            <img 
              src={song.albumArt || "https://via.placeholder.com/400x400?text=Album"}
              alt={song.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Image failed to load:", e.target.src);
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/400x400?text=Album";
              }}
            />
            
            {/* Play button overlay */}
            {song.previewUrl && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={isPlaying ? faPause : faPlay} 
                    className="text-white text-xl"
                  />
                </div>
              </button>
            )}
          </div>
          
          {/* Song info */}
          <div className="text-center md:text-left z-10 flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow">{song.name}</h1>
            
            {/* Artist info with link */}
            <h2 
              className="text-lg md:text-xl text-accent hover:underline cursor-pointer mb-2"
              onClick={() => song.artistId && handleArtistClick(song.artistId)}
            >
              {song.artist || "Unknown Artist"}
            </h2>
            
            {/* Song metadata - matches Artists.jsx layout */}
            <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6 justify-center md:justify-start">
              {/* Album with thumbnail */}
              {song.album && (
                <div 
                  className="flex items-center justify-center md:justify-start text-white drop-shadow cursor-pointer group"
                  onClick={() => song.albumId && handleAlbumClick(song.albumId)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-2 overflow-hidden rounded">
                      <img 
                        src={song.albumArt} 
                        alt={song.album}
                        className="w-full h-full"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-accent">From Album</span>
                      <div className="flex items-center">
                        <span className="group-hover:underline">{song.album}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Duration */}
              {song.duration && (
                <div className="flex items-center justify-center md:justify-start text-white drop-shadow">
                  <FontAwesomeIcon icon={faCompactDisc} className="mr-2" />
                  {formatTime(song.duration)}
                </div>
              )}
              
              {/* Popularity if available */}
              {song.rank > 0 && (
                <div className="flex items-center justify-center md:justify-start text-white drop-shadow">
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  {formatPopularity(song.rank)} plays
                </div>
              )}
            </div>
            
            {/* External links - matches Artists.jsx */}
            <div className="flex gap-2 justify-center md:justify-start">
              {/* Like button */}
              <button 
                onClick={() => handleLike()}
                className="bg-primary/40 hover:bg-primary/60 border border-white/30 px-3 py-2 rounded-md inline-flex items-center transition-colors shadow-md"
              >
                <FontAwesomeIcon 
                  icon={faHeart} 
                  className={`mr-2 ${likedSongs[song.id] ? "text-red-500" : "text-white"}`}
                />
                <span className="text-white text-sm">
                  {likedSongs[song.id] ? "Liked" : "Like"}
                </span>
              </button>
              
              {/* Play button - only if preview URL available */}
              {song.previewUrl && (
                <button
                  onClick={handlePlayPause}
                  className="bg-primary hover:bg-primary/80 border border-white/30 text-white px-3 py-2 text-sm rounded-md inline-flex items-center transition-colors shadow-md"
                >
                  <FontAwesomeIcon 
                    icon={isPlaying ? faPause : faPlay}
                    className="mr-2"
                  />
                  {isPlaying ? "Pause" : "Play Preview"}
                </button>
              )}
              
              {/* External link */}
              <a 
                href={song.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary/20 hover:bg-primary/40 border border-white/30 text-white px-3 py-2 text-sm rounded-md inline-flex items-center transition-colors shadow-md"
              >
                Listen on Deezer
                <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
              </a>
              
              {/* Spotify link */}
              <a 
                href={`https://open.spotify.com/search/${encodeURIComponent(song.name + ' ' + song.artist)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-spotify hover:bg-[#1DB954]/80 text-white px-3 py-2 text-sm rounded-md inline-flex items-center transition-colors shadow-md"
              >
                Play on Spotify
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Tracks Section - Using same styling as Artists.jsx top tracks */}
      {relatedTracks.length > 0 && (
        <div className="mb-8">
          <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">More from this Album</h3>}>
            <div className="flex space-x-2">
              {/* Split tracks into groups of 4 for horizontal scrolling */}
              {Array.from({ length: Math.ceil(relatedTracks.length / 4) }).map((_, groupIndex) => {
                const groupTracks = relatedTracks.slice(groupIndex * 4, groupIndex * 4 + 4);
                return (
                  <div 
                    key={groupIndex} 
                    className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
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
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/300x300?text=No+Cover";
                            }}
                          />
                          {track.previewUrl && (
                            <button
                              onClick={(e) => handleRelatedPlayPause(track.id, track.previewUrl, e)}
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
                          <div className="text-xs text-muted truncate">
                            {track.trackNumber ? `Track ${track.trackNumber}` : ''}
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
      
      {/* Album Section - if we have album data */}
      {album && (
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">About the Album</h3>
          <div 
            className="bg-primary-light/30 p-4 rounded-lg cursor-pointer hover:bg-primary-light/40 transition-colors"
            onClick={() => handleAlbumClick(album.id)}
          >
            <div className="flex items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 mr-4">
                <img 
                  src={album.cover_medium || album.cover_small || song.albumArt} 
                  alt={album.title} 
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="flex flex-col flex-grow">
                <h4 className="text-lg font-semibold text-white">{album.title}</h4>
                <p className="text-sm text-muted">
                  {album.nb_tracks} tracks • {formatTime(album.duration)} total
                  {album.release_date && ` • Released ${new Date(album.release_date).getFullYear()}`}
                </p>
                <div className="flex items-center mt-2">
                  <FontAwesomeIcon icon={faMusic} className="text-muted mr-2" />
                  <span className="text-xs text-accent">View full album</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}