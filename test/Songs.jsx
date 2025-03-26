import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../src/components/common/ui/ScrollableSection';

export default function Songs({ songs }) {
  const [likedSongs, setLikedSongs] = useState({});
  
  // Load liked songs from localStorage on mount
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

  // Group songs into chunks for horizontal display - changed to 5 per row
  const groupedSongs = [];
  const chunkSize = 5; 
  
  for (let i = 0; i < songs.length; i += chunkSize) {
    groupedSongs.push(songs.slice(i, i + chunkSize));
  }
  
  // Handle like button click
  const handleLike = (songId, e) => {
    if (e) e.stopPropagation();
    
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

  return (
    <ScrollableSection title="Songs">
      <div className="flex space-x-2">
        {groupedSongs.map((group, groupIndex) => (
          <div 
            key={groupIndex} 
            className="flex-shrink-0 rounded-lg p-2 w-[280px] xs:w-[300px] md:w-[350px] lg:w-[390px]"
          >
            {group.map((song) => (
              <div 
                key={song.id} 
                className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:bg-opacity-90 transition-colors cursor-pointer"
                onClick={() => window.open(song.external_urls?.spotify, '_blank')}
              >
                <div className="w-12 h-12 flex-shrink-0 relative group">
                  <img 
                    src={song.album.images[0]?.url} 
                    alt={song.name}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                    <FontAwesomeIcon icon={faPlay} className="text-white" />
                  </div>
                </div>
                
                <div className="ml-3 flex-grow text-start min-w-0">
                  <div className="font-semibold  text-white truncate">{song.name}</div>
                  <div className="text-xs text-muted truncate">
                    {song.artists.map((artist) => artist.name).join(", ")}
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
        ))}
      </div>
    </ScrollableSection>
  );
}