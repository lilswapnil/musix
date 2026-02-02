import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotifyService } from '../../../services/spotifyServices';
import { ensureValidToken } from '../../../utils/refreshToken';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function TopAlbums() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendingAlbums = async () => {
      try {
        setLoading(true);
        const token = await ensureValidToken();
        if (!token) {
          throw new Error('Login required to load Spotify charts');
        }

        const response = await spotifyService.getNewReleases(20);
        const items = response?.albums?.items || [];

        if (items.length > 0) {
          const formattedAlbums = items.map(album => ({
            id: album.id,
            title: album.name,
            artist: album.artists?.map((artist) => artist.name).join(', '),
            coverArt: album.images?.[0]?.url,
            releaseDate: album.release_date,
            trackCount: album.total_tracks,
            link: album.external_urls?.spotify
          }));

          setAlbums(formattedAlbums);
        } else {
          throw new Error('No trending albums available');
        }
      } catch {
        setError('Could not load trending albums');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingAlbums();
  }, []);

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
            onClick={() => navigate(`/search?query=${encodeURIComponent(album.title)}`)}
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