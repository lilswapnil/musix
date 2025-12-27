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
  const [volume, setVolume] = useState(50);
  const [deviceId, setDeviceId] = useState(null);
  
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
          if (!success) {
            setPlayerError('Failed to initialize Spotify player');
          } else {
            setDeviceId(spotifyService.getDeviceId?.() || null);
          }
        }
      } catch (error) {
        console.error('Error in player initialization:', error);
        if (mounted) {
          setPlayerError(error.message || 'Error initializing player');
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

  const setPlayerVolume = useCallback(async (nextVolume) => {
    try {
      const clamped = Math.max(0, Math.min(100, Number(nextVolume)));
      setVolume(clamped);
      await spotifyService.setVolume(clamped);
    } catch (error) {
      console.error('Error updating volume:', error);
      setPlayerError('Failed to set volume: ' + error.message);
    }
  }, []);

  const skipNext = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.skipToNext();
    } catch (error) {
      console.error('Error skipping track:', error);
      setPlayerError('Failed to skip: ' + error.message);
    }
  }, []);

  const skipPrevious = useCallback(async () => {
    try {
      setPlayerError(null);
      await spotifyService.skipToPrevious();
    } catch (error) {
      console.error('Error going to previous track:', error);
      setPlayerError('Failed to go back: ' + error.message);
    }
  }, []);
  
  return {
    isReady,
    isPremium,
    isPlaying,
    currentTrack,
    playerError,
    deviceId,
    volume,
    playTrack,
    pause,
    resume,
    togglePlay,
    seekToPosition,
    setPlayerVolume,
    skipNext,
    skipPrevious
  };
}