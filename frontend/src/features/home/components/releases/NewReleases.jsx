import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import NewReleasesLoading from './NewReleasesLoading';
import NewReleasesError from './NewReleasesError';
import NewReleasesEmpty from './NewReleasesEmpty';
import NewReleasesList from './NewReleasesList';
import { spotifyService } from '../../../../services/spotifyServices';

export default function NewReleases() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const parseReleaseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
  };

  const filterCurrentYear = (albums) => {
    const sorted = [...albums].sort((a, b) => {
      const aDate = parseReleaseDate(a.releaseDate)?.getTime() || 0;
      const bDate = parseReleaseDate(b.releaseDate)?.getTime() || 0;
      return bDate - aDate;
    });
    const currentYearAlbums = sorted.filter((album) => {
      const date = parseReleaseDate(album.releaseDate);
      return date && date.getFullYear() === currentYear;
    });
    return { currentYearAlbums, sorted };
  };

  const isRateLimitError = (error) => {
    const message = String(error?.message || '');
    return error?.status === 429 || message.includes('Rate limit exceeded');
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchNewReleasesPage = async (limit, offset, attempts = 2) => {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await spotifyService.getNewReleases(limit, offset);
      } catch (error) {
        lastError = error;
        if (!isRateLimitError(error)) {
          throw error;
        }
        const retrySeconds = Number(error?.retryAfter || 1);
        await sleep(Math.max(1, retrySeconds) * 1000);
      }
    }
    throw lastError;
  };

  const fetchNewReleases = async () => {
    const allItems = [];
    const pageSize = 50;
    const maxPages = 3;

    for (let page = 0; page < maxPages; page += 1) {
      const response = await fetchNewReleasesPage(pageSize, page * pageSize);
      const items = response?.albums?.items || [];
      if (!items.length) break;
      allItems.push(...items);

      const { currentYearAlbums } = filterCurrentYear(
        items.map((item) => ({
          id: item.id,
          title: item.name,
          artist: item.artists?.[0]?.name || 'Unknown Artist',
          coverArt: item.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Image",
          releaseDate: item.release_date,
          link: item.external_urls?.spotify || "",
        }))
      );
      if (currentYearAlbums.length >= 20) break;
    }

    if (allItems.length === 0) {
      throw new Error('No new releases available');
    }

    const newReleases = allItems.map((item) => ({
      id: item.id,
      title: item.name,
      artist: item.artists?.[0]?.name || 'Unknown Artist',
      coverArt: item.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Image",
      releaseDate: item.release_date,
      link: item.external_urls?.spotify || "",
    }));

    const { currentYearAlbums, sorted } = filterCurrentYear(newReleases);
    return {
      albums: currentYearAlbums.length > 0 ? currentYearAlbums : sorted,
      source: 'spotify'
    };
  };

  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['new-releases'],
    queryFn: fetchNewReleases,
    retry: false
  });

  const albums = data?.albums || [];
  const source = data?.source || 'deezer';

  // Removed unused handleAlbumClick

  // While loading, show spinner
  if (isLoading) {
    return <NewReleasesLoading />;
  }

  // Only show error if we have an actual error
  if (error) {
    return <NewReleasesError message={error?.message || 'Failed to fetch new releases'} />;
  }

  // Only show "no releases" if we're not loading, have no error, but albums array is empty
  if (albums.length === 0) {
    return <NewReleasesEmpty />;
  }

  // Render albums when we have them
  const handleAlbumClick = (album) => {
    const isDeezerId = typeof album.id === 'number' || /^\d+$/.test(String(album.id));
    if (isDeezerId) {
      navigate(`/album/${album.id}`);
    } else {
      navigate(`/search?query=${encodeURIComponent(album.title)}`);
    }
  };

  return (
    <NewReleasesList
      albums={albums}
      source={source}
      onAlbumClick={handleAlbumClick}
    />
  );
}
