import FeaturedPlaylists from '../components/FeaturedPlaylists';
import FeaturedGenres from '../components/FeaturedGenres';
import TopAlbums from '../components/TopAlbums';
import TrendingSongs from '../components/TrendingSongs';
import TopArtists from '../components/TopArtists';
import NewReleases from '../components/NewReleases';

export default function HomePage() {
  return (
    <div>

      <TrendingSongs /> 
      <TopAlbums />
      <NewReleases />
      <TopArtists />
      {/* <FeaturedGenres /> */}
      <FeaturedPlaylists />
    </div>
  );
}
