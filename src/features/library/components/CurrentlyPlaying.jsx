import React, { useState, useEffect } from 'react';
import { removeAccessToken } from '../../../utils/tokenStorage';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

// Update the function signature to accept token prop
export default function CurrentlyPlaying({ token }) {
  const [currentTrack, setCurrentTrack] = useState(null);
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
    return (
      <div className="mb-12 mt-4">
        <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
        <div className="relative h-80 rounded-xl overflow-hidden shadow-lg bg-primary-light flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-muted border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Checking what's playing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12 mt-4">
        <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
        <div className="bg-primary-light p-6 text-center rounded-lg">
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
        <div className="text-center p-8 bg-primary-light/30 rounded-lg">
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
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/50">
          {currentTrack.album.images[0]?.url && (
            <img 
              src={currentTrack.album.images[0].url}
              alt={currentTrack.album.name}
              className="w-full h-full object-cover opacity-50 blur-sm scale-110"
            />
          )}
        </div>
      </div>
      
      <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row">
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
          
          <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start">
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