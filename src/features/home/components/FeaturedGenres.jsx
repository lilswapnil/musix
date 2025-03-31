import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import genreService from '../../../services/genreService';

export default function FeaturedGenres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoading(true);
        
        // Get genres - returns cached or defaults immediately,
        // and triggers background generation if needed
        const recommendedGenres = await genreService.getRecommendedGenres();
        setGenres(recommendedGenres);
      } catch (err) {
        console.error('Error loading genres:', err);
        setError('Could not load genre recommendations');
      } finally {
        setLoading(false);
      }
    };
    
    loadGenres();
  }, []);

  const handleGenreClick = (genre) => {
    // Use displayName as the primary source of genre name
    const genreName = genre.displayName || genre.name;
    
    if (genreName) {
      // Pass both the URL parameter and full genre object in state
      navigate(`/genre/${encodeURIComponent(genreName)}`, { 
        state: { 
          genreName: genreName,
          genre: genre  // Pass the entire genre object for more data
        } 
      });
    } else {
      console.warn('Genre name is missing');
    }
  };

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-start">Your Genres</h2>
        <div className="flex justify-center items-center h-32 sm:h-44">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading your genres...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || genres.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-start">Your Genres</h2>
        <div className="border-muted border rounded-lg p-6 text-center">
          <p className="text-muted mb-2">{error || 'No genre data available'}</p>
          <p className="text-sm text-muted">Try listening to more music on Spotify to get personalized genres.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <ScrollableSection title="Featured Genres">
        <div className="flex space-x-2 pb-1">
          {genres.map((genre) => (
            <div 
              key={genre.id} 
              className="flex-shrink-0 w-[160px] sm:w-36 md:w-48 lg:w-46 overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => handleGenreClick(genre)}
            >
              <div className="relative h-42 sm:h-32 md:h-36 lg:h-48 lg:w-full">
                <img 
                  src={genre.imageUrl || "https://via.placeholder.com/280x280?text=Genre"}
                  alt={genre.displayName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x300?text=Genre";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex items-end">
                  <h3 className="text-white font-bold p-3 text-sm">{genre.displayName}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollableSection>
    </div>
  );
}