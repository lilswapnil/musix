import React, { useState, useEffect } from 'react';
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
    isReady, 
    isPlaying, 
    currentTrack, 
    playerError, 
    isPremium,
    playTrack,
    pause,
    resume,
    togglePlay
  } = useSpotifyPlayer();
  
  // Only show if player is initialized and premium
  if (!isPremium) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-primary-dark p-3 text-center">
        <p className="text-sm text-muted mb-2">
          Spotify Premium required for playback functionality
        </p>
        {/* Debug button to force premium mode - remove in production */}
        <button 
          className="px-3 py-1 bg-primary text-white text-xs rounded"
          onClick={() => {
            // This is a temporary workaround
            console.log('Forcing premium mode for testing');
            window.localStorage.setItem('spotify_force_premium', 'true');
            window.location.reload();
          }}
        >
          I have Premium (Force Enable)
        </button>
      </div>
    );
  }
  
  if (!isReady) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-primary-dark p-3 flex justify-center">
        <div className="animate-pulse text-accent">Connecting to Spotify...</div>
      </div>
    );
  }
  
  if (playerError) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-primary-dark p-3 text-center">
        <p className="text-sm text-error">{playerError}</p>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary-dark border-t border-primary p-2">
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
            disabled={!currentTrack}
          >
            <FontAwesomeIcon icon={faStepBackward} />
          </button>
          
          <button 
            className="bg-accent hover:bg-accent/80 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            onClick={togglePlay}
            disabled={!currentTrack}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>
          
          <button 
            className="text-muted hover:text-white transition-colors"
            disabled={!currentTrack}
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
            className="w-24 accent-accent"
            // Add volume control functionality here
          />
        </div>
      </div>
    </div>
  );
}