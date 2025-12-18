import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../../../services/spotifyAuthService';
import { getAccessToken } from '../../../utils/tokenStorage';
import genreService from '../../../services/genreService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Checking authentication...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if we already have a token
        const existingToken = getAccessToken();
        if (existingToken) {
          setStatus('Already authenticated, redirecting...');
          setTimeout(() => navigate('/home'), 500);
          return;
        }
        
        // Get the code from URL parameters
        const code = searchParams.get('code');
        
        if (!code) {
          const errorMsg = searchParams.get('error') || 'No authorization code found';
          console.error('Auth error:', errorMsg);
          setError(errorMsg);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Exchange code for token
        setStatus('Exchanging authorization code...');
        await exchangeCodeForToken(code);
        
        // Generate user genres in background
        setStatus('Setting up your account...');
        genreService.generateUserGenresInBackground();
        
        // Success! Redirect to home
        setStatus('Success! Opening app...');
        setTimeout(() => navigate('/home'), 500);
      } catch (error) {
        console.error('Authentication failed:', error);
        const errorMsg = error.message || 'Authentication failed. Please try again.';
        setError(errorMsg);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuth();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800">
        <div className="text-center bg-white p-8 rounded-lg shadow-2xl max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800">
      <div className="text-center bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-lg shadow-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold mb-2 text-white">{status}</h1>
        <p className="text-gray-200">Please wait...</p>
      </div>
    </div>
  );
}
