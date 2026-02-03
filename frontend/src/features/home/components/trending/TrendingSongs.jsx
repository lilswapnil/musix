import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TrendingSongsLoading from './TrendingSongsLoading';
import TrendingSongsError from './TrendingSongsError';
import TrendingSongsEmpty from './TrendingSongsEmpty';
import TrendingSongsGroupSection from './TrendingSongsGroupSection';
import { deezerService } from "../../../../services/deezerServices";
import { spotifyService } from "../../../../services/spotifyServices";
import useAudioPlayer from '../../../../hooks/useAudioPlayer';

export default function TrendingSongs({ useSpotify = false }) {
  const [likedSongs, setLikedSongs] = useState({});
  const navigate = useNavigate();
  const {
    // audioRef,
    currentlyPlaying,
    handlePlayPause
  } = useAudioPlayer();

  const fetchTrending = async () => {
    if (useSpotify) {
      const spotifyData = await spotifyService.getTrendingTracks(50);
      const items = spotifyData?.items || [];
      if (items.length > 0) {
        const mappedTracks = items
          .map((item, index) => {
            const track = item?.track || item;
            if (!track) return null;
            return {
              id: track.id,
              name: track.name,
              artist: track.artists?.map(a => a.name).join(', '),
              album: track.album?.name,
              albumArt: track.album?.images?.[0]?.url,
              previewUrl: track.preview_url,
              externalUrl: track.external_urls?.spotify,
              position: index + 1,
              source: 'spotify'
            };
          })
          .filter(Boolean);

        if (mappedTracks.length > 0) {
          return mappedTracks;
        }
      }
      throw new Error('No Spotify trending tracks available');
    }

    const data = await deezerService.getTrendingTracks(100);

    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((track) => ({
        id: track.id,
        name: track.title,
        artist: track.artist.name,
        album: track.album.title,
        albumArt: track.album.cover_medium || track.album.cover_small,
        previewUrl: track.preview,
        externalUrl: track.link,
        position: track.position || 0,
        source: 'deezer'
      }));
    }
    throw new Error('Invalid response format from Deezer API');
  };

  const {
    data: trendingSongs = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['trending-songs', useSpotify],
    queryFn: fetchTrending
  });

  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (loadError) {
      console.error('Error loading liked songs:', loadError);
    }
  }, []);

  // ...existing code...

  // Handle like button click
  const handleLike = (songId, event) => {
    event.stopPropagation();
    
    setLikedSongs(prev => {
      const newLikes = {
        ...prev,
        [songId]: !prev[songId]
      };
      
      // Save to localStorage
      localStorage.setItem('likedSongs', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  // Group trending songs by chart position/rank
  const groupedSongs = trendingSongs.reduce((groups, song, index) => {
    let groupName;
    
    if (index < 20) {
      groupName = 'Top 20 Songs';
    } else if (index < 50) {
      groupName = 'Rising Hits';
    } else {
      groupName = 'On The Radar';
    }
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    groups[groupName].push(song);
    return groups;
  }, {});

  if (isLoading) {
    return <TrendingSongsLoading />;
  }

  if (error) {
    return (
      <TrendingSongsError
        message={error?.message || 'Failed to load trending songs'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (trendingSongs.length === 0) {
    return <TrendingSongsEmpty />;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-start">Trending Now</h2>
      
      {Object.entries(groupedSongs).map(([groupName, songs]) => (
        <TrendingSongsGroupSection
          key={groupName}
          groupName={groupName}
          songs={songs}
          navigate={navigate}
          currentlyPlaying={currentlyPlaying}
          likedSongs={likedSongs}
          onPlayPause={handlePlayPause}
          onLike={handleLike}
        />
      ))}
    </div>
  );
}