import React, { useState, useEffect } from 'react';
import { removeAccessToken } from '../../../utils/tokenStorage';
import { spotifyService } from '../../../services/spotifyServices';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause, faStepBackward, faStepForward, faExternalLinkAlt, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { Skeleton } from '../../../components/common/ui/Skeleton';

// Update the function signature to accept token prop
export default function CurrentlyPlaying({ token }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [artistImage, setArtistImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    const fetchCurrentTrack = async () => {
      try {
        // No need to check token here, it's already checked in LibraryPage
        if (!token) return;

        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            removeAccessToken();
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch currently playing track');
        }
        
        // Fix for 204 No Content response - check response status
        if (response.status === 204) {
          // No content means nothing is playing
          setCurrentTrack(null);
          setLoading(false);
          return;
        }

        // Only parse JSON if we have content
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 0) {
          const data = await response.json();
          setCurrentTrack(data.item);
          setIsPlaying(Boolean(data.is_playing));
          setProgressMs(data.progress_ms || 0);
          setDurationMs(data.item?.duration_ms || 0);
          
          // Fetch artist image
          if (data.item && data.item.artists && data.item.artists[0]) {
            try {
              const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${data.item.artists[0].id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (artistResponse.ok) {
                const artistData = await artistResponse.json();
                setArtistImage(artistData.images[0]?.url || null);
              }
            } catch (artistErr) {
              console.warn('Could not fetch artist image:', artistErr);
            }
          }
        } else {
          // Empty response but not 204
          setCurrentTrack(null);
        }
      } catch (err) {
        console.error("Error fetching current track:", err);
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentTrack();
  }, [token]);

  // Progress ticker while playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgressMs(prev => {
        const next = prev + 1000;
        return durationMs && next > durationMs ? durationMs : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  // Controller handlers
  const handleTogglePlay = async () => {
    try {
      if (isPlaying) {
        await spotifyService.pause();
        setIsPlaying(false);
      } else {
        await spotifyService.resume();
        setIsPlaying(true);
      }
    } catch (e) {
      setError(e.message || 'Playback control failed');
    }
  };

  const handleNext = async () => {
    try {
      await spotifyService.skipToNext();
      // Refresh state quickly
      setTimeout(() => {
        setLoading(true);
        setError('');
      }, 200);
    } catch (e) {
      setError(e.message || 'Failed to skip');
    }
  };

  const handlePrev = async () => {
    try {
      await spotifyService.skipToPrevious();
      setTimeout(() => {
        setLoading(true);
        setError('');
      }, 200);
    } catch (e) {
      setError(e.message || 'Failed to go back');
    }
  };

  const handleSeek = async (e) => {
    const value = Number(e.target.value);
    setProgressMs(value);
    try {
      await spotifyService.seekToPosition(value);
    } catch (err) {
      setError(err.message || 'Failed to seek');
    }
  };

  const handleVolumeChange = async (e) => {
    const value = Number(e.target.value);
    setVolume(value);
    try {
      await spotifyService.setVolume(value);
    } catch (err) {
      setError(err.message || 'Failed to set volume');
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    // Save liked status to localStorage or backend
  };

  if (loading) {
    return (
      <div className="mb-12 mt-4">
        <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
        <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg glass-card p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/3 mb-4" />
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12 mt-4">
        <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
        <div className="glass p-6 text-center rounded-lg shadow-lg">
          <p className="text-error mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
        <div className="text-center p-8 glass-light rounded-lg shadow-lg">
          <p className="text-lg text-muted">No track is currently playing.</p>
          <p className="text-sm mt-2">Play some music on Spotify!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
    <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg group">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/50">
          {(artistImage || currentTrack.album.images[0]?.url) && (
            <img 
              src={artistImage || currentTrack.album.images[0].url}
              alt={currentTrack.artists[0]?.name || currentTrack.album.name}
              className="w-full h-full object-cover opacity-50 blur-sm scale-110"
            />
          )}
        </div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-8 flex flex-col sm:flex-row">
        <div className="mx-auto sm:mx-0 mb-4 sm:mb-0 sm:mr-6 md:mr-8 flex-shrink-0">
          {currentTrack.album.images[0]?.url ? (
            <img 
              src={currentTrack.album.images[0].url}
              alt={currentTrack.album.name}
              className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 object-cover shadow-lg rounded-lg"
            />
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-primary-dark flex items-center justify-center rounded-lg">
              <FontAwesomeIcon icon={faPlay} className="text-4xl text-muted" />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-end text-center sm:text-start">
          <div>
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1">
                <h2 className="text-l sm:text-2xl md:text-3xl font-bold text-white mb-2 truncate">{currentTrack.name}</h2>
                <p className="text-lg sm:text-xl text-white/80 mb-1">{currentTrack.artists.map(artist => artist.name).join(', ')}</p>
                <p className="text-white sm:block hidden">{currentTrack.album.name}</p>
              </div>
              
              <button 
                onClick={handleLike}
                className="p-2 sm:p-3 rounded-full hover:bg-text/20 transition-colors mx-auto sm:mx-0 mt-2 sm:mt-0"
              >
                <FontAwesomeIcon 
                  icon={faHeart} 
                  className={`text-xl sm:text-2xl ${liked ? "text-red-500" : "text-white"}`}
                />
              </button>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 flex flex-col gap-3">
            {/* Transport Controls */}
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();handlePrev();}} className="p-2 rounded-full hover:bg-text/20 transition-colors">
                <FontAwesomeIcon icon={faStepBackward} className="text-white text-xl" />
              </button>
              <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();handleTogglePlay();}} className="p-3 rounded-full bg-accent hover:bg-accent/80 transition-colors">
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-white text-xl" />
              </button>
              <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();handleNext();}} className="p-2 rounded-full hover:bg-text/20 transition-colors">
                <FontAwesomeIcon icon={faStepForward} className="text-white text-xl" />
              </button>
            </div>

            {/* Seek Bar */}
            {durationMs > 0 && (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={durationMs}
                  value={progressMs}
                  onChange={handleSeek}
                  className="w-full"
                />
                <span className="text-white/80 text-sm">
                  {Math.floor(progressMs / 60000)}:{String(Math.floor((progressMs % 60000) / 1000)).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Volume */}
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faVolumeHigh} className="text-white/80" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeChange}
                className="w-48"
              />
            </div>

            <a 
              href={currentTrack.external_urls.spotify} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center bg-spotify hover:bg-spotify/80 text-white py-2 px-4 rounded-full transition-colors"
            >
              <span className="mr-2">Open in Spotify</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}