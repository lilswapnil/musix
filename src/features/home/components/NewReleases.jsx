import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotifyService } from '../../../services/spotifyServices';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function NewReleases() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        setLoading(true);
        console.log('Fetching new releases...');
        const response = await spotifyService.getNewReleases(20);
        console.log('Raw response:', response);
        
        if (response && response.albums && response.albums.items) {
          console.log('Albums items found, length:', response.albums.items.length);
          // Format the data to match TopAlbums structure
          const formattedAlbums = response.albums.items.map(album => ({
            id: album.id,
            title: album.name,
            artist: album.artists[0]?.name || 'Unknown Artist',
            coverArt: album.images[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image',
            releaseDate: album.release_date,
            trackCount: album.total_tracks,
            link: album.external_urls?.spotify
          }));
          
          console.log('Formatted albums:', formattedAlbums);
          console.log('Setting albums state with length:', formattedAlbums.length);
          setAlbums(formattedAlbums);
          setError(null); // Clear any existing errors
        } else {
          console.error('Response format is invalid:', response);
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching new releases:', err);
        setError('Failed to load new releases');
      } finally {
        setLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  const handleAlbumClick = (link) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

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
  console.log('Rendering albums, count:', albums.length);
  return (
    <ScrollableSection title="New Releases">
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div 
            key={album.id} 
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
            onClick={() => handleAlbumClick(album.link)}
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
  );
}