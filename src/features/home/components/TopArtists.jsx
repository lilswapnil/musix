import React, { useState, useEffect } from 'react';
import { deezerService } from '../../../services/deezerServices';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function TopArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      try {
        setLoading(true);
        const response = await deezerService.getTrendingArtists(20); 
        
        if (response && response.data) {
          const formattedArtists = response.data.map(artist => ({
            id: artist.id,
            name: artist.name,
            picture: artist.picture_big || artist.picture_medium || artist.picture,
            fans: artist.nb_fan || 0,
            albums: artist.nb_album || 0,
            position: artist.position || 0,
            link: artist.link
          }));
          
          setArtists(formattedArtists);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to load trending artists:', err);
        setError('Could not load trending artists');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrendingArtists();
  }, []);

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Artists</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading trending artists...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || artists.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Artists</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-error mb-4">{error || 'No trending artists available'}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableSection title="Trending Artists">
      <div className="flex space-x-2 pb-1">
        {artists.map((artist) => (
          <div 
            key={artist.id} 
            className="flex-shrink-0 w-32 sm:w-40 md:w-[11rem] overflow-hidden  cursor-pointer group relative border-muted hover:bg-opacity-80 transition-colors"
            onClick={() => window.open(artist.link, '_blank')}
            style={{ aspectRatio: '1.6/1.7' }}
          >
            {/* Blurred background image */}
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                style={{ backgroundImage: `url(${artist.picture})` }}
              ></div>
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            
            {/* Card content with circular image */}
            <div className="relative h-full flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative mb-3 border-2 border-white overflow-hidden rounded-full">
                <img 
                  src={artist.picture}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FontAwesomeIcon 
                    icon={faExternalLinkAlt} 
                    className="text-white text-sm sm:text-base md:text-xl"
                  />
                </div>
              </div>
              
              <div className="text-center mt-1 z-10">
                <h3 className="font-bold text-white text-xs sm:text-sm truncate drop-shadow">{artist.name}</h3>
                {artist.fans > 0 && (
                  <p className="text-[10px] sm:text-xs text-white mt-0.5 drop-shadow-lg">
                    {artist.fans.toLocaleString()} fans
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