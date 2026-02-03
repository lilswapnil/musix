import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faMusic, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { aiRecommendationService } from '../../../../services/aiRecommendationService';
import { spotifyService } from '../../../../services/spotifyServices';
import { CardSkeleton } from '../../../../components/common/ui/Skeleton';
import AIRecommendationSpinner from './AIRecommendationSpinner';
import AISingleRecommendationSkeleton from './AISingleRecommendationSkeleton';
import AISingleRecommendationCard from './AISingleRecommendationCard';
import AISingleRecommendationEmpty from './AISingleRecommendationEmpty';

export default function AIRecommendations({ mode = 'single', source = 'ai' }) {
  const [nextRecommendation, setNextRecommendation] = useState(null);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [recommendationError, setRecommendationError] = useState('');

  const fetchSpotifyRecommendations = async (limit) => {
    const current = await spotifyService.getCurrentlyPlaying();
    const track = current?.item;
    if (!track || track.type !== 'track' || !track.id) {
      setRecommendationError('Play a Spotify track to get recommendations');
      return [];
    }

    const seedArtists = (track.artists || []).map(artist => artist.id).filter(Boolean);
    if (!seedArtists.length) {
      setRecommendationError('Play a Spotify track to get recommendations');
      return [];
    }

    try {
      const topTracks = await spotifyService.getArtistTopTracks(seedArtists[0]);
      const tracks = topTracks?.tracks || [];
      const filtered = tracks.filter(item => item?.id && item.id !== track.id);
      if (filtered.length > 0) return filtered.slice(0, limit);
    } catch {
      // Fall through to genre-based fallback
    }

    try {
      const genreSeeds = await spotifyService.apiRequest('/recommendations/available-genre-seeds');
      const genre = genreSeeds?.genres?.[0];
      if (!genre) {
        setRecommendationError('No Spotify recommendations available');
        return [];
      }
      const fallback = await spotifyService.getRecommendations({
        seed_genres: [genre],
        limit
      });
      return fallback?.tracks || [];
    } catch {
      setRecommendationError('No Spotify recommendations available');
      return [];
    }
  };

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setRecommendationError('');
      if (mode === 'list') {
        if (source === 'spotify') {
          const tracks = await fetchSpotifyRecommendations(20);
          setRecommendedTracks(tracks);
        } else {
          const tracks = await aiRecommendationService.getRecommendationsList({ limit: 20 });
          setRecommendedTracks(tracks);
        }
      } else {
        if (source === 'spotify') {
          const tracks = await fetchSpotifyRecommendations(1);
          setNextRecommendation(tracks[0] || null);
        } else {
          const track = await aiRecommendationService.getNextRecommendation();
          setNextRecommendation(track);
        }
      }
    } catch {
      // Silently ignore errors; don't log token validation issues
    } finally {
      setIsLoading(false);
    }
  }, [mode, source]);

  useEffect(() => {
    fetchRecommendations();
    const refreshInterval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [fetchRecommendations]);

  const handlePlayTrack = async (trackUri) => {
    try {
      await spotifyService.play(trackUri);
    } catch {
      try {
        await spotifyService.addToQueue(trackUri);
      } catch {
        // Silently ignore errors
      }
    }
  };

  const handleQueueTrack = async (trackUri) => {
    try {
      await spotifyService.addToQueue(trackUri);
    } catch {
      // Silently ignore errors
    }
  };

  const scroll = (direction) => {
    const container = document.getElementById('ai-tracks-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (mode === 'single') {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-4 text-start">For You</h2>
        
          {isLoading ? (
          <AISingleRecommendationSkeleton />
        ) : nextRecommendation ? (
          <AISingleRecommendationCard
            recommendation={nextRecommendation}
            onPlayNow={handlePlayTrack}
            onAddToQueue={handleQueueTrack}
          />
        ) : (
          <AISingleRecommendationEmpty
            message={
              recommendationError || 'Play music on Spotify to get recommendations'
            }
          />
        )}
      </div>
    );
  }

  // List mode for library page
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-4 text-start">Recommended For You</h2>
      
      <div className="relative">
        {recommendedTracks.length > 0 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-accent rounded-full hover:bg-accent/80 transition text-primary"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-accent rounded-full hover:bg-accent/80 transition text-primary"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </>
        )}

        <div
          id="ai-tracks-scroll"
          className="overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex gap-4 pb-4 px-2">
            {isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </>
            ) : recommendedTracks.length > 0 ? (
              recommendedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex-shrink-0 w-48 group cursor-pointer"
                    onClick={() => handleQueueTrack(track.uri)}
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    {track.album?.images?.[0]?.url ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy" decoding="async"
                      />
                    ) : (
                      <div className="w-full h-48 glass-light flex items-center justify-center">
                        <FontAwesomeIcon icon={faMusic} className="text-4xl text-muted" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePlayTrack(track.uri);
                        }}
                        className="p-3 bg-accent rounded-full text-primary hover:bg-accent/80 transition"
                        aria-label="Play now"
                      >
                        <FontAwesomeIcon icon={faPlay} className="text-2xl" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <h3 className="font-semibold text-sm truncate group-hover:text-accent transition">{track.name}</h3>
                    <p className="text-xs text-muted truncate mt-1">
                      {track.artists?.map(a => a.name).join(', ')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${track.popularity}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted">{track.popularity}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-12">
                <p className="text-muted">No recommendations available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
