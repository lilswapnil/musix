import FeaturedPlaylists from '../components/FeaturedPlaylists';
import FeaturedGenres from '../components/FeaturedGenres';
import TopAlbums from '../components/TopAlbums';
import TrendingSongs from '../components/TrendingSongs';
import TopArtists from '../components/TopArtists';


export default function HomePage() {
  return (
    <div>
      {/* <NewReleases /> */}
      
      <TrendingSongs /> 
      <TopAlbums />
      <TopArtists />
      <FeaturedGenres />
      <FeaturedPlaylists />
    </div>
  );
}
