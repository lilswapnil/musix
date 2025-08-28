import { useState, useEffect } from 'react';
import FeaturedPlaylists from '../components/FeaturedPlaylists';
import FeaturedGenres from '../components/FeaturedGenres';
import TopAlbums from '../components/TopAlbums';
import TrendingSongs from '../components/TrendingSongs';
import TopArtists from '../components/TopArtists';
import NewReleases from '../components/NewReleases';
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
      {/* These components use Deezer API and don't require Spotify auth */}
      <TrendingSongs /> 
      <TopAlbums />
      <TopArtists />
      
      {/* Only show Spotify-dependent components when authenticated */}
      {isSpotifyAuthenticated && (
        <>
          <NewReleases />
          {/* <FeaturedGenres /> */}
        </>
      )}

      <FeaturedPlaylists />
    </div>
  );
}
