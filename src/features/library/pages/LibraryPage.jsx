import React, { useState, useEffect } from 'react';
import RecentPlayed from '../components/RecentPlayed';
import CurrentlyPlaying from '../components/CurrentlyPlaying';
import SavedAlbums from '../components/SavedAlbums';
import { useAuth } from '../../../context/AuthContext';
import { ensureValidToken } from '../../../utils/refreshToken';
import { useNavigate } from 'react-router-dom';
import SpotifyPlayer from '../../../components/player/SpotifyPlayer';
import { getAccessToken } from '../../../utils/tokenStorage';

/**
 * Library Page Component
 * Shows user's library content - requires authentication
 */
export default function LibraryPage() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setIsLoading(true);
        
        // First check directly for token, which is more reliable
        const accessToken = getAccessToken();
        if (!accessToken) {
          console.log('No access token found, redirecting to login');
          setError('Authentication required to view library content');
          
          // Store current path for redirect after login
          localStorage.setItem('app_redirect_location', '/library');
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/login');
          }, 1000);
          return;
        }
        
        // If we have a token, try to ensure it's valid
        try {
          const validToken = await ensureValidToken();
          if (validToken) {
            console.log("Valid token obtained for library");
            setToken(validToken);
            setError(null);
          } else {
            throw new Error('Failed to validate token');
          }
        } catch (tokenErr) {
          console.error("Token validation failed:", tokenErr);
          setError('Your session has expired. Please login again.');
          
          // Store current path for redirect after login
          localStorage.setItem('app_redirect_location', '/library');
          
          setTimeout(() => {
            navigate('/login');
          }, 1000);
        }
      } catch (err) {
        console.error("Error in library page:", err);
        setError(`Error loading library: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryData();
  }, [navigate]); // Remove isAuthenticated dependency
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-accent">Loading your library...</p>
        </div>
      </div>
    );
  }
  
  // Show error if there's an authentication issue
  if (error) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 rounded-lg text-center my-8">
        <p className="text-error mb-2">{error}</p>
        <button 
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
          onClick={() => navigate('/login')}
        >
          Log In
        </button>
      </div>
    );
  }
  
  // If we have a valid token, show library content
  if (token) {
    return (
      <>
        <SpotifyPlayer />
        <CurrentlyPlaying token={token} />
        <RecentPlayed token={token} />
        <SavedAlbums token={token} />
      </>
    );
  }
  
  // Fallback - should rarely be seen
  return (
    <div className="text-center my-8">
      <p>Please wait while we prepare your library...</p>
    </div>
  );
}
