import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart, 
  faExternalLinkAlt,
  faFire,
  faMusic,
  faFileAlt
} from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { Skeleton } from '../../../components/common/ui/Skeleton';
import LyricsModal from '../../../components/common/ui/LyricsModal';
import { geniusService } from '../../../services/geniusService';

/**
 * Component to display Genius Charts - trending songs with lyrics access
 */
export default function GeniusCharts() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const [lyricsModal, setLyricsModal] = useState({ 
    isOpen: false, 
    songId: null, 
    title: '', 
    artist: '',
    albumArt: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setLoading(true);
        
        if (!geniusService.isConfigured()) {
          setError('Genius API is not configured.');
          setLoading(false);
          return;
        }

        const chartSongs = await geniusService.getHotSongs(20);
        setSongs(chartSongs);
        setError(null);
      } catch (err) {
        console.error('Error fetching Genius charts:', err);
        setError(err.message || 'Failed to load charts');
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();

    // Load liked songs from localStorage
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      if (savedLikes) {
        setLikedSongs(JSON.parse(savedLikes));
      }
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
  }, []);

  const handleLike = (songId, event) => {
    event.stopPropagation();
    
    setLikedSongs(prev => {
      const newLikes = {
        ...prev,
        [`genius_${songId}`]: !prev[`genius_${songId}`]
      };
      localStorage.setItem('likedSongs', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  const openLyricsModal = (song, event) => {
    event.stopPropagation();
    setLyricsModal({
      isOpen: true,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      albumArt: song.albumArt || song.thumbnail
    });
  };

  const closeLyricsModal = () => {
    setLyricsModal({ 
      isOpen: false, 
      songId: null, 
      title: '', 
      artist: '',
      albumArt: ''
    });
  };

  const handleSongClick = (song) => {
    // Open Genius page in new tab
    if (song.url) {
      window.open(song.url, '_blank');
    }
  };

  // Don't render if Genius isn't configured
  if (!geniusService.isConfigured()) {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-start flex items-center">
          <FontAwesomeIcon icon={faFire} className="mr-3 text-orange-500" />
          Genius Charts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass p-4 rounded-lg">
              <div className="flex items-center">
                <Skeleton className="w-16 h-16 rounded-lg mr-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-start flex items-center">
          <FontAwesomeIcon icon={faFire} className="mr-3 text-orange-500" />
          Genius Charts
        </h2>
        <div className="glass p-6 text-center rounded-lg">
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return null;
  }

  // Split songs into groups for the scrollable section
  const topSongs = songs.slice(0, 10);
  const moreSongs = songs.slice(10);

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-6 text-start flex items-center">
        <FontAwesomeIcon icon={faFire} className="mr-3 text-orange-500" />
        Trending on Genius
      </h2>

      {/* Top Songs Section */}
      <ScrollableSection 
        title={
          <h3 className="text-2xl font-semibold text-start flex items-center">
            <FontAwesomeIcon icon={faMusic} className="mr-2 text-accent" />
            Hot Right Now
          </h3>
        }
      >
        <div className="flex space-x-2">
          {/* Split into groups of 4 for horizontal scrolling */}
          {Array.from({ length: Math.ceil(topSongs.length / 4) }).map((_, groupIndex) => {
            const groupTracks = topSongs.slice(groupIndex * 4, groupIndex * 4 + 4);
            return (
              <div 
                key={groupIndex} 
                className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[420px]"
              >
                {groupTracks.map((song) => (
                  <div 
                    key={song.id} 
                    className="flex items-center mb-3 last:mb-0 border-muted border p-3 rounded glass-hover transition-all cursor-pointer group"
                    onClick={() => handleSongClick(song)}
                  >
                    {/* Rank badge */}
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-accent/20 rounded-full mr-3">
                      <span className="text-accent font-bold text-sm">
                        {song.rank || song.chartPosition}
                      </span>
                    </div>

                    {/* Album art */}
                    <div className="w-14 h-14 flex-shrink-0 relative">
                      <img 
                        src={song.albumArt || song.thumbnail || 'https://via.placeholder.com/100?text=🎵'}
                        alt={song.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100?text=🎵';
                        }}
                      />
                    </div>
                    
                    {/* Song info */}
                    <div className="ml-3 flex-grow min-w-0">
                      <div className="font-semibold text-white truncate text-start">
                        {song.title}
                      </div>
                      <div className="text-sm text-muted truncate text-start">
                        {song.artist}
                      </div>
                      {song.releaseDateDisplay && (
                        <div className="text-xs text-muted/60 truncate text-start">
                          {song.releaseDateDisplay}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Lyrics button */}
                      <button
                        onClick={(e) => openLyricsModal(song, e)}
                        className="p-2 rounded-full hover:bg-accent/20 transition-colors"
                        title="View Lyrics"
                      >
                        <FontAwesomeIcon 
                          icon={faFileAlt} 
                          className="text-accent text-sm"
                        />
                      </button>

                      {/* Like button */}
                      <button 
                        className="p-2 rounded-full hover:bg-muted/20 transition-colors"
                        onClick={(e) => handleLike(song.id, e)}
                        aria-label={likedSongs[`genius_${song.id}`] ? "Unlike" : "Like"}
                      >
                        <FontAwesomeIcon 
                          icon={faHeart} 
                          className={`text-sm ${likedSongs[`genius_${song.id}`] ? "text-red-500" : "text-muted"}`}
                        />
                      </button>

                      {/* External link */}
                      <a
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-full hover:bg-muted/20 transition-colors opacity-0 group-hover:opacity-100"
                        title="Open on Genius"
                      >
                        <FontAwesomeIcon 
                          icon={faExternalLinkAlt} 
                          className="text-muted text-sm"
                        />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollableSection>

      {/* More Trending - Card layout */}
      {moreSongs.length > 0 && (
        <div className="mt-6">
          <ScrollableSection 
            title={
              <h3 className="text-xl font-semibold text-start">
                More Trending
              </h3>
            }
          >
            <div className="flex space-x-4">
              {moreSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex-shrink-0 w-40 glass-card rounded-lg overflow-hidden cursor-pointer group hover:bg-white/10 transition-all"
                  onClick={() => handleSongClick(song)}
                >
                  <div className="relative">
                    <img 
                      src={song.albumArt || song.thumbnail || 'https://via.placeholder.com/160?text=🎵'}
                      alt={song.title}
                      className="w-40 h-40 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/160?text=🎵';
                      }}
                    />
                    {/* Lyrics overlay on hover */}
                    <div 
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={(e) => openLyricsModal(song, e)}
                    >
                      <div className="text-center">
                        <FontAwesomeIcon icon={faFileAlt} className="text-white text-2xl mb-1" />
                        <p className="text-white text-xs">View Lyrics</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-white text-sm truncate text-start">
                      {song.title}
                    </h4>
                    <p className="text-xs text-muted truncate text-start mt-1">
                      {song.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollableSection>
        </div>
      )}

      {/* Genius attribution */}
      <div className="mt-4 text-center">
        <a 
          href="https://genius.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted hover:text-accent inline-flex items-center"
        >
          Powered by Genius
          <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-[10px]" />
        </a>
      </div>

      {/* Lyrics Modal */}
      <LyricsModal
        isOpen={lyricsModal.isOpen}
        onClose={closeLyricsModal}
        songTitle={lyricsModal.title}
        artistName={lyricsModal.artist}
        albumArt={lyricsModal.albumArt}
        geniusSongId={lyricsModal.songId}
      />
    </div>
  );
}
