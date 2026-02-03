import React, { useState, useEffect } from 'react';
import { removeAccessToken } from '../../../../utils/tokenStorage';
import NowPlayingLoading from './NowPlayingLoading';
import NowPlayingError from './NowPlayingError';
import NowPlayingEmpty from './NowPlayingEmpty';
import NowPlayingCard from './NowPlayingCard';

// Update the function signature to accept token prop
export default function CurrentlyPlaying({ token }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [artistImage, setArtistImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  

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

  

  const handleLike = () => {
    setLiked(!liked);
    // Save liked status to localStorage or backend
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
    />
  );
}