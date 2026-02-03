import React, { lazy, Suspense } from 'react';
import PageSkeleton from '../components/common/ui/PageSkeleton';

import { deezerService } from '../services/deezerServices';
import { spotifyService } from '../services/spotifyServices';
const Albums = lazy(() => import('../features/search/components/Albums'));

// Loader for preloading album data before rendering Albums page
export async function albumLoader({ params }) {
  if (!params.albumId) throw new Response('Album ID required', { status: 400 });
  try {
    const isDeezerId = /^\d+$/.test(String(params.albumId || ''));
    if (isDeezerId) {
      const albumData = await deezerService.getAlbum(params.albumId);
      return { albumData };
    }

    const spotifyAlbum = await spotifyService.getAlbum(params.albumId);
    return { albumData: spotifyAlbum || null };
  } catch (err) {
    // Avoid blocking navigation; the component handles fetch/errors.
    return { albumData: null };
  }
}
const Artists = lazy(() => import('../features/search/components/Artists'));
const Songs = lazy(() => import('../features/search/components/Songs'));
const Genres = lazy(() => import('../features/search/components/Genres'));
const SearchPage = lazy(() => import('../features/search/pages/SearchPage'));

export const musicRoutes = [
  {
    path: 'search',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <SearchPage />
      </Suspense>
    ),
    children: [
      {
        path: 'artist/:artistId',
        children: [
          {
            path: '',
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <Artists />
              </Suspense>
            ),
          },
          {
            path: 'album/:albumId',
            loader: albumLoader,
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <Albums />
              </Suspense>
            ),
          },
          {
            path: 'song/:songId',
            element: (
              <Suspense fallback={<PageSkeleton />}>
                <Songs />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'album/:albumId',
        loader: albumLoader,
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Albums />
          </Suspense>
        ),
      },
      {
        path: 'song/:songId',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Songs />
          </Suspense>
        ),
      },
      {
        path: 'genre/:genreName',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Genres />
          </Suspense>
        ),
      },
    ],
  },
  // Optionally, keep top-level music routes for direct access
  {
    path: 'artist/:artistId',
    children: [
      {
        path: '',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Artists />
          </Suspense>
        ),
      },
      {
        path: 'album/:albumId',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Albums />
          </Suspense>
        ),
      },
      {
        path: 'song/:songId',
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <Songs />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: 'album/:albumId',
    loader: albumLoader,
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Albums />
      </Suspense>
    ),
  },
  {
    path: 'song/:songId',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Songs />
      </Suspense>
    ),
  },
  {
    path: 'genre/:genreName',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Genres />
      </Suspense>
    ),
  },
];
