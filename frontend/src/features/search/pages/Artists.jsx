import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deezerService } from "../../../services/deezerServices";
import { spotifyService } from "../../../services/spotifyServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import ArtistHeader from "../components/artist/ArtistHeader";
import ArtistTopTracksSection from "../components/artist/ArtistTopTracksSection";
import ArtistAlbumsSection from "../components/artist/ArtistAlbumsSection";
import ArtistAllSongsSection from "../components/artist/ArtistAllSongsSection";
import ArtistErrorState from "../components/artist/ArtistErrorState";
import ArtistLoading from "../components/artist/ArtistLoading";

const isDeezerId = (value) => /^\d+$/.test(String(value || ""));

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
  const [_, setArtistList] = useState([]);
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
        
        const useDeezer = isDeezerId(artistId);

        if (useDeezer) {
          // Get artist details with better error handling
          const artistData = await deezerService.getArtist(artistId);
          if (!artistData) {
            setError("Artist not found");
            return;
          }

          console.log("Fetched artist data:", artistData);

          setArtist(artistData);

          if (artistData.artists && artistData.artists.data) {
            setArtistList(artistData.artists.data);
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
          const deezerUrl = `https://api.deezer.com/artist/${artistId}/top?limit=50&index=0`;
          
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
            console.log("Fetched all songs:", processedTracks);
            setAllSongs(processedTracks);
            setPage(2);
            setHasMoreSongs(tracksData.next || false);
          }
        } else {
          const spotifyArtist = await spotifyService.getArtist(artistId);
          if (!spotifyArtist) {
            setError("Artist not found");
            return;
          }

          const images = spotifyArtist.images || [];
          const processedArtist = {
            id: spotifyArtist.id,
            name: spotifyArtist.name,
            picture_xl: images[0]?.url,
            picture_big: images[1]?.url || images[0]?.url,
            picture_medium: images[2]?.url || images[0]?.url,
            picture: images[images.length - 1]?.url || images[0]?.url,
            nb_fan: spotifyArtist.followers?.total || 0,
            nb_album: 0,
            link: spotifyArtist.external_urls?.spotify
          };
          setArtist(processedArtist);

          const topTracksData = await spotifyService.getArtistTopTracks(artistId);
          const spotifyTracks = topTracksData?.tracks || [];
          const processedTracks = spotifyTracks.map((track, index) => ({
            id: track.id,
            name: track.name,
            artist: track.artists?.[0]?.name || spotifyArtist.name,
            albumName: track.album?.name || "Unknown Album",
            albumId: track.album?.id || null,
            duration: Math.round((track.duration_ms || 0) / 1000),
            trackNumber: index + 1,
            previewUrl: track.preview_url,
            externalUrl: track.external_urls?.spotify,
            albumArt: track.album?.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Cover"
          }));

          setTopTracks(processedTracks);
          setAllSongs(processedTracks);
          setHasMoreSongs(false);
          setPage(1);

          const spotifyAlbums = await spotifyService.apiRequest(
            `/artists/${artistId}/albums`,
            { params: { include_groups: "album,single", limit: 50, market: "US" } }
          );

          const processedAlbums = (spotifyAlbums?.items || []).map((album) => ({
            id: album.id,
            name: album.name,
            artist: album.artists?.[0]?.name || spotifyArtist.name,
            coverArt: album.images?.[0]?.url || album.images?.[1]?.url,
            releaseDate: album.release_date,
            trackCount: album.total_tracks,
            link: album.external_urls?.spotify
          }));

          setAlbums(processedAlbums);
          setArtist((prev) => ({ ...prev, nb_album: processedAlbums.length }));
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
  // Removed unused formatTime
  
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
      
      // Use the getArtistTracks method instead of direct API call
      const tracksData = await deezerService.getArtistTracks(artistId, page, 50);
      
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
    return <ArtistLoading />;
  }
  
  // If there was an error, show error message
  if (error) {
    return <ArtistErrorState message={error} onGoBack={handleGoBack} />;
  }
  
  // If artist data hasn't loaded, show message
  if (!artist) {
    return (
      <ArtistErrorState message="Artist not found" onGoBack={handleGoBack} />
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
      
      {/* Artist header with banner */}
      <ArtistHeader
        artist={artist}
        albums={albums}
        topTracks={topTracks}
        onAlbumClick={handleAlbumClick}
        formatFanCount={formatFanCount}
      />
      
      <ArtistTopTracksSection
        topTracks={topTracks}
        currentlyPlaying={currentlyPlaying}
        likedSongs={likedSongs}
        onPlayPause={handlePlayPause}
        onLike={handleLike}
        onAlbumClick={handleAlbumClick}
        onSongClick={(songId) => navigate(`/song/${songId}`)}
      />

      <ArtistAlbumsSection albums={albums} onAlbumClick={handleAlbumClick} />

      <ArtistAllSongsSection
        allSongs={allSongs}
        hasMoreSongs={hasMoreSongs}
        loadingMoreSongs={loadingMoreSongs}
        onLoadMore={loadMoreSongs}
        currentlyPlaying={currentlyPlaying}
        likedSongs={likedSongs}
        onPlayPause={handlePlayPause}
        onLike={handleLike}
        onAlbumClick={handleAlbumClick}
        onSongClick={(songId) => navigate(`/song/${songId}`)}
      />
      
    </div>
  );
}