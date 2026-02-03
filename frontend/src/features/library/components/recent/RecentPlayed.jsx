import React from "react";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deezerService } from '../../../../services/deezerServices';
import { removeAccessToken } from '../../../../utils/tokenStorage';
import RecentPlayedLoading from './RecentPlayedLoading';
import RecentPlayedError from './RecentPlayedError';
import RecentPlayedEmpty from './RecentPlayedEmpty';
import RecentPlayedGroupSection from './RecentPlayedGroupSection';

// Update the function signature to accept token prop
export default function RecentPlayed({ token }) {
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [likedSongs, setLikedSongs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isDeezerId = (value) => {
    if (!value) return false;
    return typeof value === 'number' || /^\d+$/.test(String(value));
  };

  const goToSong = async (track) => {
    if (isDeezerId(track?.id)) {
      navigate(`/song/${track.id}`);
      return;
    }
    const artistNames = track?.artists?.map(a => a.name).join(' ') || '';
    const query = `${track?.name || ''} ${artistNames}`.trim();
    if (!query) return;
    try {
      const result = await deezerService.searchTracks(query, 1);
      const match = result?.data?.[0];
      if (match?.id) {
        navigate(`/song/${match.id}`);
      }
    } catch (err) {
      console.warn('Could not resolve song to Deezer id:', err);
    }
  };

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
        // Use the token prop instead of getting it again
        if (!token) {
          setError('You need to log in to see your recent plays');
          setLoading(false);
          return;
        }
        
        await fetchRecentlyPlayed(token);
      } catch (err) {
        console.error('Error fetching recent tracks:', err);
        setError('Failed to load your recent plays');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentTracks();
  }, [token]);

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
          removeAccessToken();
          throw new Error('Session expired. Please log in again.');
        }
        if (response.status === 403) {
          // Missing scope; degrade gracefully
          setRecentlyPlayed([]);
          setError('');
          return;
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
    return <RecentPlayedLoading />;
  }

  if (error) {
    return <RecentPlayedError message={error} onRetry={() => window.location.reload()} />;
  }

  if (!recentlyPlayed || recentlyPlayed.length === 0) {
    return <RecentPlayedEmpty />;
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
      <h2 className="text-3xl font-bold mb-4 text-start">Recently Played</h2>
      
      {Object.entries(groupedTracks).map(([groupName, tracks]) => (
        <RecentPlayedGroupSection
          key={groupName}
          groupName={groupName}
          tracks={tracks}
          likedSongs={likedSongs}
          onLike={handleLike}
          onSongClick={goToSong}
        />
      ))}
    </div>
  );
}