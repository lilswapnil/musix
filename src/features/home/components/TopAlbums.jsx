import React, { useState, useEffect } from 'react';
import { deezerService } from '../../../services/deezerServices';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function TopAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendingAlbums = async () => {
      try {
        setLoading(true);
        const response = await deezerService.getTrendingAlbums(20); // Fetch 12 albums to match NewReleases
        
        if (response && response.data) {
          const formattedAlbums = response.data.map(album => ({
            id: album.id,
            title: album.title,
            artist: album.artist.name,
            coverArt: album.cover_big || album.cover_medium,
            releaseDate: album.release_date,
            trackCount: album.nb_tracks,
            link: album.link
          }));
          
          setAlbums(formattedAlbums);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError('Could not load trending albums');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingAlbums();
  }, []);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Albums</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading trending albums...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || albums.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Albums</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-4">{error || 'No trending albums available'}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableSection title="Trending Albums">
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div 
            key={album.id} 
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted rounded"
          >
            <div className="relative">
              <img 
                src={album.coverArt}
                alt={album.title}
                className="w-full h-32 sm:h-40 md:h-48 object-cover"
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
      {/* Closing tags */}
    </ScrollableSection>
  );
}