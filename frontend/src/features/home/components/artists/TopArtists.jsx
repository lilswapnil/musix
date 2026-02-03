import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { deezerService } from '../../../../services/deezerServices';
import { spotifyService } from '../../../../services/spotifyServices';
import TopArtistsLoading from './TopArtistsLoading';
import TopArtistsEmpty from './TopArtistsEmpty';
import TopArtistsList from './TopArtistsList';

export default function TopArtists({ useSpotify = false }) {
  const navigate = useNavigate();
  const fetchTrendingArtists = async () => {
    if (useSpotify) {
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
          return formattedArtists;
        }
      }
      throw new Error('No Spotify top artists available');
    }

    const response = await deezerService.getTrendingArtists(20);
    if (response && response.data) {
      return response.data.map(artist => ({
        id: artist.id,
        name: artist.name,
        picture: artist.picture_big || artist.picture_medium || artist.picture,
        fans: artist.nb_fan || 0,
        albums: artist.nb_album || 0,
        position: artist.position || 0,
        link: artist.link,
        source: 'deezer'
      }));
    }
    throw new Error('Invalid response format');
  };

  const {
    data: artists = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['top-artists', useSpotify],
    queryFn: fetchTrendingArtists
  });

  if (isLoading) {
    return <TopArtistsLoading />;
  }

  if (error || artists.length === 0) {
    return <TopArtistsEmpty message={error?.message || 'No trending artists available'} />;
  }

  const handleArtistClick = (artist) => {
    if (artist.source === 'spotify' && artist.link) {
      window.open(artist.link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/artist/${artist.id}`);
    }
  };

  return <TopArtistsList artists={artists} onArtistClick={handleArtistClick} />;
}