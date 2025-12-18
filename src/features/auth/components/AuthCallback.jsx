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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary to-primary-dark">
        <div className="text-center bg-primary-light p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-2 text-white">Authentication Error</h1>
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary to-primary-dark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2 text-white">Authenticating...</h1>
        <p className="text-muted">Please wait while we log you in</p>
      </div>
    </div>
  );
}
