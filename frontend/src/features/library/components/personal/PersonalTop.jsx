import React, { useEffect, useState } from 'react';
import { removeAccessToken } from '../../../../utils/tokenStorage';
import { useNavigate } from 'react-router-dom';
import { spotifyService } from '../../../../services/spotifyServices';
import { deezerService } from '../../../../services/deezerServices';
import PersonalTopLoading from './PersonalTopLoading';
import PersonalTopError from './PersonalTopError';
import PersonalTopSongsSection from './PersonalTopSongsSection';
import PersonalTopArtistsSection from './PersonalTopArtistsSection';
import PersonalTopAlbumsSection from './PersonalTopAlbumsSection';

export default function PersonalTop() {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [albumError, setAlbumError] = useState('');
  const [albumLoading, setAlbumLoading] = useState(true);
  const navigate = useNavigate();
  const isDeezerId = (value) => {
    if (!value) return false;
    return typeof value === 'number' || /^\d+$/.test(String(value));
  };

  const goToSong = async (track) => {
    if (isDeezerId(track?.id)) {
      navigate(`/song/${track.id}`);
      return;
    }
    const artistNames = track?.artists?.map(a => a.name).join(' ') || '';
    const query = `${track?.name || ''} ${artistNames}`.trim();
    if (!query) return;
    try {
      const result = await deezerService.searchTracks(query, 1);
      const match = result?.data?.[0];
      if (match?.id) {
        navigate(`/song/${match.id}`);
      }
    } catch (err) {
      console.warn('Could not resolve song to Deezer id:', err);
    }
  };

  const goToArtist = async (artist) => {
    if (isDeezerId(artist?.id)) {
      navigate(`/artist/${artist.id}`);
      return;
    }
    if (!artist?.name) return;
    try {
      const result = await deezerService.search(artist.name, 'artist', 1);
      const match = result?.data?.[0];
      if (match?.id) {
        navigate(`/artist/${match.id}`);
      }
    } catch (err) {
      console.warn('Could not resolve artist to Deezer id:', err);
    }
  };

  const goToAlbum = async (album) => {
    if (isDeezerId(album?.id)) {
      navigate(`/album/${album.id}`);
      return;
    }
    if (!album?.title) return;
    try {
      const result = await deezerService.search(album.title, 'album', 1);
      const match = result?.data?.[0];
      if (match?.id) {
        navigate(`/album/${match.id}`);
      }
    } catch (err) {
      console.warn('Could not resolve album to Deezer id:', err);
    }
  };

  useEffect(() => {
    const fetchPersonalTop = async () => {
      try {
        setLoading(true);
        const fetchWithRetry = async (fn, retries = 3, delayMs = 1500) => {
          try {
            return await fn();
          } catch (err) {
            if (String(err?.message || '').includes('Rate limit exceeded') && retries > 0) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
              return fetchWithRetry(fn, retries - 1, delayMs);
            }
            throw err;
          }
        };

        const [tracksRes, artistsRes] = await Promise.all([
          fetchWithRetry(() =>
            spotifyService.apiRequest('/me/top/tracks', {
              params: { limit: 20, time_range: 'short_term' }
            })
          ),
          fetchWithRetry(() =>
            spotifyService.apiRequest('/me/top/artists', {
              params: { limit: 20, time_range: 'short_term' }
            })
          )
        ]);

        setTopTracks(tracksRes?.items || []);
        setTopArtists(artistsRes?.items || []);
        setError('');
      } catch (err) {
        if (String(err?.message || '').includes('Rate limit exceeded')) {
          setTimeout(fetchPersonalTop, 1500);
          return;
        }
        console.error('Failed to load personal top data:', err);
        setError('Could not load your top Spotify stats');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalTop();
  }, []);

  useEffect(() => {
    const fetchUserAlbums = async () => {
      try {
        setAlbumLoading(true);
        const data = await spotifyService.apiRequest('/me/albums', {
          params: { limit: 50, market: 'from_token' }
        });

        const formattedAlbums = (data?.items || []).map(item => ({
          id: item.album.id,
          title: item.album.name,
          artist: item.album.artists.map(artist => artist.name).join(', '),
          coverArt: item.album.images[0]?.url,
          releaseDate: item.album.release_date,
          link: item.album.external_urls.spotify
        }));

        setSavedAlbums(formattedAlbums);
        setAlbumError('');
      } catch (err) {
        if (String(err?.message || '').includes('401')) {
          removeAccessToken();
        }
        console.error('Error fetching saved albums:', err);
        setAlbumError('Failed to load your albums');
      } finally {
        setAlbumLoading(false);
      }
    };

    fetchUserAlbums();
  }, []);

  if (loading) {
    return <PersonalTopLoading />;
  }

  if (error) {
    return <PersonalTopError error={error} />;
  }

  return (
    <div className="mb-10">
      <PersonalTopSongsSection
        topTracks={topTracks}
        onSongClick={(track) => {
          void goToSong(track);
        }}
      />

      <PersonalTopArtistsSection
        topArtists={topArtists}
        onArtistClick={(artist) => {
          void goToArtist(artist);
        }}
      />

      <div className="mt-8">
        <PersonalTopAlbumsSection
          albumLoading={albumLoading}
          albumError={albumError}
          savedAlbums={savedAlbums}
          onAlbumClick={(album) => {
            void goToAlbum(album);
          }}
        />
      </div>
    </div>
  );
}