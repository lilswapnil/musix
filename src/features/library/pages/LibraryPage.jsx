import React from 'react';
import RecentPlayed from '../components/RecentPlayed'
import CurrentlyPlaying from '../components/CurrentlyPlaying'

export default function LibraryPage() {
  return (
    <>
      <CurrentlyPlaying />
      <RecentPlayed />
      
    </>
  );
}
