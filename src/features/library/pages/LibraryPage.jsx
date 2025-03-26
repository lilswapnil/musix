import React, { useState, useEffect } from 'react';
import RecentPlayed from '../components/RecentPlayed'
import CurrentlyPlaying from '../components/CurrentlyPlaying'
import SavedAlbums from '../components/SavedAlbums'
import { getAccessToken } from '../../../utils/tokenStorage';
import { useNavigate } from 'react-router-dom';

export default function LibraryPage() {
  const [token, setToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verify token once at the page level instead of in each component
    const accessToken = getAccessToken();
    if (accessToken) {
      setToken(accessToken);
    } else {
      setTokenError('Authentication required to view library content');
      
      // Only redirect to login if there's truly no token
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [navigate]);
  
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
  
  return (
    <>
      <CurrentlyPlaying token={token} />
      {/* <SavedAlbums token={token} /> */}
      <RecentPlayed token={token} />
    </>
  );
}
