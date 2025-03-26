import React from "react";
import { useState, useEffect } from 'react';
import { getAccessToken, removeAccessToken } from '../../../utils/tokenStorage';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faClock } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';

export default function RecentPlayed() {
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [likedSongs, setLikedSongs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load liked songs from localStorage on component mount
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
  }, []);

  useEffect(() => {
    const fetchRecentTracks = async () => {
      try {
        // Retrieve the access token from the cache
        const accessToken = getAccessToken(); // Changed from getToken
        
        if (!accessToken) {
          setError('You need to log in to see your recent plays');
          setLoading(false);
          return;
        }
        
        await fetchRecentlyPlayed(accessToken);
      } catch (err) {
        console.error('Error fetching recent tracks:', err);
        setError('Failed to load your recent plays');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentTracks();
  }, []);

  async function fetchRecentlyPlayed(accessToken) {
    try {
      const searchParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      };

      const response = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=50', 
        searchParameters
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          removeAccessToken(); // Changed from removeToken
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Error ${response.status}: Failed to fetch recently played tracks`);
      }
      
      const data = await response.json();
      setRecentlyPlayed(data.items);
      
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      throw err;
    }
  }

  // Handle like button click
  const handleLike = (songId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    setLikedSongs(prev => {
      const newLikes = {
        ...prev,
        [songId]: !prev[songId]
      };
      
      localStorage.setItem('likedSongs', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-accent">Loading your recent plays...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center my-8">
        <p className="text-error mb-2">{error}</p>
        <button 
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 text-start">Recent Plays</h2>
        <div className="text-center p-8 bg-primary-light/30 rounded-lg">
          <p className="text-lg text-muted">No recently played tracks found.</p>
          <p className="text-sm mt-2">Try playing some music on Spotify!</p>
        </div>
      </div>
    );
  }

  // Group tracks by date (today, yesterday, this week, etc.)
  const groupedTracks = recentlyPlayed.reduce((groups, item) => {
    const date = new Date(item.played_at);
    const today = new Date();
    let groupName;
    
    if (date.toDateString() === today.toDateString()) {
      groupName = 'Today';
    } else if (date.toDateString() === new Date(today - 86400000).toDateString()) {
      groupName = 'Yesterday';
    } else if (today - date < 7 * 86400000) {
      groupName = 'This Week';
    } else {
      groupName = 'Earlier';
    }
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    groups[groupName].push(item);
    return groups;
  }, {});

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-start">Recently Played</h2>
      
      {Object.entries(groupedTracks).map(([groupName, tracks]) => (
        <div key={groupName} className="mb-6">
          <ScrollableSection 
            title={<h3 className="text-xl font-semibold text-start">{groupName}</h3>}
          >
            <div className="flex space-x-2">
              {/* Split tracks into groups of 4 for horizontal scrolling */}
              {Array.from({ length: Math.ceil(tracks.length / 4) }).map((_, groupIndex) => {
                const groupTracks = tracks.slice(groupIndex * 4, groupIndex * 4 + 4);
                return (
                  <div 
                    key={groupIndex} 
                    className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
                  >
                    {groupTracks.map((item, index) => (
                      <div 
                        key={`${item.track.id}-${index}`} 
                        className="flex items-center mb-2 last:mb-0 border-muted border p-2 rounded hover:bg-opacity-90 transition-colors cursor-pointer"
                        onClick={() => window.open(item.track.external_urls.spotify, '_blank')}
                      >
                        <div className="w-12 h-12 flex-shrink-0">
                          <img 
                            src={item.track.album.images[0]?.url} 
                            alt={item.track.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        
                        <div className="ml-3 flex-grow min-w-0 text-start text-white">
                          <div className="font-semibold truncate">{item.track.name}</div>
                          <div className="text-xs truncate">
                            {item.track.artists.map(artist => artist.name).join(', ')}
                          </div>
                        </div>
                        
                        <button 
                          className="ml-2 p-2 rounded-full hover:bg-muted/20 transition-colors"
                          onClick={(e) => handleLike(item.track.id, e)}
                          aria-label={likedSongs[item.track.id] ? "Unlike" : "Like"}
                        >
                          <FontAwesomeIcon 
                            icon={faHeart} 
                            className={`${likedSongs[item.track.id] ? "text-red-500" : "text-muted"}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollableSection>
        </div>
      ))}
    </div>
  );
}