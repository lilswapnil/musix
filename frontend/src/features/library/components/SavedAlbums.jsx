import React, { useEffect, useState } from 'react';
import { getAccessToken, removeAccessToken } from '../../../utils/tokenStorage';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { useNavigate } from 'react-router-dom';

export default function SavedAlbums() {
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const today = new Date();

  useEffect(() => {
    const fetchUserAlbums = async () => {
      try {
        setLoading(true);
        // Get token from storage
        const accessToken = getAccessToken();
        
        if (!accessToken) {
          setError('You need to log in to see your saved albums');
          setLoading(false);
          return;
        }
        
        // Fetch saved albums directly from Spotify API
        const data = await fetchSavedAlbumsFromSpotify(accessToken);
        
        // Format albums to match TopAlbums structure
        const formattedAlbums = data.items.map(item => ({
          id: item.album.id,
          title: item.album.name,
          artist: item.album.artists.map(artist => artist.name).join(', '),
          coverArt: item.album.images[0]?.url,
          releaseDate: item.album.release_date,
          trackCount: item.album.total_tracks,
          link: item.album.external_urls.spotify,
          addedAt: item.added_at,
          spotifyId: item.album.id
        }));
        
        setSavedAlbums(formattedAlbums);
      } catch (err) {
        console.error('Error fetching saved albums:', err);
        setError('Failed to load your saved albums');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAlbums();
  }, []);

  async function fetchSavedAlbumsFromSpotify(accessToken) {
    try {
      const searchParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        }
      };

      const response = await fetch(
        'https://api.spotify.com/v1/me/albums?limit=50&market=from_token',
        searchParameters
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          removeAccessToken();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Error ${response.status}: Failed to fetch saved albums`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error in fetchSavedAlbumsFromSpotify:', err);
      throw err;
    }
  }

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Saved Albums</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading your saved albums...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Saved Albums</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
            onClick={() => window.location.href = '/login'}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!savedAlbums || savedAlbums.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Saved Albums</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-muted mb-4">No saved albums found</p>
          <p className="text-sm text-muted">
            Save albums on Spotify to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-4 text-start">Saved Albums</h2>
      
      <ScrollableSection>
        <div className="flex space-x-2 pb-1">
          {savedAlbums.map((album) => (
            <div 
              key={album.id} 
              className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted rounded"
              onClick={() => handleAlbumClick(album.id)}
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
                {/* Album metadata display */}
                <div className="text-center">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{album.title}</h3>
                  <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">{album.artist}</p>
                  {/* Only show year from full release date */}
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
  );
}