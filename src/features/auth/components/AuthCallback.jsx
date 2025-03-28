import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../../../services/spotifyAuthService';
import { getAccessToken } from '../../../utils/tokenStorage';
import genreService from '../../../services/genreService'; // Import genre service

// Function to get the access code from localStorage
const getAccessCode = () => {
  const code = localStorage.getItem('spotify_auth_code');
  // Remove the code from localStorage after reading it
  if (code) {
    localStorage.removeItem('spotify_auth_code');
  }
  return code;
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if we already have a token
        const token = getAccessToken();
        if (token) {
          navigate('/home');
          return;
        }
        
        // Get the code from localStorage (that was stored by callback.html)
        const code = getAccessCode();
        
        if (!code) {
          setError('No authorization code found');
          navigate('/login');
          return;
        }
        
        // Exchange the code for tokens and fetch user profile
        await exchangeCodeForToken(code);
        
        // Trigger genre generation in background
        genreService.generateUserGenresInBackground();
        
        // Redirect to homepage after successful authentication
        const redirectTo = '/home';
        localStorage.removeItem('app_redirect_location');
        navigate(redirectTo);
      } catch (error) {
        console.error('Authentication failed:', error);
        setError('Authentication failed');
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <h1 className="text-xl font-semibold mb-2">Authentication Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Authenticating...</h1>
        <p>Please wait while we log you in</p>
      </div>
    </div>
  );
}
