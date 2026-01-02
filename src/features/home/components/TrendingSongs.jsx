import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { deezerService } from "../../../services/deezerServices";

export default function TrendingSongs() {
  const [likedSongs, setLikedSongs] = useState({});
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendingSongs, setTrendingSongs] = useState([]);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        
        const data = await deezerService.getTrendingTracks(100);
        
        if (data && data.data && Array.isArray(data.data)) {
          // Map Deezer tracks to our format
          const mappedTracks = data.data.map((track) => ({
            id: track.id,
            name: track.title,
            artist: track.artist.name,
            album: track.album.title,
            albumArt: track.album.cover_medium || track.album.cover_small,
            previewUrl: track.preview,
            externalUrl: track.link,
            position: track.position || 0
          }));
          
          setTrendingSongs(mappedTracks);
          setError('');
        } else {
          throw new Error('Invalid response format from Deezer API');
        }
      } catch (err) {
        setError(err.message || 'Failed to load trending songs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrending();
    
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

  // Handle song playback
  const handlePlayPause = (songId, previewUrl, event) => {
    event.stopPropagation();
    
    // If clicked on currently playing song, pause it
    if (currentlyPlaying === songId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setCurrentlyPlaying(null);
      return;
    }
    
    // If there's currently a song playing, pause and cleanup
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    // Play the new song
    if (previewUrl) {
      // Create a new audio element
      const audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        audioRef.current = null;
      });
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setCurrentlyPlaying(null);
        audioRef.current = null;
      });
      
      audioRef.current = audio;
      
      // Use play() with promise handling to avoid interruption errors
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setCurrentlyPlaying(songId);
          })
          .catch((error) => {
            // Only log if not an abort error (user clicked pause quickly)
            if (error.name !== 'AbortError') {
              console.error('Error playing audio:', error);
            }
            setCurrentlyPlaying(null);
            audioRef.current = null;
          });
      } else {
        setCurrentlyPlaying(songId);
      }
    }
  };

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

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Now</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-accent">Loading trending songs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-4 text-start">Trending Now</h2>
        <div className="glass p-6 text-center rounded-lg shadow-lg">
          <p className="text-error mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (trendingSongs.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-start">Trending Now</h2>
        <div className="text-center p-8 glass-light rounded-lg shadow-lg">
          <p className="text-lg text-muted">No trending tracks available right now.</p>
          <p className="text-sm mt-2">Check back soon for the latest hits!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-start">Trending Now</h2>
      
      {Object.entries(groupedSongs).map(([groupName, songs]) => (
        <div key={groupName} className="mb-8">
          <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">{groupName}</h3>}>
            <div className="flex space-x-2 ">
              {/* Split tracks into groups of 4 for horizontal scrolling */}
              {Array.from({ length: Math.ceil(songs.length / 4) }).map((_, groupIndex) => {
                const groupTracks = songs.slice(groupIndex * 4, groupIndex * 4 + 4);
                return (
                  <div 
                    key={groupIndex} 
                    className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
                  >
                    {groupTracks.map((song, index) => (
                      <div 
                        key={`${song.id}-${index}`} 
                        className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded glass-hover transition-all cursor-pointer"
                        onClick={() => navigate(`/song/${song.id}`)}
                      >
                        <div className="w-12 h-12 flex-shrink-0 relative group">
                          <img 
                            src={song.albumArt} 
                            alt={song.name}
                            className="w-full h-full object-cover rounded"
                          />
                          {song.previewUrl && (
                            <button
                              onClick={(e) => handlePlayPause(song.id, song.previewUrl, e)}
                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                            >
                              <FontAwesomeIcon 
                                icon={currentlyPlaying === song.id ? faPause : faPlay} 
                                className="text-white"
                              />
                            </button>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-grow min-w-0">
                          <div className="font-semibold text-start text-white truncate">{song.name}</div>
                          <div className="text-xs truncate flex items-center">
                            {song.artist}
                          </div>
                        </div>
                        
                        <button 
                          className="ml-2 p-2 rounded-full hover:bg-muted/20 transition-colors"
                          onClick={(e) => handleLike(song.id, e)}
                          aria-label={likedSongs[song.id] ? "Unlike" : "Like"}
                        >
                          <FontAwesomeIcon 
                            icon={faHeart} 
                            className={`${likedSongs[song.id] ? "text-red-500" : "text-muted"}`}
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