import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { youtubeService } from '../../../services/youtubeService';
import { redirectToSpotify } from '../../../services/spotifyAuthService';
import logo from '../../../assets/logo-light.svg';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    youtubeService.initClient().catch((error) => {
      console.error('Error initializing YouTube API client:', error);
    });
  }, []);

  const handleYouTubeLogin = async () => {
    try {
      const accessToken = await youtubeService.signIn();
      console.log('YouTube Access Token:', accessToken);

      // Redirect to the home page or another page
      navigate('/home');
    } catch (error) {
      console.error('YouTube Login Error:', error);
    }
  };

  const handleSpotifyLogin = () => {
    redirectToSpotify();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark flex flex-col items-center justify-center p-12">
      {/* Logo at the top */}
      <div className="mb-8 text-center">
        <img src={logo} alt="Musix" className="h-15 w-auto" />
        <p className="text-muted">Your music companion</p>
      </div>

      <div className="w-full max-w-md rounded-lg bg-primary-light p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">Unwind Yourself</h1>
          <p className="text-muted">Connect with your music.</p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            className="flex items-center justify-center rounded-lg bg-[#1DB954] p-3 text-white hover:bg-[#1DB954]/90 transition-colors"
            onClick={handleSpotifyLogin}
          >
            <svg className="mr-2 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Continue with Spotify
          </button>

          <button
            className="flex items-center justify-center rounded-lg bg-[#FF0000] p-3 text-white hover:bg-[#FF0000]/90 transition-colors"
            onClick={handleYouTubeLogin}
          >
            <svg className="mr-2 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.8 8.001a2.75 2.75 0 0 0-1.936-1.945C18.2 6 12 6 12 6s-6.2 0-7.864.056A2.75 2.75 0 0 0 2.2 8.001 28.8 28.8 0 0 0 2 12a28.8 28.8 0 0 0 .2 3.999 2.75 2.75 0 0 0 1.936 1.945C5.8 18 12 18 12 18s6.2 0 7.864-.056A2.75 2.75 0 0 0 21.8 16 28.8 28.8 0 0 0 22 12a28.8 28.8 0 0 0-.2-3.999zM9.75 15V9l5.25 3-5.25 3z" />
            </svg>
            Continue with YouTube
          </button>

          <button
            className="rounded-lg border border-muted bg-transparent p-3 text-white hover:bg-muted/20 transition-colors"
            onClick={() => {
              // Set a guest flag in localStorage if needed
              localStorage.setItem('guestUser', 'true');
              navigate('/home');
            }}
          >
            Continue as Guest
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          <p>
            By logging in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted">
        <p>© {new Date().getFullYear()} Musix. All rights reserved.</p>
      </div>
    </div>
  );
}