import React, { useState, useEffect, useCallback, useRef } from 'react';
import { removeAccessToken } from '../../../../utils/tokenStorage';
import { spotifyService } from '../../../../services/spotifyServices';
import NowPlayingLoading from './NowPlayingLoading';
import NowPlayingError from './NowPlayingError';
import NowPlayingEmpty from './NowPlayingEmpty';
import NowPlayingCard from './NowPlayingCard';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

// Update the function signature to accept token prop
export default function CurrentlyPlaying({ token }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [artistImage, setArtistImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const pollRef = useRef(null);
  const lastTrackIdRef = useRef(null);
  

  const fetchCurrentTrack = useCallback(async () => {
    try {
      // No need to check token here, it's already checked in LibraryPage
      if (!token) return;

      const response = await fetch(`${BACKEND_BASE_URL}/api/spotify/me/player/currently-playing`, {
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
        setIsPlaying(false);
        setLoading(false);
        return;
      }

      // Only parse JSON if we have content
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        const data = await response.json();
        setCurrentTrack(data.item);
        setIsPlaying(Boolean(data.is_playing));
        if (data.item?.id && data.item.id !== lastTrackIdRef.current) {
          lastTrackIdRef.current = data.item.id;
          window.dispatchEvent(new CustomEvent('musix:now-playing-changed', {
            detail: { trackId: data.item.id }
          }));
        }
        
        // Fetch artist image
        if (data.item && data.item.artists && data.item.artists[0]) {
          try {
            const artistResponse = await fetch(`${BACKEND_BASE_URL}/api/spotify/artists/${data.item.artists[0].id}`, {
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
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Error fetching current track:", err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCurrentTrack();
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchCurrentTrack();
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchCurrentTrack]);

  

  const handleLike = () => {
    setLiked(!liked);
    // Save liked status to localStorage or backend
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await spotifyService.pause();
      } else {
        await spotifyService.resume();
      }
      setTimeout(() => {
        fetchCurrentTrack();
      }, 500);
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };

  const handleNext = async () => {
    try {
      await spotifyService.skipToNext();
      setTimeout(() => {
        fetchCurrentTrack();
      }, 700);
    } catch (err) {
      console.error('Error skipping to next track:', err);
    }
  };

  const handlePrevious = async () => {
    try {
      await spotifyService.skipToPrevious();
      setTimeout(() => {
        fetchCurrentTrack();
      }, 700);
    } catch (err) {
      console.error('Error skipping to previous track:', err);
    }
  };

  if (loading) {
    return <NowPlayingLoading />;
  }

  if (error) {
    return <NowPlayingError message={error} onRetry={() => window.location.reload()} />;
  }

  if (!currentTrack) {
    return <NowPlayingEmpty />;
  }

  return (
    <NowPlayingCard
      currentTrack={currentTrack}
      artistImage={artistImage}
      liked={liked}
      onLike={handleLike}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      onNext={handleNext}
      onPrevious={handlePrevious}
    />
  );
}