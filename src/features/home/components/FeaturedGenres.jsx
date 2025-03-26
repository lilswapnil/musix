import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spotifyService } from '../../../services/spotifyServices';
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function FeaturedGenres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserGenres = async () => {
      try {
        setLoading(true);
        
        // First check if we have a valid token
        if (!spotifyService.isLoggedIn()) {
          console.log('User not logged in, using recommended genres');
          await fetchRecommendedGenres();
          return;
        }
        
        try {
          // Step 1: Try to get the user's top artists
          const topArtists = await spotifyService.apiRequest('/me/top/artists', {
            params: { limit: 50, time_range: 'medium_term' }
          });
          
          if (topArtists && topArtists.items && topArtists.items.length > 0) {
            // Step 2: Extract and count genres from top artists
            const genreCounts = {};
            topArtists.items.forEach(artist => {
              if (artist.genres && artist.genres.length > 0) {
                artist.genres.forEach(genre => {
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
              }
            });
            
            // Step 3: Sort genres by count and take top 12
            const topGenres = Object.entries(genreCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(entry => entry[0]);
              
            // Step 4: Fetch category images for the genres
            await fetchGenreImages(topGenres);
          } else {
            // Fallback to recommended genres if no top artists
            await fetchRecommendedGenres();
          }
        } catch (topArtistsError) {
          console.error('Error fetching top artists:', topArtistsError);
          // If we get a 401 or any error, fall back to recommended genres
          await fetchRecommendedGenres();
        }
      } catch (err) {
        console.error('Error fetching user genres:', err);
        setError('Could not load your preferred genres');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch recommended genres as fallback
    const fetchRecommendedGenres = async () => {
      try {
        const availableGenres = await spotifyService.apiRequest('/recommendations/available-genre-seeds');
        if (availableGenres && availableGenres.genres) {
          // Select random 12 genres
          const randomGenres = availableGenres.genres
            .sort(() => 0.5 - Math.random())
            .slice(0, 12);
            
          await fetchGenreImages(randomGenres);
        } else {
          throw new Error('Could not retrieve genre recommendations');
        }
      } catch (error) {
        console.error('Error fetching recommended genres:', error);
        throw error;
      }
    };
    
    // Helper function to fetch category images for genres
    const fetchGenreImages = async (genreList) => {
      try {
        // Get Spotify categories (which have images)
        const categories = await spotifyService.getCategories(50);
        
        if (!categories || !categories.categories || !categories.categories.items) {
          throw new Error('No categories available');
        }
        
        // Find matching categories for our genres
        const categoryItems = categories.categories.items;
        const genresWithImages = [];
        
        // Match genres with categories and assign images
        genreList.forEach(genre => {
          // Try to find an exact match
          let match = categoryItems.find(cat => 
            cat.name.toLowerCase() === genre.toLowerCase() ||
            cat.id.toLowerCase() === genre.toLowerCase()
          );
          
          // If no exact match, try to find a partial match
          if (!match) {
            match = categoryItems.find(cat => 
              cat.name.toLowerCase().includes(genre.toLowerCase()) ||
              genre.toLowerCase().includes(cat.name.toLowerCase())
            );
          }
          
          // If we found a match, use its image
          if (match) {
            genresWithImages.push({
              id: match.id,
              name: genre,
              displayName: genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              imageUrl: match.icons[0]?.url
            });
          } else {
            // For genres without matching categories, find a random image
            const randomCategory = categoryItems[Math.floor(Math.random() * categoryItems.length)];
            genresWithImages.push({
              id: `genre-${genre.replace(/\s+/g, '-')}`,
              name: genre,
              displayName: genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              imageUrl: randomCategory.icons[0]?.url
            });
          }
        });
        
        setGenres(genresWithImages);
      } catch (error) {
        console.error('Error matching genres with images:', error);
        throw error;
      }
    };
    
    fetchUserGenres();
  }, []);

  const handleGenreClick = (genre) => {
    // Navigate to search results for this genre
    navigate(`/search?q=${encodeURIComponent(genre.name)}&type=playlist`);
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
      <ScrollableSection title="Your Favorite Genres">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-2">
          {genres.map((genre) => (
            <div 
              key={genre.id} 
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => handleGenreClick(genre)}
            >
              <img 
                src={genre.imageUrl || "https://via.placeholder.com/300x300?text=Genre"}
                alt={genre.displayName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x300?text=Genre";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex items-end">
                <h3 className="text-white font-bold p-3 text-sm sm:text-base">{genre.displayName}</h3>
              </div>
            </div>
          ))}
        </div>
      </ScrollableSection>
    </div>
  );
}