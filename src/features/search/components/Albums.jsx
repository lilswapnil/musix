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
  faCompactDisc,
  faCalendar,
  faMusic,
  faGuitar,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";

export default function Albums() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [artistImage, setArtistImage] = useState(null); // Add state for artist image
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const [artistData, setArtistData] = useState(null); // Add state for artist data
  const audioRef = useRef(null);
  const navigate = useNavigate();
  
  // Load album data and artist image on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchAlbum() {
      if (!albumId) {
        setError("No album ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Get album details
        const albumData = await deezerService.getAlbum(albumId);
        setAlbum(albumData);
        console.log("Album data:", albumData);
        // Fetch artist image if artist info is available
        if (albumData.artist && albumData.artist.id) {
          try {
            const artistData = await deezerService.getArtist(albumData.artist.id);
            if (artistData) {
              setArtistData(artistData); // Store the complete artist data
              setArtistImage(
                artistData.picture_xl || 
                artistData.picture_big || 
                artistData.picture_medium || 
                artistData.picture
              );
            }
          } catch (artistErr) {
            console.warn("Could not load artist image:", artistErr);
            // No need to set error - we'll fall back to album image
          }
        }
        
        if (albumData.tracks && albumData.tracks.data) {
          // Map tracks to consistent format
          const processedTracks = albumData.tracks.data.map((track, index) => ({
            id: track.id,
            name: track.title,
            artist: track.artist ? track.artist.name : albumData.artist ? albumData.artist.name : "Unknown Artist",
            duration: track.duration,
            trackNumber: index + 1,
            previewUrl: track.preview,
            externalUrl: track.link || `https://www.deezer.com/track/${track.id}`,
            // Add albumArt from the main album
            albumArt: albumData.cover_medium || albumData.cover || "https://via.placeholder.com/300x300?text=No+Cover"
          }));
          
          setTracks(processedTracks);
        }
      } catch (err) {
        console.error("Error fetching album:", err);
        setError("Failed to load album. Please try again later.");
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
    
    fetchAlbum();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [albumId]);
  
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
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleSongClick = (trackId) => {
    navigate(`/song/${trackId}`);
  }
  
  // If still loading, show spinner
  if (loading) {
    return <LoadingSpinner message="Loading album..." />;
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
  
  // If album data hasn't loaded, show message
  if (!album) {
    return (
      <div className="my-8 text-center">
        <div className="bg-primary-light/50 p-6 rounded-lg inline-block">
          <p className="text-muted mb-4">Album not found</p>
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
    <div className="my-6">
      {/* Back button */}
      <button 
        onClick={handleGoBack} 
        className="flex items-center text-muted hover:text-white mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Back
      </button>
      
      {/* Album header with artist background and album cover art */}
      <div className="flex flex-col md:flex-row mb-8 bg-primary-light/30 rounded-lg p-4 md:p-6 relative overflow-hidden">
        {/* Blurry background from artist image with fallback to album art */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
            style={{ 
              backgroundImage: `url(${
                // Try artist image first
                artistImage || 
                // Fall back to album cover if no artist image
                album.cover_xl || album.cover_big || album.cover_medium || album.cover
              })` 
            }}
          ></div>
          <div className="absolute inset-0 bg-primary-dark/70"></div>
        </div>
        
        {/* Album cover art remains the same */}
        <div className="w-full md:w-[11rem] lg:w-64 xl:w-80 flex-shrink-0 mb-4 md:mb-0 md:mr-6 relative z-10">
          <div className="aspect-square w-full rounded-lg overflow-hidden shadow-xl">
            <img 
              src={album.cover_xl || album.cover_big || album.cover_medium || album.cover} 
              alt={album.title} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Album info - now with artist image if available */}
        <div className="flex flex-col justify-between relative z-10 text-start">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">{album.title}</h1>
            
            {/* Artist with image if available */}
            <div className="flex items-center mb-4">
              {artistImage && (
                <div className="w-8 h-8 mr-2 overflow-hidden rounded-full border border-white/30">
                  <img 
                    src={artistImage} 
                    alt={album.artist?.name || "Artist"} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h2 
                className="text-lg md:text-xl text-accent hover:underline cursor-pointer"
                onClick={() => album.artist?.id && navigate(`/artist/${album.artist.id}`)}
              >
                {album.artist?.name || "Unknown Artist"}
              </h2>
            </div>
            
            {/* Rest of album metadata remains the same */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm m-2">
              {album.nb_tracks && (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faMusic} className="mr-2" />
                  {album.nb_tracks} tracks
                </div>
              )}
              {album.duration && (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  {Math.floor(album.duration / 60)} minutes
                </div>
              )}
              {album.release_date && (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                  Released: {new Date(album.release_date).toLocaleDateString()}
                </div>
              )}
              
              {/* Display genre information if available */}
              {album.genres && album.genres.data && album.genres.data.length > 0 ? (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faMusic} className="mr-2" />
                  {album.genres.data.map(genre => genre.name).join(', ')}
                </div>
              ) : (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faMusic} className="mr-2" />
                  {album.genre_id ? `Genre ID: ${album.genre_id}` : "Unknown Genre"}
                </div>
              )}
            
            </div>
          </div>

          {/* External links */}
          <div className="mt-4 flex gap-3">
            <a 
              href={album.link || `https://www.deezer.com/album/${album.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/80 border-2 border-muted hover:border-accent text-white px-4 py-3 rounded-md inline-block transition-colors"
            >
              Play on Deezer
            </a>
            <a 
              href={`https://open.spotify.com/search/${encodeURIComponent(album.title + ' ' + (album.artist?.name || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-spotify hover:bg-[#1DB954]/80 text-white px-4 py-3 rounded-md inline-block transition-colors"
            >
              Play on Spotify
            </a>
          </div>
        </div>
      </div>
      
      {/* Track listing */}
      <div className="mb-8">
        <h3 className="text-3xl font-semibold mb-4 text-start">Tracks</h3>
        
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 border-b border-muted/30 pb-2 mb-2 text-muted text-sm">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-4">Artist</div>
          <div className="col-span-1 text-center">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="col-span-1 text-center">
            <FontAwesomeIcon icon={faHeart} />
          </div>
        </div>
        
        {/* Track list */}
        {tracks.length > 0 ? (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div 
                key={track.id} 
                className={`grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-primary-light/50 transition-colors ${
                  currentlyPlaying === track.id ? 'bg-primary-light/30' : ''
                }`}
                onClick={() => handleSongClick(track.id)}
              >
                {/* Track number / Play button */}
                <div className="col-span-1 text-center relative group">
                  <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                    <span className="group-hover:opacity-0 transition-opacity">
                      {track.trackNumber}
                    </span>
                    {track.previewUrl && (
                      <button
                        onClick={(e) => handlePlayPause(track.id, track.previewUrl, e)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={currentlyPlaying === track.id ? "Pause" : "Play"}
                      >
                        <FontAwesomeIcon 
                          icon={currentlyPlaying === track.id ? faPause : faPlay} 
                          className="text-accent"
                        />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Title */}
                <div className="col-span-11 md:col-span-5 text-white font-medium truncate pl-2 md:pl-0">
                  {track.name}
                </div>
                
                {/* Artist - Only visible on md and up */}
                <div className="hidden md:block col-span-4 text-accent text-sm truncate">
                  {track.artist}
                </div>
                
                {/* Duration - Only visible on md and up */}
                <div className="hidden md:flex col-span-1 justify-center text-muted text-sm">
                  {formatTime(track.duration)}
                </div>
                
                {/* Like button */}
                <div className="hidden md:flex col-span-1 justify-center">
                  <button 
                    className="p-1 hover:bg-muted/10 rounded-full transition-colors"
                    onClick={(e) => handleLike(track.id, e)}
                    aria-label={likedSongs[track.id] ? "Unlike" : "Like"}
                  >
                    <FontAwesomeIcon 
                      icon={faHeart} 
                      className={`${likedSongs[track.id] ? "text-red-500" : "text-muted"}`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-primary-light/20 rounded-md">
            <p className="text-muted">No tracks available</p>
          </div>
        )}
      </div>
      
      {/* Artist Section */}
      {artistData && (
        <div className="mb-8">
          <h3 className="text-3xl font-semibold mb-4 text-start">About the Artist</h3>
          <div className="bg-primary-light/30 rounded-lg p-4 md:p-6 relative overflow-hidden">
            {/* Artist card content */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Artist image */}
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                <img 
                  src={artistImage || album.artist.picture_medium} 
                  alt={album.artist.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Artist info */}
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-2xl font-bold text-white mb-2 hover:underline cursor-pointer"
                    onClick={() => album.artist?.id && navigate(`/artist/${album.artist.id}`)}
                  
                >{album.artist?.name}</h4>
                
                {/* Artist stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {album.artist.nb_fan > 0 && (
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-muted text-sm">Fans</span>
                      <span className="text-white text-xl font-semibold">
                        {album.artist.nb_fan >= 1000000
                          ? `${(album.artist.nb_fan / 1000000).toFixed(1)}M`
                          : album.artist.nb_fan >= 1000
                          ? `${(album.artist.nb_fan / 1000).toFixed(0)}K`
                          : album.artist.nb_fan}
                      </span>
                    </div>
                  )}
                  
                  {album.artist.nb_album > 0 && (
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-muted text-sm">Albums</span>
                      <span className="text-white text-xl font-semibold">{album.artist.nb_album}</span>
                    </div>
                  )}
                  
                  {album.artist.nb_fan > 0 && (
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-muted text-sm">Popularity</span>
                      <div className="w-full max-w-[120px] bg-muted/30 rounded-full h-2 mt-2">
                        <div 
                          className="bg-accent h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (album.artist.nb_fan / 10000000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Artist links */}
                {/* View Artist Profile button on its own line */}
                <div className="mt-4 md:mt-3">
                  <button 
                    onClick={() => navigate(`/artist/${album.artist.id}`)}
                    className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    View Artist Profile
                  </button>
                  
                  {album.artist.link && (
                    <a 
                      href={album.artist.link}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="bg-primary/50 hover:bg-primary/70 border border-muted text-white px-4 py-2 rounded-md inline-flex items-center transition-colors ml-3"
                    >
                      Listen on Deezer
                    </a>
                  )}
                  
                  <a 
                    href={`https://open.spotify.com/search/${encodeURIComponent(album.artist.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-spotify hover:bg-[#1DB954]/80 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors ml-3"
                  >
                    Find on Spotify
                  </a>
                </div>
              </div>
            </div>
            
            {/* Top albums by this artist - Optional */}
            {album.artist.nb_album > 0 && (
              <div className="mt-8">
                <h5 className="text-xl font-medium text-white mb-4">Check out more albums by {album.artist.name}</h5>
                <div className="flex justify-center md:justify-start">
                  <button 
                    onClick={() => navigate(`/artist/${album.artist.id}`)}
                    className="bg-primary-light/50 hover:bg-primary-light/80 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    <FontAwesomeIcon icon={faCompactDisc} className="mr-2" />
                    View All Albums
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}