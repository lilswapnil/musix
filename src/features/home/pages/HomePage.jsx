import FeaturedPlaylists from '../components/FeaturedPlaylists';
import NewReleases from '../components/NewReleases';
import TopAlbums from '../components/TopAlbums';
import TrendingSongs from '../components/TrendingSongs';
import TopArtists from '../components/TopArtists';

export default function HomePage() {
  return (
    <div>
      {/* <NewReleases /> */}
      <TopAlbums />
      <TrendingSongs /> 
      <TopArtists />
      <FeaturedPlaylists />
    </div>
  );
}
