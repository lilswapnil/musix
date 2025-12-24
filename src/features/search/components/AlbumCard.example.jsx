import React from 'react';
import AlbumCard from './AlbumCard';

/**
 * AlbumCard Component Usage Examples
 *
 * The AlbumCard component displays an album with a beautiful vinyl record effect.
 * On hover, the vinyl record slides out from behind the album cover.
 */

// Example 1: Basic Usage with minimal data
export function BasicExample() {
  const album = {
    id: '123456',
    title: 'Album Title',
    artist: 'Artist Name',
    coverArt: 'https://example.com/album-cover.jpg',
  };

  return (
    <div className="p-8">
      <AlbumCard album={album} />
    </div>
  );
}

// Example 2: Complete album data
export function CompleteExample() {
  const album = {
    id: '123456',
    title: 'Midnights',
    name: 'Midnights', // Either 'title' or 'name' works
    artist: 'Taylor Swift',
    coverArt: 'https://example.com/album-cover.jpg',
    releaseDate: '2022-10-21',
    trackCount: 13,
    explicit_lyrics: false,
  };

  return (
    <div className="p-8">
      <AlbumCard album={album} />
    </div>
  );
}

// Example 3: Grid of albums
export function GridExample() {
  const albums = [
    {
      id: '1',
      title: 'Album One',
      artist: 'Artist One',
      coverArt: 'https://example.com/album1.jpg',
      releaseDate: '2023-01-15',
      trackCount: 12,
    },
    {
      id: '2',
      title: 'Album Two',
      artist: 'Artist Two',
      coverArt: 'https://example.com/album2.jpg',
      releaseDate: '2023-06-20',
      trackCount: 10,
    },
    {
      id: '3',
      title: 'Album Three',
      artist: 'Artist Three',
      coverArt: 'https://example.com/album3.jpg',
      releaseDate: '2023-09-05',
      trackCount: 15,
    },
  ];

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}

// Example 4: Horizontal scrollable list (like in SearchPage)
export function ScrollableExample() {
  const albums = [
    { id: '1', title: 'Album 1', artist: 'Artist 1', coverArt: 'url1.jpg' },
    { id: '2', title: 'Album 2', artist: 'Artist 2', coverArt: 'url2.jpg' },
    { id: '3', title: 'Album 3', artist: 'Artist 3', coverArt: 'url3.jpg' },
    { id: '4', title: 'Album 4', artist: 'Artist 4', coverArt: 'url4.jpg' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Trending Albums</h2>
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}

// Example 5: With explicit content label
export function ExplicitContentExample() {
  const album = {
    id: '123456',
    title: 'Explicit Album',
    artist: 'Artist Name',
    coverArt: 'https://example.com/album-cover.jpg',
    releaseDate: '2023-05-10',
    trackCount: 16,
    explicit_lyrics: true, // This will show the parental advisory label
  };

  return (
    <div className="p-8">
      <AlbumCard album={album} />
    </div>
  );
}

/**
 * Component Props:
 *
 * @param {Object} album - Album object with the following properties:
 *   @property {string} id - Unique album identifier (required)
 *   @property {string} title|name - Album title (required)
 *   @property {string} artist - Artist name (required)
 *   @property {string} coverArt|cover_big|cover_medium|cover - Album cover image URL (required)
 *   @property {string} releaseDate - Release date in YYYY-MM-DD format (optional)
 *   @property {number} trackCount - Number of tracks in the album (optional)
 *   @property {boolean} explicit_lyrics - Whether album contains explicit content (optional)
 *
 * Features:
 * - Vinyl record effect that slides out on hover
 * - Smooth transitions and animations
 * - Responsive design
 * - Click to navigate to album details page
 * - Parental advisory label for explicit content
 * - Fallback for missing album art
 * - Star and moon design on vinyl label
 *
 * Styling Notes:
 * - Card width: 256px (w-64) on mobile, 288px (w-72) on md, 320px (w-80) on lg
 * - Uses Tailwind's group hover utilities for interactive effects
 * - Requires 'perspective' utility to be added to tailwind.config.js
 */
