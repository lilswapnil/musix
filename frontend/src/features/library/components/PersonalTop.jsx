import React, { useEffect, useState } from 'react';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { spotifyService } from '../../../services/spotifyServices';

export default function PersonalTop() {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPersonalTop = async () => {
      try {
        setLoading(true);
        const [tracksRes, artistsRes] = await Promise.all([
          spotifyService.apiRequest('/me/top/tracks', {
            params: { limit: 20, time_range: 'short_term' }
          }),
          spotifyService.apiRequest('/me/top/artists', {
            params: { limit: 20, time_range: 'short_term' }
          })
        ]);

        setTopTracks(tracksRes?.items || []);
        setTopArtists(artistsRes?.items || []);
        setError('');
      } catch (err) {
        console.error('Failed to load personal top data:', err);
        setError('Could not load your top Spotify stats');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalTop();
  }, []);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Your Top Stats</h2>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-accent text-sm">Loading your top tracks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Your Top Stats</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <ScrollableSection title="Your Top Tracks">
        <div className="flex space-x-2 pb-1">
          {topTracks.map((track) => (
            <div
              key={track.id}
              className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden glass-hover transition-all cursor-pointer group border-muted rounded"
              onClick={() => window.open(track.external_urls?.spotify, '_blank', 'noopener,noreferrer')}
            >
              <div className="relative">
                <img
                  src={track.album?.images?.[0]?.url}
                  alt={track.name}
                  className="w-full h-32 sm:h-40 md:h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-2 sm:p-3 md:p-4 text-center">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{track.name}</h3>
                <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">
                  {track.artists?.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollableSection>

      <div className="mt-8">
        <ScrollableSection title="Your Top Artists">
          <div className="flex space-x-2 pb-1">
            {topArtists.map((artist) => (
              <div
                key={artist.id}
                className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden glass-hover transition-all cursor-pointer group border-muted rounded"
                onClick={() => window.open(artist.external_urls?.spotify, '_blank', 'noopener,noreferrer')}
              >
                <div className="relative">
                  <img
                    src={artist.images?.[0]?.url}
                    alt={artist.name}
                    className="w-full h-32 sm:h-40 md:h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-2 sm:p-3 md:p-4 text-center">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{artist.name}</h3>
                  {artist.followers?.total > 0 && (
                    <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">
                      {artist.followers.total.toLocaleString()} followers
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollableSection>
      </div>
    </div>
  );
}
