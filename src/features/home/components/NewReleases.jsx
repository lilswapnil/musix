import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { deezerService } from '../../../services/deezerServices';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
// Removed unused getAccessToken
import { ensureValidToken } from '../../../utils/refreshToken';

export default function NewReleases() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('deezer');

  useEffect(() => {
    // Add retry mechanism for rate limiting
    const fetchWithRetry = async (fetchFunc, maxRetries = 3, delay = 6000) => {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          return await fetchFunc();
        } catch (err) {
          if (err.message && err.message.includes('Rate limit exceeded') && retries < maxRetries - 1) {
            console.log(`Rate limited, retrying in ${delay / 1000}s... (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
          } else {
            throw err;
          }
        }
      }
    };

    const fetchNewReleases = async () => {
      try {
        setLoading(true);
        console.log('Attempting to fetch new releases...');
        let newReleases = [];

        // Try Spotify first if possible
        try {
          // Get a valid token, refresh if necessary
          const token = await ensureValidToken();

          if (token) {
            console.log('Valid Spotify token available, fetching from Spotify API');

            // Use axios instead of fetch
            const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
              params: {
                limit: 20,
                country: 'US'
              },
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (response.data && response.data.albums && response.data.albums.items) {
              console.log(`Successfully fetched ${response.data.albums.items.length} new releases from Spotify`);

              // Map Spotify data to our format
              newReleases = response.data.albums.items.map((item) => ({
                id: item.id,
                title: item.name,
                artist: item.artists[0].name,
                coverArt: item.images[0]?.url || "https://via.placeholder.com/300x300?text=No+Image",
                releaseDate: item.release_date,
                link: item.external_urls?.spotify || "",
              }));
              setSource('spotify');
            }
          } else {
            console.log('No valid Spotify token, will fall back to Deezer');
          }
        } catch (spotifyErr) {
          console.warn('Failed to fetch from Spotify:', spotifyErr);
        }

        // If Spotify didn't work or didn't return results, use Deezer with retry
        if (newReleases.length === 0) {
          console.log('Falling back to Deezer for new releases');
          try {
            // Use the retry mechanism for Deezer calls
            const deezerResponse = await fetchWithRetry(
              () => deezerService.getTrendingAlbums(20)
            );

            if (deezerResponse && deezerResponse.data && deezerResponse.data.length > 0) {
              console.log(`Successfully fetched ${deezerResponse.data.length} new releases from Deezer`);

              // Map Deezer data to our format
              newReleases = deezerResponse.data.map(album => ({
                id: album.id,
                title: album.title,
                artist: album.artist.name,
                coverArt: album.cover_big || album.cover_medium,
                releaseDate: album.release_date,
                link: album.link,
              }));
              setSource('deezer');
            }
          } catch (deezerErr) {
            console.error('Deezer fallback also failed after retries:', deezerErr);
            throw new Error('Could not load new releases from any source');
          }
        }

        if (newReleases.length > 0) {
          setAlbums(newReleases);
          setError(null);
        } else {
          setError('No new releases available');
        }
      } catch (err) {
        console.error('Error fetching new releases:', err);
        setError(`Failed to fetch new releases: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  // Removed unused handleAlbumClick

  // While loading, show spinner
  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading new releases...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only show error if we have an actual error
  if (error) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // Only show "no releases" if we're not loading, have no error, but albums array is empty
  if (albums.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-muted mb-4">No new releases available</p>
        </div>
      </div>
    );
  }

  // Render albums when we have them
  return (
    <ScrollableSection title={
      <div className="flex items-center justify-between w-full pr-2">
        <h2 className="text-3xl font-bold">New Releases</h2>
        <span className="text-xs text-muted">via {source === 'spotify' ? 'Spotify' : 'Deezer'}</span>
      </div>
    }>
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div
            key={album.id}
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted rounded"
            onClick={() => {
              // If album source was Deezer (IDs match), open album page; else use search fallback
              const isDeezerId = typeof album.id === 'number' || /^\d+$/.test(String(album.id));
              if (isDeezerId) {
                navigate(`/album/${album.id}`);
              } else {
                navigate(`/search?query=${encodeURIComponent(album.title)}`);
              }
            }}
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
    </ScrollableSection>
  );
}
