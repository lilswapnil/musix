import React, { useState, useEffect } from 'react';
import RecentPlayed from '../components/RecentPlayed';
import CurrentlyPlaying from '../components/CurrentlyPlaying';
import SavedAlbums from '../components/SavedAlbums';
import { useAuth } from '../../../context/AuthContext';
import { getAccessToken } from '../../../utils/tokenStorage';
import { ensureValidToken } from '../../../utils/refreshToken';
import { useNavigate } from 'react-router-dom';
import SpotifyPlayer from '../../../components/player/SpotifyPlayer';
import LoadingSpinner from '../../../components/common/ui/LoadingSpinner';

/**
 * Library Page Component
 * Shows user's library content - requires authentication
 */
export default function LibraryPage() {
  const [token, setToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading, authChecked } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Record that the user attempted to access the library page
    localStorage.setItem('attempted_library_access', 'true');
    
    // Wait for auth context to finish checking
    if (authLoading || !authChecked) {
      return;
    }
    
    const checkLibraryAccess = async () => {
      console.log("Checking library access, isAuthenticated:", isAuthenticated);
      setIsLoading(true);
      
      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to login");
        setTokenError('Authentication required to view library content');
        
        // Redirect to login after a short delay to show the error message
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return;
      }
      
      try {
        // Ensure we have a valid token
        const validToken = await ensureValidToken();
        if (validToken) {
          console.log("Valid token obtained for library");
          setToken(validToken);
          setTokenError(null);
        } else {
          console.log("Failed to get valid token");
          setTokenError('Authentication session expired. Please log in again.');
          
          // Redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      } catch (err) {
        console.error("Error validating token for library:", err);
        setTokenError('Error validating your session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLibraryAccess();
  }, [navigate, isAuthenticated, authLoading, authChecked]);
  
  // Show loading state while auth is being checked
  if (authLoading || isLoading) {
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
  if (tokenError) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 rounded-lg text-center my-8">
        <p className="text-error mb-2">{tokenError}</p>
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
