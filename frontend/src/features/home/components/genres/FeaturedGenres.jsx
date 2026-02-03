import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import genreService from '../../../../services/genreService';
import FeaturedGenresLoading from './FeaturedGenresLoading';
import FeaturedGenresEmpty from './FeaturedGenresEmpty';
import FeaturedGenresList from './FeaturedGenresList';

export default function FeaturedGenres() {
  const navigate = useNavigate();

  const fetchGenres = async () => {
    console.log('Loading genre recommendations...');
    const recommendedGenres = await genreService.getRecommendedGenres();
    if (recommendedGenres && recommendedGenres.length > 0) {
      console.log(`Loaded ${recommendedGenres.length} genres from ${recommendedGenres[0].source || 'api'}`);
      return {
        genres: recommendedGenres,
        source: recommendedGenres[0].source || 'api'
      };
    }
    return { genres: [], source: 'api' };
  };

  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['featured-genres'],
    queryFn: fetchGenres
  });

  const genres = data?.genres || [];
  const source = data?.source || '';

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

  if (isLoading) {
    return <FeaturedGenresLoading />;
  }

  if (error || genres.length === 0) {
    return <FeaturedGenresEmpty message={error?.message || 'No genre data available'} />;
  }

  return (
    <FeaturedGenresList
      genres={genres}
      source={source}
      onGenreClick={handleGenreClick}
    />
  );
}