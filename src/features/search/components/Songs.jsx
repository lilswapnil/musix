import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { geniusService } from "../../../services/geniusService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart, 
  faPlay, 
  faPause, 
  faArrowLeft, 
  faCompactDisc,
  faExternalLinkAlt,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";

export default function Songs() {
  const { songId } = useParams();
  const [song, setSong] = useState(null);
  const [artist, setArtist] = useState(null);
  const [geniusSong, setGeniusSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
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
          link: songData.link,
          rank: songData.rank
        };
        
        setSong(processedSong);
        
        // Get artist details if available
        if (songData.artist && songData.artist.id) {
          try {
            const artistData = await deezerService.getArtist(songData.artist.id);
            setArtist(artistData);
          } catch (artistErr) {
            console.warn('Could not fetch artist details:', artistErr);
          }
        }
        
        // Try to find song on Genius for lyrics link
        if (geniusService.isConfigured()) {
          try {
            const geniusResult = await geniusService.findSong(
              songData.title, 
              songData.artist?.name
            );
            if (geniusResult) {
              setGeniusSong(geniusResult);
            }
          } catch (geniusErr) {
            console.warn('Could not fetch Genius data:', geniusErr);
          }
        }
        
      } catch (err) {
        console.error("Error fetching song:", err);
        setError("Failed to load song. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    // Load liked status from localStorage
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        const likes = JSON.parse(savedLikes);
        setLiked(!!likes[songId]);
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

  // Handle like button click
  const handleLike = () => {
    if (!song) return;
    
    setLiked(prev => {
      const newLiked = !prev;
      
      // Save to localStorage
      try {
        const savedLikes = localStorage.getItem('likedSongs');
        const likes = savedLikes ? JSON.parse(savedLikes) : {};
        likes[song.id] = newLiked;
        localStorage.setItem('likedSongs', JSON.stringify(likes));
      } catch (err) {
        console.error('Error saving like:', err);
      }
      
      return newLiked;
    });
  };
  
  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };
  
  // Navigate to album
  const handleAlbumClick = () => {
    if (song?.albumId) {
      navigate(`/album/${song.albumId}`);
    }
  };
  
  // Navigate to artist
  const handleArtistClick = () => {
    if (song?.artistId) {
      navigate(`/artist/${song.artistId}`);
    }
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
    <div className="mt-1 relative">
      {/* Full page album art background - positioned to cover the entire viewport */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${song.albumArt || "https://via.placeholder.com/1200x1200?text=Music"})`
          }}
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
        {/* Blur overlay */}
        <div 
          className="absolute inset-0 backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        />
      </div>

      {/* Content wrapper with higher z-index */}
      <div className="relative z-10">
        {/* Back button */}
        <button 
          onClick={handleGoBack} 
          className="flex items-center text-muted hover:text-white mb-6 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back
        </button>

        {/* Main content - centered banner */}
        <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full min-h-[70vh]">
          {/* Album art */}
          <div className="relative mb-6 group">
            <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl">
              <img 
                src={song.albumArt || "https://via.placeholder.com/400x400?text=Album"}
                alt={song.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/400x400?text=Album";
                }}
              />
            </div>
            
            {/* Play overlay on album art */}
            {song.previewUrl && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <FontAwesomeIcon 
                    icon={isPlaying ? faPause : faPlay} 
                    className="text-white text-2xl ml-1"
                  />
                </div>
              </button>
            )}
          </div>

          {/* Song info */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {song.name}
            </h1>
            
            <h2 
              className="text-lg sm:text-xl text-white/80 hover:text-accent cursor-pointer transition-colors mb-1"
              onClick={handleArtistClick}
            >
              {song.artist || "Unknown Artist"}
            </h2>
            
            {song.album && (
              <p 
                className="text-white/60 text-sm hover:text-white/80 cursor-pointer transition-colors"
                onClick={handleAlbumClick}
              >
                {song.album}
              </p>
            )}
            
            {song.duration && (
              <p className="text-white/50 text-xs mt-1 flex items-center justify-center gap-1">
                <FontAwesomeIcon icon={faCompactDisc} className="text-xs" />
                {formatTime(song.duration)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {/* Play button */}
            {song.previewUrl && (
              <button
                onClick={handlePlayPause}
                className="bg-accent hover:bg-accent/80 text-white px-5 py-2 text-sm rounded-full inline-flex items-center gap-2 transition-all shadow-lg hover:scale-105"
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                {isPlaying ? "Pause" : "Play Preview"}
              </button>
            )}

            {/* Like button */}
            <button 
              onClick={handleLike}
              className={`${liked ? 'bg-red-500/20 border-red-500' : 'bg-white/10 border-white/30'} hover:bg-white/20 border px-5 py-2 text-sm rounded-full inline-flex items-center gap-2 transition-all shadow-lg hover:scale-105`}
            >
              <FontAwesomeIcon 
                icon={faHeart} 
                className={liked ? "text-red-500" : "text-white"}
              />
              <span className="text-white">
                {liked ? "Liked" : "Like"}
              </span>
            </button>
          </div>

          {/* Lyrics banner - links to Genius */}
          {geniusSong && (
            <a 
              href={geniusSong.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-sm glass p-4 rounded-lg hover:bg-white/20 transition-all group cursor-pointer mb-6"
            >
              <div className="flex items-center gap-3">
                {geniusSong.thumbnail && (
                  <img 
                    src={geniusSong.thumbnail} 
                    alt="Genius"
                    className="w-12 h-12 rounded-md object-cover"
                  />
                )}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <FontAwesomeIcon icon={faFileAlt} className="text-yellow-400 text-xs" />
                    <span className="text-yellow-400 text-xs font-medium">View Lyrics</span>
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{geniusSong.title}</p>
                  <p className="text-white/60 text-xs truncate">{geniusSong.artist}</p>
                </div>
                <FontAwesomeIcon 
                  icon={faExternalLinkAlt} 
                  className="text-white/40 group-hover:text-white transition-colors text-sm"
                />
              </div>
            </a>
          )}

          {/* External links */}
          <div className="flex flex-wrap gap-2 justify-center">
            {/* Deezer link */}
            <a 
              href={song.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
            >
              Listen on Deezer
              <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
            </a>
            
            {/* Spotify link */}
            <a 
              href={`https://open.spotify.com/search/${encodeURIComponent(song.name + ' ' + song.artist)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1DB954]/20 hover:bg-[#1DB954]/40 border border-[#1DB954]/50 text-white px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
            >
              Play on Spotify
            </a>

            {/* Genius link if not showing banner */}
            {!geniusSong && geniusService.isConfigured() && (
              <a 
                href={`https://genius.com/search?q=${encodeURIComponent(song.name + ' ' + song.artist)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400/20 hover:bg-yellow-400/40 border border-yellow-400/50 text-white px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
              >
                <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                Find Lyrics
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}