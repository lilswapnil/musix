import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { spotifyService } from "../../../services/spotifyServices";
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
  faUser
} from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";
import { Skeleton, SkeletonText, TrackRowSkeleton } from "../../../components/common/ui/Skeleton";

// Vinyl record presentation for the album header
const VinylRecord = ({ albumImage, artistImage, albumTitle, artistName }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        background: "transparent",
        padding: "40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative dots background removed for transparent look */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "none",
          backgroundSize: "30px 30px",
          opacity: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          maxWidth: "1200px",
          width: "100%",
        }}
      >
        {/* Vinyl Record */}
        <div
          style={{
            position: "relative",
            width: "470px",
            height: "470px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 100%)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.35), inset 0 0 40px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.08), 0 0 60px rgba(255,255,255,0.1), inset -20px -20px 60px rgba(0,0,0,0.4), inset 20px 20px 60px rgba(255,255,255,0.05)",
            zIndex: 0,            
            transform: "translateX(70px)",
          }}
        >
          {/* Vinyl grooves effect */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${90 - i * 5}%`,
                height: `${90 - i * 5}%`,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.03)",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Record label (center circle) */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "#f5f5f5",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Artist image in center */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 50%)",
                background: artistImage
                  ? `url(${artistImage})`
                  : "linear-gradient(135deg, #4a90e2 0%, #357abd 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            {/* Engraved artist name on white section */}
            <div
              style={{
                position: "absolute",
                bottom: "25%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "80%",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "600",
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "Arial, sans-serif",
                zIndex: 2,
              }}
            >
              {artistName}
            </div>

            {/* Center hole */}
            <div
              style={{
                position: "absolute",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #1a1a1a 0%, #000 100%)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8)",
                zIndex: 3,
              }}
            />
          </div>
        </div>

        {/* Album Cover Card */}
        <div
          style={{
            position: "relative",
            width: "480px",
            height: "480px",
            marginLeft: "-80px",
            background: "#ffffff",
            boxShadow: "0 18px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(0,0,0,0.25)",
            zIndex: 1,
            overflow: "hidden",
            borderRadius: "0px",
          }}
        >
          {albumImage ? (
            <img
              src={albumImage}
              alt={albumTitle || "Album Cover"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                color: "#999",
                fontSize: "24px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Album Cover
            </div>
          )}
        </div>
      </div>

      {/* Credit removed per request */}
    </div>
  );
};

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
  const [spotifyArtistData, setSpotifyArtistData] = useState(null); // Spotify-specific artist data
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

          // Fetch Spotify artist data for additional info
          try {
            const spotifyData = await spotifyService.searchArtists(albumData.artist.name, 1);
            if (spotifyData?.artists?.items?.length > 0) {
              const spotifyArtist = spotifyData.artists.items[0];
              setSpotifyArtistData(spotifyArtist);
              console.log("Spotify artist data:", spotifyArtist);
            }
          } catch (spotifyErr) {
            console.warn("Could not load Spotify artist data:", spotifyErr);
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
    return (
      <div className="my-6">
        <div className="mb-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center" style={{ maxWidth: "1200px", width: "100%" }}>
              <div className="relative" style={{ width: 470, height: 470, transform: "translateX(70px)" }}>
                <Skeleton className="w-full h-full rounded-full" />
              </div>
              <div className="relative ml-[-80px]" style={{ width: 480, height: 480 }}>
                <Skeleton className="w-full h-full rounded-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-3xl font-semibold mb-4 text-start">Tracks</h3>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <TrackRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
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
      
      {/* Album header replaced with VinylRecord component */}
      <div className="mb-8">
        <VinylRecord
          albumImage={album.cover_xl || album.cover_big || album.cover_medium || album.cover}
          artistImage={
            artistImage ||
            album.artist?.picture_xl ||
            album.artist?.picture_big ||
            album.artist?.picture_medium ||
            album.artist?.picture
          }
          albumTitle={album.title}
          artistName={album.artist?.name || "Unknown Artist"}
        />
      </div>
      
      {/* Track listing */}
      <div className="mb-8">
        <h3 className="text-3xl font-semibold mb-4 text-start">Tracks</h3>
        
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 border-b border-muted/30 pb-2 mb-2 text-muted text-sm">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5 text-start">Title</div>
          <div className="col-span-4 text-start">Artist</div>
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
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className={`grid grid-cols-12 items-center py-2 px-2 rounded-md glass-hover transition-all ${
                  currentlyPlaying === track.id ? 'glass' : ''
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
                <div className="col-span-11 md:col-span-5 text-white font-medium truncate pl-2 md:pl-0 text-start">
                  {track.name}
                </div>
                
                {/* Artist - Only visible on md and up */}
                <div className="hidden md:block col-span-4 text-accent text-sm truncate text-start">
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
          <div className="glass rounded-lg p-4 md:p-6 relative overflow-hidden shadow-lg">
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
                  
                  {spotifyArtistData?.followers?.total > 0 && (
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-muted text-sm">Spotify Followers</span>
                      <span className="text-white text-xl font-semibold">
                        {spotifyArtistData.followers.total >= 1000000
                          ? `${(spotifyArtistData.followers.total / 1000000).toFixed(1)}M`
                          : spotifyArtistData.followers.total >= 1000
                          ? `${(spotifyArtistData.followers.total / 1000).toFixed(0)}K`
                          : spotifyArtistData.followers.total}
                      </span>
                    </div>
                  )}
                  
                  {album.artist.nb_album > 0 && (
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-muted text-sm">Albums</span>
                      <span className="text-white text-xl font-semibold">{album.artist.nb_album}</span>
                    </div>
                  )}
                  
                  {spotifyArtistData?.popularity > 0 && (
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-muted text-sm">Spotify Popularity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] bg-muted/30 rounded-full h-2">
                          <div 
                            className="bg-spotify h-2 rounded-full" 
                            style={{ width: `${spotifyArtistData.popularity}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-semibold">{spotifyArtistData.popularity}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Genres from Spotify */}
                {spotifyArtistData?.genres && spotifyArtistData.genres.length > 0 && (
                  <div className="mb-4">
                    <span className="text-muted text-sm">Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {spotifyArtistData.genres.slice(0, 5).map((genre, index) => (
                        <span 
                          key={index}
                          className="bg-primary-light/50 text-white text-xs px-3 py-1 rounded-full border border-muted/30"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
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