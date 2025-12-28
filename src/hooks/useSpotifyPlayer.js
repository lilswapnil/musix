import { useState, useEffect, useCallback } from 'react';
import { spotifyService } from '../services/spotifyServices';

/**
 * Hook for Spotify player functionality
 */
export function useSpotifyPlayer() {
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  
  // Initialize player
  useEffect(() => {
    let mounted = true;
    
    const initPlayer = async () => {
      try {
        // Check if user has premium
        console.log('Checking Spotify premium status...');
        const hasPremium = await spotifyService.isPremiumAccount();
        console.log('Premium status result:', hasPremium);
        
        if (mounted) setIsPremium(hasPremium);
        
        // Initialize the player with state change callback
        const success = await spotifyService.initializePlayer((state) => {
          if (!mounted) return;
          
          // Update track info
          if (state.track_window?.current_track) {
            setCurrentTrack({
              id: state.track_window.current_track.id,
              name: state.track_window.current_track.name,
              artists: state.track_window.current_track.artists.map(a => a.name).join(', '),
              albumName: state.track_window.current_track.album.name,
              albumImage: state.track_window.current_track.album.images[0]?.url,
              durationMs: state.duration
            });
          }
          
          setIsPlaying(!state.paused);
        });
        
        if (mounted) {
          setIsReady(success);
          if (!success) setPlayerError('Failed to initialize Spotify player');
        }
      } catch (error) {
        // Silently handle errors in player init
        if (mounted) {
          setPlayerError(null);
        }
      }
    };
    
    if (spotifyService.isLoggedIn()) {
      initPlayer();
    } else {
      setPlayerError('Login required for playback');
    }
    
    return () => {
      mounted = false;
      spotifyService.disconnectPlayer();
    };
  }, []);
  
  // Player control methods
  const playTrack = useCallback(async (trackUri, options = {}) => {
    try {
      setPlayerError(null);
      await spotifyService.play(trackUri, options);
    } catch (error) {
      console.error('Error playing track:', error);
      setPlayerError('Failed to play track: ' + error.message);
    }
  }, []);
  
  const pause = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.pause();
    } catch (error) {
      console.error('Error pausing track:', error);
      setPlayerError('Failed to pause: ' + error.message);
    }
  }, []);
  
  const resume = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.resume();
    } catch (error) {
      console.error('Error resuming track:', error);
      setPlayerError('Failed to resume: ' + error.message);
    }
  }, []);
  
  const togglePlay = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.togglePlayPause();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setPlayerError('Failed to toggle playback: ' + error.message);
    }
  }, []);
  
  const seekToPosition = useCallback(async (positionMs) => {
    try {
      setPlayerError(null);
      await spotifyService.seekToPosition(positionMs);
    } catch (error) {
      console.error('Error seeking:', error);
      setPlayerError('Failed to seek: ' + error.message);
    }
  }, []);

  const skipToNext = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.skipToNext();
    } catch (error) {
      // Silently ignore errors
    }
  }, []);

  const skipToPrevious = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.skipToPrevious();
    } catch (error) {
      // Silently ignore errors
    }
  }, []);

  const setVolume = useCallback(async (volumePercent) => {
    try {
      setPlayerError(null);
      await spotifyService.setVolume(volumePercent);
    } catch (error) {
      // Silently ignore errors
    }
  }, []);
  
  return {
    isReady,
    isPremium,
    isPlaying,
    currentTrack,
    playerError,
    playTrack,
    pause,
    resume,
    togglePlay,
    seekToPosition,
    skipToNext,
    skipToPrevious,
    setVolume
  };
}