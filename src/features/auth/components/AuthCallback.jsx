import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../../../services/spotifyAuthService';
import { getAccessToken } from '../../../utils/tokenStorage';
import genreService from '../../../services/genreService';

const getAccessCode = () => {
  const code = localStorage.getItem('spotify_auth_code');
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
        
        await exchangeCodeForToken(code);
        genreService.generateUserGenresInBackground();
        navigate('/home');
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
