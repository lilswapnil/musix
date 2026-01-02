import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt, faMusic } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { geniusService } from "../../../services/geniusService";

export default function GeniusCharts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartSongs, setChartSongs] = useState([]);

  useEffect(() => {
    const fetchCharts = async () => {
      if (!geniusService.isConfigured()) {
        setError('Genius API not configured');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const songs = await geniusService.getTopCharts(40);
        setChartSongs(songs);
        setError('');
      } catch (err) {
        console.error('Failed to fetch Genius charts:', err);
        setError(err.message || 'Failed to load charts');
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, []);

  // Don't render if not configured
  if (!geniusService.isConfigured()) {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-start">Top Charts</h2>
        <div className="flex justify-center items-center h-48">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#FFFF64] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[#FFFF64]">Loading charts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-start">Top Charts</h2>
        <div className="glass p-6 text-center rounded-lg shadow-lg">
          <p className="text-error mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (chartSongs.length === 0) {
    return null;
  }

  // Group songs: Top 10, Next 15, Rest
  const groupedSongs = chartSongs.reduce((groups, song, index) => {
    let groupName;
    
    if (index < 10) {
      groupName = 'Top 10';
    } else if (index < 25) {
      groupName = 'Hot Songs';
    } else {
      groupName = 'Rising';
    }
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    groups[groupName].push(song);
    return groups;
  }, {});

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-3xl font-bold text-start">Top Charts</h2>
        <span className="text-xs text-[#FFFF64] bg-[#FFFF64]/10 px-2 py-1 rounded">via Genius</span>
      </div>
      
      {Object.entries(groupedSongs).map(([groupName, songs]) => (
        <div key={groupName} className="mb-6">
          <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">{groupName}</h3>}>
            <div className="flex space-x-2">
              {/* Split songs into groups of 4 for horizontal scrolling */}
              {Array.from({ length: Math.ceil(songs.length / 4) }).map((_, groupIndex) => {
                const groupTracks = songs.slice(groupIndex * 4, groupIndex * 4 + 4);
                return (
                  <div 
                    key={groupIndex} 
                    className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
                  >
                    {groupTracks.map((song) => (
                      <a 
                        key={song.id}
                        href={song.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded glass-hover transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 flex-shrink-0 relative">
                          {song.albumArt ? (
                            <img 
                              src={song.albumArt} 
                              alt={song.title}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/300x300?text=No+Cover";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#FFFF64]/20 rounded flex items-center justify-center">
                              <FontAwesomeIcon icon={faMusic} className="text-[#FFFF64]" />
                            </div>
                          )}
                          {/* Position badge */}
                          {song.position <= 10 && (
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#FFFF64] text-black text-xs font-bold rounded-full flex items-center justify-center">
                              {song.position}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-grow min-w-0 text-start">
                          <div className="font-semibold text-white truncate group-hover:text-[#FFFF64] transition-colors">
                            {song.title}
                          </div>
                          <div className="text-xs text-muted truncate">{song.artist}</div>
                        </div>
                        
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <FontAwesomeIcon 
                            icon={faExternalLinkAlt} 
                            className="text-[#FFFF64] text-sm"
                          />
                        </div>
                      </a>
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
