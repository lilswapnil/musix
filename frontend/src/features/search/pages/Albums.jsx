import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { spotifyService } from "../../../services/spotifyServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Skeleton, SkeletonText, TrackRowSkeleton } from "../../../components/common/ui/Skeleton";
import AlbumVinylRecord from "../components/album/AlbumVinylRecord";
import AlbumTracksSection from "../components/album/AlbumTracksSection";
import AlbumArtistSection from "../components/album/AlbumArtistSection";
import AlbumLoading from "../components/album/AlbumLoading";
import AlbumErrorState from "../components/album/AlbumErrorState";

const isDeezerId = (value) => /^\d+$/.test(String(value || ""));


export default function Albums() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [artistImage, setArtistImage] = useState(null); // Add state for artist image
  const [loading, setLoading] = useState(true);
  const [layoutReady, setLayoutReady] = useState(false);
  const [pendingImages, setPendingImages] = useState(0);
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
        const useDeezer = isDeezerId(albumId);
        let albumData = null;
        let artistImages = [];
        let resolvedArtistImage = null;

        if (useDeezer) {
          // Get album details
          albumData = await deezerService.getAlbum(albumId);
          setAlbum(albumData);
          setLayoutReady(false);
          console.log("Album data:", albumData);
          // Fetch artist image if artist info is available
          if (albumData.artist && albumData.artist.id) {
            try {
              const artistData = await deezerService.getArtist(albumData.artist.id);
              if (artistData) {
                setArtistData(artistData); // Store the complete artist data
                const artistPicture =
                  artistData.picture_xl ||
                  artistData.picture_big ||
                  artistData.picture_medium ||
                  artistData.picture;
                if (artistPicture) {
                  resolvedArtistImage = artistPicture;
                  setArtistImage(artistPicture);
                }
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
        } else {
          const spotifyAlbum = await spotifyService.getAlbum(albumId);
          if (!spotifyAlbum) {
            setError("Album not found");
            return;
          }

          const images = spotifyAlbum.images || [];
          const primaryArtist = spotifyAlbum.artists?.[0];

          albumData = {
            id: spotifyAlbum.id,
            title: spotifyAlbum.name,
            name: spotifyAlbum.name,
            cover_xl: images[0]?.url,
            cover_big: images[1]?.url || images[0]?.url,
            cover_medium: images[2]?.url || images[1]?.url || images[0]?.url,
            cover: images[images.length - 1]?.url || images[0]?.url,
            release_date: spotifyAlbum.release_date,
            artist: primaryArtist
              ? {
                  id: primaryArtist.id,
                  name: primaryArtist.name,
                  picture_xl: null,
                  picture_big: null,
                  picture_medium: null,
                  picture: null,
                  link: primaryArtist.external_urls?.spotify,
                  nb_fan: 0,
                  nb_album: 0
                }
              : null,
            tracks: {
              data: (spotifyAlbum.tracks?.items || []).map((track, index) => ({
                id: track.id,
                title: track.name,
                artist: track.artists?.[0]?.name || primaryArtist?.name || "Unknown Artist",
                duration: Math.round((track.duration_ms || 0) / 1000),
                trackNumber: index + 1,
                preview: track.preview_url,
                link: track.external_urls?.spotify
              }))
            }
          };

          setAlbum(albumData);
          setLayoutReady(false);

          if (primaryArtist?.id) {
            try {
              const spotifyArtist = await spotifyService.getArtist(primaryArtist.id);
              if (spotifyArtist) {
                setSpotifyArtistData(spotifyArtist);
                setArtistData({
                  id: spotifyArtist.id,
                  name: spotifyArtist.name,
                  nb_fan: spotifyArtist.followers?.total || 0,
                  nb_album: 0,
                  link: spotifyArtist.external_urls?.spotify
                });

                const artistImg =
                  spotifyArtist.images?.[0]?.url ||
                  spotifyArtist.images?.[1]?.url ||
                  spotifyArtist.images?.[2]?.url;
                if (artistImg) {
                  resolvedArtistImage = artistImg;
                  setArtistImage(artistImg);
                  setAlbum((prev) =>
                    prev
                      ? {
                          ...prev,
                          artist: {
                            ...prev.artist,
                            picture_xl: artistImg,
                            picture_big: artistImg,
                            picture_medium: artistImg,
                            picture: artistImg,
                            nb_fan: spotifyArtist.followers?.total || 0
                          }
                        }
                      : prev
                  );
                }
              }
            } catch (artistErr) {
              console.warn("Could not load Spotify artist data:", artistErr);
            }
          }

          if (albumData.tracks && albumData.tracks.data) {
            const processedTracks = albumData.tracks.data.map((track, index) => ({
              id: track.id,
              name: track.title,
              artist: track.artist,
              duration: track.duration,
              trackNumber: index + 1,
              previewUrl: track.preview,
              externalUrl: track.link,
              albumArt: albumData.cover_medium || albumData.cover || "https://via.placeholder.com/300x300?text=No+Cover"
            }));
            setTracks(processedTracks);
          }
        }
        
        // Track image loading for layout readiness
        const albumImages = [
          albumData?.cover_xl,
          albumData?.cover_big,
          albumData?.cover_medium,
          albumData?.cover
        ].filter(Boolean);
        artistImages = [
          resolvedArtistImage,
          albumData?.artist?.picture_xl,
          albumData?.artist?.picture_big,
          albumData?.artist?.picture_medium,
          albumData?.artist?.picture
        ].filter(Boolean);
        const uniqueImages = Array.from(new Set([...albumImages, ...artistImages]));
        setPendingImages(uniqueImages.length);
        if (uniqueImages.length === 0) {
          setLayoutReady(true);
        } else {
          uniqueImages.forEach((src) => {
            const img = new Image();
            img.onload = () => setPendingImages(prev => Math.max(0, prev - 1));
            img.onerror = () => setPendingImages(prev => Math.max(0, prev - 1));
            img.src = src;
          });
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
  
  useEffect(() => {
    if (!loading && pendingImages === 0) {
      setLayoutReady(true);
    }
  }, [loading, pendingImages]);

  // If still loading (data or images), show spinner
  if (loading || !layoutReady) {
    return <AlbumLoading />;
  }
  
  // If there was an error, show error message
  if (error) {
    return <AlbumErrorState message={error} onGoBack={handleGoBack} />;
  }
  
  // If album data hasn't loaded, show message
  if (!album) {
    return <AlbumErrorState message="Album not found" onGoBack={handleGoBack} />;
  }

  return (
    <div className="mt-1">
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
        <AlbumVinylRecord
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
      
      <AlbumTracksSection
        tracks={tracks}
        currentlyPlaying={currentlyPlaying}
        likedSongs={likedSongs}
        onSongClick={handleSongClick}
        onPlayPause={handlePlayPause}
        onLike={handleLike}
        formatTime={formatTime}
      />

      <AlbumArtistSection
        artistData={artistData}
        album={album}
        artistImage={artistImage}
        spotifyArtistData={spotifyArtistData}
        onArtistClick={(artistId) => navigate(`/artist/${artistId}`)}
      />
    </div>
  );
}