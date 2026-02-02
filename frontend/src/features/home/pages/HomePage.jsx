import { useState, useEffect } from 'react';
import FeaturedPlaylists from '../components/FeaturedPlaylists';
import FeaturedGenres from '../components/FeaturedGenres';
import TopAlbums from '../components/TopAlbums';
import TrendingSongs from '../components/TrendingSongs';
import TopArtists from '../components/TopArtists';
import NewReleases from '../components/NewReleases';
import AIRecommendations from '../../library/components/AIRecommendations';
// import { spotifyService } from '../../../services/spotifyServices';
import { getAccessToken } from '../../../utils/tokenStorage';


export default function HomePage() {
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated with Spotify
    const checkSpotifyAuth = () => {
      const hasToken = getAccessToken() !== null;
      setIsSpotifyAuthenticated(hasToken);
    };
    
    checkSpotifyAuth();
    
    // Set up listener for auth changes
    window.addEventListener('storage', checkSpotifyAuth);
    
    return () => {
      window.removeEventListener('storage', checkSpotifyAuth);
    };
  }, []);

  return (
    <div>
      {/* Only show AI Recommendations when authenticated with Spotify */}
      {isSpotifyAuthenticated && (
        <AIRecommendations mode="single" />
      )}

      {isSpotifyAuthenticated ? (
        <>
          <TrendingSongs />
          <TopAlbums />
          <TopArtists />
          <NewReleases />
          {/* <FeaturedGenres /> */}
          <FeaturedPlaylists />
        </>
      ) : (
        <div className="border-muted border rounded-lg p-6 text-center mb-10">
          <p className="text-muted">Connect your Spotify account to view charts.</p>
        </div>
      )}
    </div>
  );
}
