import React, { useState, useEffect } from "react";
import useAudioPlayer from '../../../hooks/useAudioPlayer';
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { spotifyService } from "../../../services/spotifyServices";
import { geniusService } from "../../../services/geniusService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import SongErrorState from "../components/song/SongErrorState";
import SongBackground from "../components/song/SongBackground";
import SongHeroSection from "../components/song/SongHeroSection";
import SongLyricsBanner from "../components/song/SongLyricsBanner";
import SongExternalLinks from "../components/song/SongExternalLinks";
import SongLoading from "../components/song/SongLoading";

const isDeezerId = (value) => /^\d+$/.test(String(value || ""));

export default function Songs() {
  const { songId } = useParams();
  const [song, setSong] = useState(null);
  const [geniusSong, setGeniusSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();
  const {
    // audioRef,
    isPlaying,
    handlePlayPause,
    // setIsPlaying
  } = useAudioPlayer();
  
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
        
        const useDeezer = isDeezerId(songId);
        let processedSong = null;

        if (useDeezer) {
          const songData = await deezerService.getTrack(songId);

          if (!songData) {
            setError("Song not found");
            return;
          }

          processedSong = {
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

          // Get artist details if available (Deezer only)
          if (songData.artist && songData.artist.id) {
            try {
              await deezerService.getArtist(songData.artist.id);
              // setArtist removed (artist state not used)
            } catch (artistErr) {
              console.warn('Could not fetch artist details:', artistErr);
            }
          }
        } else {
          const spotifyTrack = await spotifyService.getTrack(songId);

          if (!spotifyTrack) {
            setError("Song not found");
            return;
          }

          const albumImages = spotifyTrack.album?.images || [];
          const albumImage =
            albumImages[0]?.url || albumImages[1]?.url || albumImages[2]?.url;
          const primaryArtist = spotifyTrack.artists?.[0];

          processedSong = {
            id: spotifyTrack.id,
            name: spotifyTrack.name,
            artist: primaryArtist?.name,
            artistId: primaryArtist?.id,
            album: spotifyTrack.album?.name,
            albumId: spotifyTrack.album?.id,
            albumArt: albumImage,
            duration: Math.round((spotifyTrack.duration_ms || 0) / 1000),
            previewUrl: spotifyTrack.preview_url,
            releaseDate: spotifyTrack.album?.release_date,
            link: spotifyTrack.external_urls?.spotify,
            rank: null
          };
        }
        
        setSong(processedSong);

        // Try to find song on Genius for lyrics link
        if (geniusService.isConfigured()) {
          try {
            const geniusResult = await geniusService.findSong(
              processedSong.name, 
              processedSong.artist
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
    
    // Cleanup handled by useAudioPlayer
  }, [songId]);
  
  // Wrapper for useAudioPlayer to play/pause this song
  const handleSongPlayPause = () => {
    if (!song || !song.previewUrl) return;
    handlePlayPause(song.id, song.previewUrl);
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
    return <SongLoading />;
  }
  
  // If there was an error, show error message
  if (error) {
    return <SongErrorState message={error} onGoBack={handleGoBack} />;
  }
  
  // If song data hasn't loaded, show message
  if (!song) {
    return <SongErrorState message="Song not found" onGoBack={handleGoBack} />;
  }

  return (
    <div className="mt-1 relative">
      <SongBackground albumArt={song.albumArt} />

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

        <SongHeroSection
          song={song}
          isPlaying={isPlaying}
          liked={liked}
          onPlayPause={handleSongPlayPause}
          onLike={handleLike}
          onArtistClick={handleArtistClick}
          onAlbumClick={handleAlbumClick}
          formatTime={formatTime}
        />

        <SongLyricsBanner geniusSong={geniusSong} />

        <SongExternalLinks
          song={song}
          geniusSong={geniusSong}
          showGeniusSearchLink={geniusService.isConfigured()}
        />
      </div>
    </div>
  );
}