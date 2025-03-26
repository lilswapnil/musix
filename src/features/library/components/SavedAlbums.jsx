import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { useNavigate } from 'react-router-dom';
import { spotifyService } from '../../../services/spotifyServices';

export default function SavedAlbums() {
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedAlbums = async () => {
      try {
        setLoading(true);
        
        // Get user's market for better results
        const userProfile = await spotifyService.getCurrentUser().catch(() => null);
        const market = userProfile?.country || 'US';
        
        // Make the API request following the documentation
        const response = await spotifyService.apiRequest('/me/albums', {
          params: { 
            limit: 20,
            market: market,
            offset: 0 // Starting position of results
          }
        });
        
        if (response && response.items) {
          // Set pagination info
          setTotal(response.total || 0);
          setHasMore(response.next !== null);
          
          // Format the albums for display
          const formattedAlbums = response.items.map(item => ({
            id: item.album.id,
            title: item.album.name,
            artist: item.album.artists.map(artist => artist.name).join(', '),
            coverArt: item.album.images[0]?.url,
            releaseDate: item.album.release_date,
            trackCount: item.album.total_tracks,
            spotifyUrl: item.album.external_urls.spotify,
            addedAt: item.added_at
          }));
          
          setSavedAlbums(formattedAlbums);
        } else {
          throw new Error('No saved albums found');
        }
      } catch (err) {
        // Handle specific error cases
        if (err.status === 403) {
          setError('Permission denied. Please check your Spotify account permissions.');
        } else {
          console.error('Error fetching saved albums:', err);
          setError('Could not load your saved albums');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedAlbums();
  }, []);

  // Add getSavedAlbums function to spotifyService for better reuse
  // This can be used later for pagination or viewing all albums
  const loadMoreAlbums = async () => {
    if (!hasMore) return;
    
    try {
      setLoading(true);
      const offset = savedAlbums.length;
      const userProfile = await spotifyService.getCurrentUser().catch(() => null);
      const market = userProfile?.country || 'US';
      
      const response = await spotifyService.apiRequest('/me/albums', {
        params: { 
          limit: 20,
          market: market,
          offset: offset
        }
      });
      
      if (response && response.items) {
        setHasMore(response.next !== null);
        
        const moreAlbums = response.items.map(item => ({
          id: item.album.id,
          title: item.album.name,
          artist: item.album.artists.map(artist => artist.name).join(', '),
          coverArt: item.album.images[0]?.url,
          releaseDate: item.album.release_date,
          trackCount: item.album.total_tracks,
          spotifyUrl: item.album.external_urls.spotify,
          addedAt: item.added_at
        }));
        console.log('Albums loaded:', moreAlbums);
        setSavedAlbums(prev => [...prev, ...moreAlbums]);
      }
    } catch (err) {
      console.error('Error loading more albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumClick = (albumId) => {
    navigate(`/album/${albumId}`);
  };

  if (loading && savedAlbums.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-start">Your Saved Albums</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading your albums...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || (savedAlbums.length === 0 && !loading)) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-start">Your Saved Albums</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-muted mb-4">{error || 'No saved albums found'}</p>
          <p className="text-sm text-muted">
            {!error && 'Save albums on Spotify to see them here'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableSection 
      title={
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">Your Saved Albums</h2>
          <span className="ml-2 text-sm text-muted">
            {total > 0 ? `(${total} ${total === 1 ? 'album' : 'albums'})` : ''}
          </span>
        </div>
      }
    >
      <div className="flex space-x-2 pb-1">
        {savedAlbums.map((album) => (
          <div 
            key={album.id} 
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
            onClick={() => handleAlbumClick(album.id)}
          >
            <div className="relative">
              <img 
                src={album.coverArt || "https://via.placeholder.com/300x300?text=No+Cover"}
                alt={album.title}
                className="w-full h-32 sm:h-40 md:h-48 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x300?text=No+Cover";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={faHeart} 
                    className="text-white text-sm sm:text-base md:text-xl animate-pulse"
                  />
                </div>
              </div>
              {/* Small heart badge to indicate saved status */}
              <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 flex items-center justify-center">
                <FontAwesomeIcon icon={faHeart} className="text-xs" />
              </div>
            </div>
            <div className="p-2 sm:p-3 md:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{album.title}</h3>
                <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">{album.artist}</p>
                {album.releaseDate && (
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
                    {album.releaseDate.substring(0, 4)} • {album.trackCount} tracks
                  </p>
                )}
                <p className="text-[8px] sm:text-[10px] text-muted mt-0.5">
                  Saved {new Date(album.addedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div 
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 flex items-center justify-center cursor-pointer h-32 sm:h-40 md:h-48 border border-dashed border-muted rounded-md hover:border-accent transition-colors"
            onClick={loadMoreAlbums}
          >
            <div className="text-center">
              <p className="text-muted text-xs sm:text-sm">Load More</p>
              <p className="text-muted text-xs">{total - savedAlbums.length} more</p>
            </div>
          </div>
        )}
      </div>
    </ScrollableSection>
  );
}