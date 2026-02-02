import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deezerService } from '../../../services/deezerServices';
import { spotifyService } from '../../../services/spotifyServices';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function TopArtists({ useSpotify = false }) {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      try {
        setLoading(true);

        if (useSpotify) {
          try {
            const chartTracks = await spotifyService.getTrendingTracks(50);
            const items = chartTracks?.items || [];
            if (items.length > 0) {
              const artistCounts = new Map();
              items.forEach((item) => {
                const track = item?.track || item;
                track?.artists?.forEach((artist) => {
                  if (!artist) return;
                  const count = artistCounts.get(artist.id) || { ...artist, count: 0 };
                  count.count += 1;
                  artistCounts.set(artist.id, count);
                });
              });

              const sortedArtists = Array.from(artistCounts.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);

              const formattedArtists = sortedArtists.map(artist => ({
                id: artist.id,
                name: artist.name,
                picture: artist.images?.[0]?.url,
                fans: artist.followers?.total || 0,
                albums: 0,
                position: 0,
                link: artist.external_urls?.spotify,
                source: 'spotify'
              }));

              if (formattedArtists.length > 0) {
                setArtists(formattedArtists);
                setError('');
                return;
              }
            }
            throw new Error('No Spotify top artists available');
          } catch (spotifyError) {
            setError(spotifyError.message || 'Could not load Spotify top artists');
            return;
          }
        }

        const response = await deezerService.getTrendingArtists(20); 

        if (response && response.data) {
          const formattedArtists = response.data.map(artist => ({
            id: artist.id,
            name: artist.name,
            picture: artist.picture_big || artist.picture_medium || artist.picture,
            fans: artist.nb_fan || 0,
            albums: artist.nb_album || 0,
            position: artist.position || 0,
            link: artist.link,
            source: 'deezer'
          }));

          setArtists(formattedArtists);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to load trending artists:', err);
        setError('Could not load trending artists');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingArtists();
  }, [useSpotify]);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Artists</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading trending artists...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || artists.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Artists</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-4">{error || 'No trending artists available'}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableSection title="Trending Artists">
      <div className="flex space-x-2 pb-1">
        {artists.map((artist) => (
          <div 
            key={artist.id} 
            className="flex-shrink-0 w-32 sm:w-40 md:w-42 lg:w-48 overflow-hidden cursor-pointer group relative border-muted glass-hover transition-all"
            onClick={() => {
              if (artist.source === 'spotify' && artist.link) {
                window.open(artist.link, '_blank', 'noopener,noreferrer');
              } else {
                navigate(`/artist/${artist.id}`);
              }
            }}
            style={{ aspectRatio: '1.6/1.7' }}
          >
            {/* Blurred background image */}
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                style={{ backgroundImage: `url(${artist.picture})` }}
              ></div>
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            
            {/* Card content with circular image */}
            <div className="relative h-full flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative mb-3 border-2 border-white overflow-hidden rounded-full">
                <img 
                  src={artist.picture}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
                {/* Removed hover icon overlay for cleaner internal navigation */}
              </div>
              
              <div className="text-center mt-1 z-10">
                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg truncate drop-shadow">{artist.name}</h3>
                {artist.fans > 0 && (
                  <p className="text-[10px] sm:text-xs text-white mt-0.5 drop-shadow-lg">
                    {artist.fans.toLocaleString()} fans
                  </p>
                )}
                
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollableSection>
  );
}