import React from 'react';
import { useSpotifyPlayer } from '../../hooks/useSpotifyPlayer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faStepForward, 
  faStepBackward,
  faVolumeUp
} from '@fortawesome/free-solid-svg-icons';

export default function SpotifyPlayer() {
  const { 
    isPlaying, 
    currentTrack, 
    playerError, 
    togglePlay,
    skipToNext,
    skipToPrevious,
    setVolume
  } = useSpotifyPlayer();
  const [volume, setLocalVolume] = React.useState(50);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/20 backdrop-blur-lg p-3 shadow-lg">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Track info */}
        <div className="flex items-center w-1/3">
          {currentTrack ? (
            <>
              <div className="w-12 h-12 mr-3">
                {currentTrack.albumImage ? (
                  <img 
                    src={currentTrack.albumImage} 
                    alt={currentTrack.albumName} 
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-light rounded"></div>
                )}
              </div>
              <div className="truncate">
                <div className="font-medium truncate">{currentTrack.name}</div>
                <div className="text-xs text-muted truncate">{currentTrack.artists}</div>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted">Not playing</span>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 w-1/3">
          <button 
            className="text-muted hover:text-white transition-colors"
            onClick={skipToPrevious}
          >
            <FontAwesomeIcon icon={faStepBackward} />
          </button>
          
          <button 
            className="bg-primary-dark hover:bg-primary/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md"
            onClick={togglePlay}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>
          
          <button 
            className="text-muted hover:text-white transition-colors"
            onClick={skipToNext}
          >
            <FontAwesomeIcon icon={faStepForward} />
          </button>
        </div>
        
        {/* Volume */}
        <div className="flex items-center justify-end w-1/3">
          <FontAwesomeIcon icon={faVolumeUp} className="text-muted mr-2" />
          <input 
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-accent cursor-pointer"
          />
        </div>
      </div>
      {playerError && <div className="text-center text-xs text-error mt-1">{playerError}</div>}
    </div>
  );
}