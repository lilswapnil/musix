import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deezerService } from '../../../services/deezerServices';
import { spotifyService } from '../../../services/spotifyServices';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function TopAlbums({ useSpotify = false }) {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendingAlbums = async () => {
      try {
        setLoading(true);

        if (useSpotify) {
          try {
            const chartTracks = await spotifyService.getTrendingTracks(50);
            const items = chartTracks?.items || [];
            if (items.length > 0) {
              const albumMap = new Map();
              items.forEach((item) => {
                const track = item?.track || item;
                const album = track?.album;
                if (!album || albumMap.has(album.id)) return;
                albumMap.set(album.id, {
                  id: album.id,
                  title: album.name,
                  artist: album.artists?.map(a => a.name).join(', '),
                  coverArt: album.images?.[0]?.url,
                  releaseDate: album.release_date,
                  trackCount: album.total_tracks,
                  link: album.external_urls?.spotify,
                  source: 'spotify'
                });
              });
              const spotifyAlbums = Array.from(albumMap.values()).slice(0, 20);
              if (spotifyAlbums.length > 0) {
                setAlbums(spotifyAlbums);
                setError('');
                return;
              }
            }
            throw new Error('No Spotify top albums available');
          } catch (spotifyError) {
            setError(spotifyError.message || 'Could not load Spotify top albums');
            return;
          }
        }

        const response = await deezerService.getTrendingAlbums(20); // Fetch 12 albums to match NewReleases

        if (response && response.data) {
          const formattedAlbums = response.data.map(album => ({
            id: album.id,
            title: album.title,
            artist: album.artist.name,
            coverArt: album.cover_big || album.cover_medium,
            releaseDate: album.release_date,
            trackCount: album.nb_tracks,
            link: album.link,
            source: 'deezer'
          }));

          setAlbums(formattedAlbums);
        } else {
          throw new Error('Invalid response format');
        }
      } catch {
        setError('Could not load trending albums');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingAlbums();
  }, [useSpotify]);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Albums</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading trending albums...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || albums.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Albums</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-4">{error || 'No trending albums available'}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableSection title="Trending Albums">
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div 
            key={album.id} 
            className="flex-shrink-0 w-32 sm:w-40 md:w-42 lg:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted rounded"
            onClick={() => {
              if (album.source === 'spotify' && album.link) {
                window.open(album.link, '_blank', 'noopener,noreferrer');
              } else {
                navigate(`/album/${album.id}`);
              }
            }}
          >
            <div className="relative">
              <img 
                src={album.coverArt}
                alt={album.title}
                className="w-full h-32 sm:h-40 md:h-42 lg:h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="p-2 sm:p-3 md:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{album.title}</h3>
                <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">{album.artist}</p>
                {album.releaseDate && (
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
                    {album.releaseDate.substring(0, 4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Closing tags */}
    </ScrollableSection>
  );
}