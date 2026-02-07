import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken } from '../../../../services/spotifyAuthService';
import { getAccessToken, clearAuthData } from '../../../../utils/tokenStorage';
import { clearCodeVerifier } from '../../../../utils/pkceUtils';
import genreService from '../../../../services/genreService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Checking authentication...');
  const authInFlightRef = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        if (authInFlightRef.current) return;
        authInFlightRef.current = true;
        // GUARD: Detect infinite ?p= &q= parameter loop and break it
        const hasPQParams = searchParams.has('p') && searchParams.has('q') && !searchParams.get('code');
        if (hasPQParams) {
          clearCodeVerifier();
          clearAuthData();
          setError('Invalid callback URL. Please try logging in again.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

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
          // Always clear PKCE and all auth data
          clearCodeVerifier();
          clearAuthData();
          const errorMsg = searchParams.get('error') || 'No authorization code found';
          console.error('Auth error:', errorMsg);
          setError(errorMsg);
          setTimeout(() => navigate('/login', { replace: true }), 2000);
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
        clearCodeVerifier();
        clearAuthData();
        console.error('Authentication failed:', error);
        const errorMsg = error.message || 'Authentication failed. Please try again.';
        setError(errorMsg);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } finally {
        authInFlightRef.current = false;
      }
    };

    handleAuth();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary to-primary-dark">
        <div className="text-center glass p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-2 text-white">Authentication Error</h1>
          <p className="text-muted mb-4">{error}</p>
          <p className="text-sm text-muted">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary to-primary-dark">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold mb-2 text-white">{status}</h1>
        <p className="text-muted">Please wait...</p>
      </div>
    </div>
  );
}
