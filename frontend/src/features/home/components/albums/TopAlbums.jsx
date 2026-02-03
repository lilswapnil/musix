import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { deezerService } from '../../../../services/deezerServices';
import { spotifyService } from '../../../../services/spotifyServices';
import TopAlbumsLoading from './TopAlbumsLoading';
import TopAlbumsEmpty from './TopAlbumsEmpty';
import TopAlbumsList from './TopAlbumsList';

export default function TopAlbums({ useSpotify = false }) {
  const navigate = useNavigate();
  const fetchTrendingAlbums = async () => {
    if (useSpotify) {
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
          return spotifyAlbums;
        }
      }
      throw new Error('No Spotify top albums available');
    }

    const response = await deezerService.getTrendingAlbums(20);
    if (response && response.data) {
      return response.data.map(album => ({
        id: album.id,
        title: album.title,
        artist: album.artist.name,
        coverArt: album.cover_big || album.cover_medium,
        releaseDate: album.release_date,
        trackCount: album.nb_tracks,
        link: album.link,
        source: 'deezer'
      }));
    }
    throw new Error('Invalid response format');
  };

  const {
    data: albums = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['top-albums', useSpotify],
    queryFn: fetchTrendingAlbums
  });

  if (isLoading) {
    return <TopAlbumsLoading />;
  }

  if (error || albums.length === 0) {
    return <TopAlbumsEmpty message={error?.message || 'No trending albums available'} />;
  }

  const handleAlbumClick = (album) => {
    if (album.source === 'spotify' && album.link) {
      window.open(album.link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/album/${album.id}`);
    }
  };

  return <TopAlbumsList albums={albums} onAlbumClick={handleAlbumClick} />;
}