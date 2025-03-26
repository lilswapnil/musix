import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../src/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../src/components/common/ui/ScrollableSection";

export default function RecentlyAdded() {
  const { token } = useAuth();
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const fetchRecentlyPlayed = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching recent tracks: ${response.status}`);
        }
        
        const data = await response.json();
        
        const formattedTracks = data.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map(artist => artist.name).join(', '),
          albumName: item.track.album.name,
          albumId: item.track.album.id,
          albumArt: item.track.album.images[0]?.url,
          externalUrl: item.track.external_urls.spotify,
          previewUrl: item.track.preview_url,
          duration: item.track.duration_ms
        }));
        
        setRecentTracks(formattedTracks);
      } catch (err) {
        console.error(err);
        setError("Failed to load recently played tracks");
      } finally {
        setLoading(false);
      }
    };
    
    // Load liked songs from localStorage
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
    
    fetchRecentlyPlayed();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [token]);

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

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recently Played</h2>
        <div className="flex justify-center items-center h-48 bg-primary-light/30 rounded-lg">
          <div className="animate-pulse">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recently Played</h2>
        <div className="bg-primary-light/30 p-6 rounded-lg text-center">
          <p className="text-error mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (recentTracks.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recently Played</h2>
        <div className="bg-primary-light/30 p-6 rounded-lg text-center">
          <p className="text-muted">No recently played tracks found</p>
        </div>
      </div>
    );
  }

  // Group tracks into chunks for horizontal display
  const groupedTracks = [];
  const chunkSize = 4;
  
  for (let i = 0; i < recentTracks.length; i += chunkSize) {
    groupedTracks.push(recentTracks.slice(i, i + chunkSize));
  }

  return (
    <ScrollableSection title="Recently Played">
      <div className="flex space-x-2">
        {groupedTracks.map((group, groupIndex) => (
          <div 
            key={groupIndex} 
            className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
          >
            {group.map((track) => (
              <div 
                key={track.id} 
                className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:bg-primary-light transition-colors cursor-pointer"
                onClick={() => window.open(track.externalUrl, '_blank')}
              >
                <div className="w-12 h-12 flex-shrink-0 relative group">
                  <img 
                    src={track.albumArt || "https://via.placeholder.com/300x300?text=No+Cover"} 
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
                
                <div className="ml-3 flex-grow min-w-0">
                  <div className="font-semibold text-white truncate">{track.name}</div>
                  <div className="text-xs text-accent truncate">{track.artist}</div>
                </div>
                
                <button 
                  className="ml-2 p-1.5 rounded-full hover:bg-muted/20 transition-colors"
                  onClick={(e) => handleLike(track.id, e)}
                  aria-label={likedSongs[track.id] ? "Unlike" : "Like"}
                >
                  <FontAwesomeIcon 
                    icon={faHeart} 
                    className={`${likedSongs[track.id] ? "text-red-500" : "text-muted"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollableSection>
  );
}