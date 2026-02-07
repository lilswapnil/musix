import { useState, useEffect } from 'react';
import HomeRecommendationsSection from '../components/home/HomeRecommendationsSection';
import HomeChartsSection from '../components/home/HomeChartsSection';
import HomeSpotifySection from '../components/home/HomeSpotifySection';
import HomeFeaturedPlaylistsSection from '../components/home/HomeFeaturedPlaylistsSection';
// import { spotifyService } from '../../../services/spotifyServices';
import { spotifyService } from '../../../services/spotifyServices';


export default function HomePage() {
  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated with Spotify
    const checkSpotifyAuth = () => {
      setIsSpotifyAuthenticated(spotifyService.isLoggedIn());
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
      <HomeRecommendationsSection isSpotifyAuthenticated={isSpotifyAuthenticated} />
      <HomeChartsSection />
      <HomeSpotifySection isSpotifyAuthenticated={isSpotifyAuthenticated} />
      <HomeFeaturedPlaylistsSection />
    </div>
  );
}
