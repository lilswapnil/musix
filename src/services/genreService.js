import { spotifyService } from './spotifyServices';

// Default genres to display while loading
const DEFAULT_GENRES = [
  'pop', 'hip-hop', 'rock', 'dance', 'indie', 
  'electronic', 'jazz', 'classical', 'metal',
  'blues', 'folk', 'r&b', 'country', 'alternative'
];

// Local storage keys
const GENRE_STORAGE_KEY = 'musix_user_genres';
const GENRE_TIMESTAMP_KEY = 'musix_user_genres_timestamp';
const GENRE_GENERATION_IN_PROGRESS = 'musix_genre_generation_in_progress';

// Cache expiration time (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

const genreService = {
  /**
   * Get recommended genres - returns cached genres or defaults with background refresh
   */
  getRecommendedGenres: async () => {
    // Check if we have cached genres first
    const cachedGenres = genreService.getCachedGenres();
    if (cachedGenres) {
      // If cache is valid, return it immediately
      return cachedGenres;
    }
    
    // No valid cache, return defaults and trigger refresh in background
    const defaultGenresWithImages = await genreService.getDefaultGenresWithImages();
    
    // Only trigger background refresh if not already in progress
    if (!localStorage.getItem(GENRE_GENERATION_IN_PROGRESS)) {
      genreService.generateUserGenresInBackground();
    }
    
    return defaultGenresWithImages;
  },
  
  /**
   * Generate user genres in background without blocking UI
   */
  generateUserGenresInBackground: async () => {
    try {
      // Set flag to prevent multiple simultaneous generations
      localStorage.setItem(GENRE_GENERATION_IN_PROGRESS, 'true');
      
      // Generate personalized genres
      let userGenres;
      
      // Only try to get user top artists if logged in
      if (spotifyService.isLoggedIn()) {
        try {
          // Fix the API request call to match existing pattern in the code
          const topArtists = await fetch('https://api.spotify.com/v1/me/top/artists', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${await spotifyService.getAccessToken()}`
            },
            params: { limit: 50, time_range: 'medium_term' }
          }).then(res => {
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return res.json();
          });
          
          if (topArtists && topArtists.items && topArtists.items.length > 0) {
            // Extract and count genres from top artists
            const genreCounts = {};
            topArtists.items.forEach(artist => {
              if (artist.genres && artist.genres.length > 0) {
                artist.genres.forEach(genre => {
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
              }
            });
            
            // Sort genres by count and take top 12
            const topGenres = Object.entries(genreCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(entry => entry[0]);
              
            if (topGenres.length > 0) {
              userGenres = await genreService.fetchGenreImages(topGenres);
            }
          }
        } catch (error) {
          console.error('Error generating user genres:', error);
          // Continue to fallback if error occurs
        }
      }
      
      // If we couldn't get user genres, try generic recommendations
      if (!userGenres) {
        try {
          const availableGenres = await spotifyService.apiRequest('/recommendations/available-genre-seeds', {}, true);
          if (availableGenres && availableGenres.genres && availableGenres.genres.length > 0) {
            const randomGenres = availableGenres.genres
              .sort(() => 0.5 - Math.random())
              .slice(0, 12);
              
            userGenres = await genreService.fetchGenreImages(randomGenres);
          }
        } catch (error) {
          console.error('Error getting genre seeds:', error);
          // Continue to default genres if error occurs
        }
      }
      
      // If we still don't have genres, use default list
      if (!userGenres) {
        userGenres = await genreService.getDefaultGenresWithImages();
      }
      
      // Cache the results
      genreService.cacheGenres(userGenres);
    } catch (error) {
      console.error('Error in background genre generation:', error);
    } finally {
      // Clear the in-progress flag
      localStorage.removeItem(GENRE_GENERATION_IN_PROGRESS);
    }
  },
  
  /**
   * Get cached genres if available and not expired
   */
  getCachedGenres: () => {
    try {
      const cachedGenres = localStorage.getItem(GENRE_STORAGE_KEY);
      const timestamp = localStorage.getItem(GENRE_TIMESTAMP_KEY);
      
      if (cachedGenres && timestamp) {
        // Check if cache has expired
        const now = Date.now();
        if (now - parseInt(timestamp) < CACHE_EXPIRATION) {
          return JSON.parse(cachedGenres);
        }
      }
      return null;
    } catch (error) {
      console.error('Error retrieving cached genres:', error);
      return null;
    }
  },
  
  /**
   * Cache genres with timestamp
   */
  cacheGenres: (genres) => {
    try {
      localStorage.setItem(GENRE_STORAGE_KEY, JSON.stringify(genres));
      localStorage.setItem(GENRE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching genres:', error);
    }
  },
  
  /**
   * Get default genres with images
   */
  getDefaultGenresWithImages: async () => {
    try {
      // Take a random subset of default genres
      const selectedGenres = DEFAULT_GENRES
        .sort(() => 0.5 - Math.random())
        .slice(0, 12);
        
      return await genreService.fetchGenreImages(selectedGenres);
    } catch (error) {
      console.error('Error getting default genres:', error);
      // Return basic genres with placeholder images as last resort
      return DEFAULT_GENRES.slice(0, 12).map(genre => ({
        id: `genre-${genre.replace(/\s+/g, '-')}`,
        name: genre,
        displayName: genre.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        imageUrl: "https://via.placeholder.com/300x300?text=" + genre.charAt(0).toUpperCase() + genre.slice(1)
      }));
    }
  },
  
  /**
   * Fetch images for genre list (moved from FeaturedGenres)
   */
  fetchGenreImages: async (genreList) => {
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
      
      return genresWithImages;
    } catch (error) {
      console.error('Error matching genres with images:', error);
      throw error;
    }
  }
};

export default genreService;