import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '../../../services/spotifyAuthService';
import { setAccessToken, setRefreshToken } from '../../../utils/tokenStorage';
import axios from 'axios';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // First check for code in query params (PKCE flow)
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      console.log('Authorization URL:', window.location.href);
      console.log('Authorization code:', code);
      
      // Check for tokens in hash fragment (server-side flow)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('Found tokens in hash fragment');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          setAccessToken(accessToken);
          if (refreshToken) setRefreshToken(refreshToken);
          
          // Retrieve the stored location or default to '/home'
          const redirectLocation = localStorage.getItem('app_redirect_location') || '/home';
          localStorage.removeItem('app_redirect_location'); // Clean up
          
          // Clean the URL
          window.history.replaceState(null, null, ' ');
          
          navigate(redirectLocation);
          return;
        }
      }
      
      // Handle code-based auth flow
      if (code) {
        try {
          await exchangeCodeForToken(code);

          // Retrieve the stored location or default to '/home'
          const redirectLocation = localStorage.getItem('app_redirect_location') || '/home';
          localStorage.removeItem('app_redirect_location'); // Clean up
          navigate(redirectLocation);
        } catch (error) {
          console.error('Authentication failed:', error);
          navigate('/login');
        }
      } else {
        console.error('No authorization code or tokens found.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Authenticating...</h1>
        <p>Please wait while we log you in</p>
      </div>
    </div>
  );
}
