import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain, faPlay, faMusic, faSpinner, faChevronLeft, faChevronRight, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { aiRecommendationService } from '../../../services/aiRecommendationService';
import { spotifyService } from '../../../services/spotifyServices';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent/50 rounded-full animate-spin"></div>
      <div className="absolute inset-1 bg-primary-light rounded-full"></div>
    </div>
  </div>
);

export default function AIRecommendations({ mode = 'single' }) {
  const [nextRecommendation, setNextRecommendation] = useState(null);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      if (mode === 'list') {
        const tracks = await aiRecommendationService.getRecommendationsList({ limit: 20 });
        setRecommendedTracks(tracks);
      } else {
        const track = await aiRecommendationService.getNextRecommendation();
        setNextRecommendation(track);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchRecommendations();
    const refreshInterval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [fetchRecommendations]);

  const handlePlayTrack = async (trackUri) => {
    try {
      await spotifyService.addToQueue(trackUri);
    } catch (error) {
      console.error('Error adding track to queue:', error);
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
          <div className="relative h-80 rounded-xl overflow-hidden shadow-lg bg-primary-light flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : nextRecommendation ? (
          <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg group">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/50">
                {nextRecommendation.album?.images?.[0]?.url && (
                  <img 
                    src={nextRecommendation.album.images[0].url}
                    alt={nextRecommendation.album.name}
                    className="w-full h-full object-cover opacity-50 blur-sm scale-110"
                  />
                )}
              </div>
            </div>
            
            <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row">
              <div className="mx-auto sm:mx-0 mb-4 sm:mb-0 sm:mr-6 md:mr-8 flex-shrink-0">
                {nextRecommendation.album?.images?.[0]?.url ? (
                  <img 
                    src={nextRecommendation.album.images[0].url}
                    alt={nextRecommendation.album.name}
                    className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 object-cover shadow-lg rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-primary-light flex items-center justify-center rounded-lg">
                    <FontAwesomeIcon icon={faPlay} className="text-4xl text-muted" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-end text-center sm:text-start">
                <div>
                  <div className="flex flex-col sm:flex-row items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FontAwesomeIcon icon={faBrain} className="text-accent text-lg" />
                        <span className="text-xs font-semibold text-accent uppercase tracking-wide">Next Up</span>
                      </div>
                      <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-white mb-2 truncate">{nextRecommendation.name}</h2>
                      <p className="text-lg sm:text-lg text-white/80 mb-1">{nextRecommendation.artists?.map(a => a.name).join(', ')}</p>
                      <p className="text-white sm:block hidden text-sm">{nextRecommendation.album?.name}</p>
                    </div>
                    
                    <button 
                      onClick={() => handlePlayTrack(nextRecommendation.uri)}
                      className="p-2 sm:p-3 rounded-full hover:bg-accent/20 transition-colors mx-auto sm:mx-0 mt-2 sm:mt-0"
                    >
                      <FontAwesomeIcon 
                        icon={faPlay} 
                        className="text-2xl sm:text-3xl text-accent hover:text-accent/80 transition"
                      />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start gap-3">
                  <button
                    onClick={() => handlePlayTrack(nextRecommendation.uri)}
                    className="flex items-center bg-accent hover:bg-accent/80 text-primary py-2 px-4 rounded-full transition-colors font-semibold"
                  >
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    Add to Queue
                  </button>
                  <a 
                    href={nextRecommendation.external_urls?.spotify} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center bg-accent/20 hover:bg-accent/30 text-accent py-2 px-4 rounded-full transition-colors"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-primary-light/30 rounded-lg">
            <p className="text-lg text-muted">No recommendation available</p>
            <p className="text-sm mt-2">Play music on Spotify to get recommendations</p>
          </div>
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
              <div className="w-full flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : recommendedTracks.length > 0 ? (
              recommendedTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex-shrink-0 w-48 group cursor-pointer"
                  onClick={() => handlePlayTrack(track.uri)}
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    {track.album?.images?.[0]?.url ? (
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-primary-light flex items-center justify-center">
                        <FontAwesomeIcon icon={faMusic} className="text-4xl text-muted" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="p-3 bg-accent rounded-full text-primary">
                        <FontAwesomeIcon icon={faPlay} className="text-2xl" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-1">
                    <h3 className="font-semibold text-sm truncate group-hover:text-accent transition">{track.name}</h3>
                    <p className="text-xs text-muted truncate mt-1">
                      {track.artists?.map(a => a.name).join(', ')}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-primary-light rounded-full overflow-hidden">
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
