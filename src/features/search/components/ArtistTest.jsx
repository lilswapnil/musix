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

export default function ArtistTest() {
  const {artistId} = useParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [artistImage, setArtistImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const audioRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchArtist() {
      if (!artistId) {
        setError("No artist ID provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get artist details
        const artistData = await deezerService.getArtist(artistId);
        
        console.log("Artist data:", artistData);
        
        if (!artistData) {
          setError("Artist not found");
          return;
        }

        // Set artist data 
        setArtist(artistData);
        
        // Set artist image based on available sizes
        setArtistImage(
          artistData.picture_xl || 
          artistData.picture_big || 
          artistData.picture_medium || 
          artistData.picture
        );

        console.log("Artist name:", artistData.name);

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
          console.log(track.artist.name)
          setTracks(processedTracks);
        }
        
        // Get artist albums
        const albumsData = await deezerService.getArtistAlbums(artistId);
        
        if (albumsData && albumsData.data) {
          // Map albums to consistent format
          const processedAlbums = albumsData.data.map(album => ({
            id: album.id,
            name: album.title,
            coverArt: album.cover_medium || album.cover || "https://via.placeholder.com/300x300?text=No+Cover",
            releaseDate: album.release_date,
            trackCount: album.nb_tracks
          }));
          
          setAlbums(processedAlbums);
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

  // Handle playback, like, and navigation functions
  const handlePlayPause = (songId, previewUrl, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    // Same logic as Albums.jsx
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
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };
  
  const handleSongClick = (trackId) => {
    navigate(`/song/${trackId}`);
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

  return(
    <div className="my-6">
      {/* Back button */}
      <button 
        onClick={handleGoBack} 
        className="flex items-center text-muted hover:text-white mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Back
      </button>
      
      {/* Artist header (you can expand this later) */}
      <div className="flex flex-col md:flex-row mb-8 bg-primary-light/30 rounded-lg p-4 md:p-6 relative overflow-hidden">
        <h1 className="text-2xl font-bold text-white">{artist.name}</h1>
      </div>
      
      {/* For now just showing successful load */}
      <div className="bg-primary-light/20 p-4 rounded-md">
        <p>Artist loaded successfully! Artist ID: {artistId}</p>
        <p>Artist name: {artist.name}</p>
        <p>Number of tracks: {tracks.length}</p>
        <p>Number of albums: {albums.length}</p>
      </div>
    </div>
  );
}