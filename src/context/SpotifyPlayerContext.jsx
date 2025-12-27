import React, { createContext, useContext, useMemo } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';

const SpotifyPlayerContext = createContext(null);

export const SpotifyPlayerProvider = ({ children }) => {
  const player = useSpotifyPlayer();
  const value = useMemo(() => player, [player]);
  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
};

export const useSpotifyPlayerContext = () => useContext(SpotifyPlayerContext);
