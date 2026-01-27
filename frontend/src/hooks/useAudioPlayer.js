import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * useAudioPlayer - Custom hook for audio playback and cleanup
 * @returns {Object} Audio player state and controls
 */
export default function useAudioPlayer() {
  const audioRef = useRef(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play or pause a song by id and previewUrl
  const handlePlayPause = useCallback((songId, previewUrl, event) => {
    if (event) event.stopPropagation();
    if (!previewUrl) return;

    // If clicked on currently playing song, pause it
    if (currentlyPlaying === songId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      return;
    }

    // Pause and cleanup any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Play the new song
    const audio = new Audio(previewUrl);
    audio.addEventListener('ended', () => {
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      audioRef.current = null;
    });
    audio.addEventListener('error', (e) => {
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      audioRef.current = null;
    });
    audioRef.current = audio;
    setCurrentlyPlaying(songId);
    setIsPlaying(true);
    audio.play();
  }, [currentlyPlaying]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    audioRef,
    currentlyPlaying,
    isPlaying,
    handlePlayPause,
    setCurrentlyPlaying,
    setIsPlaying,
  };
}
