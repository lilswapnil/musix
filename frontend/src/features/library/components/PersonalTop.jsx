import React, { useEffect, useState } from 'react';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { getAccessToken, removeAccessToken } from '../../../utils/tokenStorage';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from 'react-router-dom';
import { spotifyService } from '../../../services/spotifyServices';
import { deezerService } from '../../../services/deezerServices';

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
        const accessToken = getAccessToken();
        if (!accessToken) {
          setAlbumError('You need to log in to see your albums');
          setAlbumLoading(false);
          return;
        }

        const response = await fetch(
          'https://api.spotify.com/v1/me/albums?limit=50&market=from_token',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            removeAccessToken();
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error(`Error ${response.status}: Failed to fetch saved albums`);
        }

        const data = await response.json();
        const formattedAlbums = data.items.map(item => ({
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
        console.error('Error fetching saved albums:', err);
        setAlbumError('Failed to load your albums');
      } finally {
        setAlbumLoading(false);
      }
    };

    fetchUserAlbums();
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
      <ScrollableSection title="Songs">
        <div className="flex space-x-2">
          {Array.from({ length: Math.ceil(topTracks.length / 4) }).map((_, groupIndex) => {
            const groupTracks = topTracks.slice(groupIndex * 4, groupIndex * 4 + 4);
            return (
              <div
                key={groupIndex}
                className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
              >
                {groupTracks.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className="flex items-center mb-2 last:mb-0 border-muted border p-2 rounded hover:bg-opacity-90 transition-colors cursor-pointer"
                    onClick={() => { void goToSong(track); }}
                  >
                    <div className="w-12 h-12 flex-shrink-0">
                      <img
                        src={track.album?.images?.[0]?.url}
                        alt={track.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="ml-3 flex-grow min-w-0 text-start text-white">
                      <div className="font-semibold truncate">{track.name}</div>
                      <div className="text-xs truncate">
                        {track.artists?.map(a => a.name).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollableSection>

      <div className="mt-8">
        <ScrollableSection title="Artist">
          <div className="flex space-x-2 pb-1">
            {topArtists.map((artist) => (
              <div
                key={artist.id}
                className="flex-shrink-0 w-32 sm:w-40 md:w-42 lg:w-48 overflow-hidden cursor-pointer group relative border-muted glass-hover transition-all"
                onClick={() => { void goToArtist(artist); }}
                style={{ aspectRatio: '1.6/1.7' }}
              >
                {/* Blurred background image */}
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                    style={{ backgroundImage: `url(${artist.images?.[0]?.url})` }}
                  ></div>
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                </div>
                
                {/* Card content with circular image */}
                <div className="relative h-full flex flex-col items-center justify-center p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative mb-3 border-2 border-white overflow-hidden rounded-full">
                    <img 
                      src={artist.images?.[0]?.url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="text-center mt-1 z-10">
                    <h3 className="font-bold text-white text-sm sm:text-base md:text-lg truncate drop-shadow">{artist.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollableSection>
      </div>
      <div className="mt-8">
        {albumLoading ? (
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-start">Albums</h2>
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-accent">Loading your albums...</p>
              </div>
            </div>
          </div>
        ) : albumError ? (
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-start">Albums</h2>
            <div className="border-muted border rounded-lg p-6 text-center">
              <p className="text-error mb-4">{albumError}</p>
              <button 
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
                onClick={() => window.location.href = '/login'}
              >
                Log In
              </button>
            </div>
          </div>
        ) : !savedAlbums.length ? (
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-start">Albums</h2>
            <div className="border-muted border rounded-lg p-6 text-center">
              <p className="text-muted mb-4">No saved albums found</p>
              <p className="text-sm text-muted">
                Save albums on Spotify to see them here
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-4 text-start">Albums</h2>
            
            <ScrollableSection>
              <div className="flex space-x-2 pb-1">
                {savedAlbums.map((album) => (
                  <div 
                    key={album.id} 
                    className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted rounded"
                    onClick={() => { void goToAlbum(album); }}
                  >
                    <div className="relative">
                      <img 
                        src={album.coverArt}
                        alt={album.title}
                        className="w-full h-32 sm:h-40 md:h-48 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon 
                            icon={faExternalLinkAlt} 
                            className="text-white text-sm sm:text-base md:text-xl"
                          />
                        </div>
                      </div>
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
            </ScrollableSection>
          </div>
        )}
      </div>
    </div>
  );
}