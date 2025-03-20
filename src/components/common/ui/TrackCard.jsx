import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

/**
 * Reusable track card component used across the application
 */
export default function TrackCard({
  id,
  title,
  artist,
  albumArt,
  isPlaying = false,
  isLiked = false,
  externalUrl,
  previewUrl,
  onPlay,
  onLike,
  size = "normal" // "small", "normal", or "large"
}) {
  // Handle card click - either play the song or open external URL
  const handleCardClick = () => {
    if (onPlay && previewUrl) {
      onPlay(id, previewUrl);
    } else if (externalUrl) {
      window.open(externalUrl, '_blank');
    }
  };
  
  // Handle like button click without propagating to card click
  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLike) onLike(id);
  };
  
  // Determine dimensions based on size
  const dimensions = {
    small: "w-40 h-40",
    normal: "w-48 h-48",
    large: "w-64 h-64"
  };
  
  return (
    <div 
      className="flex-shrink-0 bg-primary-light rounded-lg overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img 
          src={albumArt || 'https://via.placeholder.com/300?text=No+Image'} 
          alt={title}
          className={`${dimensions[size]} object-cover`}
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <FontAwesomeIcon 
              icon={isPlaying ? faPause : (previewUrl ? faPlay : faExternalLinkAlt)} 
              className="text-white text-xl"
            />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 text-start">
            <h3 className="font-semibold text-white text-sm truncate">{title}</h3>
            <p className="text-xs text-muted mt-1 truncate">{artist}</p>
          </div>
          {onLike && (
            <button 
              onClick={handleLikeClick}
              className="p-1 rounded-full hover:bg-text/20 transition-colors"
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <FontAwesomeIcon 
                icon={faHeart} 
                className={`${isLiked ? "text-red-500" : "text-muted"}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}