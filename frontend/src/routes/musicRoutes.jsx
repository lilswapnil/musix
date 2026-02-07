import React, { lazy, Suspense } from 'react';
import PageSkeleton from '../components/common/ui/PageSkeleton';
import RouteErrorBoundary from '../components/common/ui/RouteErrorBoundary';

import { deezerService } from '../services/deezerServices';
import { spotifyService } from '../services/spotifyServices';
const Albums = lazy(() => import('../features/search/pages/Albums'));

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
  } catch {
    // Avoid blocking navigation; the component handles fetch/errors.
    return { albumData: null };
  }
}
const Artists = lazy(() => import('../features/search/pages/Artists'));
const Songs = lazy(() => import('../features/search/pages/Songs'));
const Genres = lazy(() => import('../features/search/pages/Genres'));
const SearchPage = lazy(() => import('../features/search/pages/SearchPage'));

export const musicRoutes = [
  {
    path: 'search',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <SearchPage />
        </Suspense>
      </RouteErrorBoundary>
    ),
    children: [
      {
        path: 'artist/:artistId',
        children: [
          {
            path: '',
            element: (
              <RouteErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <Artists />
                </Suspense>
              </RouteErrorBoundary>
            ),
          },
          {
            path: 'album/:albumId',
            loader: albumLoader,
            element: (
              <RouteErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <Albums />
                </Suspense>
              </RouteErrorBoundary>
            ),
          },
          {
            path: 'song/:songId',
            element: (
              <RouteErrorBoundary>
                <Suspense fallback={<PageSkeleton />}>
                  <Songs />
                </Suspense>
              </RouteErrorBoundary>
            ),
          },
        ],
      },
      {
        path: 'album/:albumId',
        loader: albumLoader,
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Albums />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: 'song/:songId',
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Songs />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: 'genre/:genreName',
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Genres />
            </Suspense>
          </RouteErrorBoundary>
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
          <RouteErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Artists />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: 'album/:albumId',
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Albums />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
      {
        path: 'song/:songId',
        element: (
          <RouteErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Songs />
            </Suspense>
          </RouteErrorBoundary>
        ),
      },
    ],
  },
  {
    path: 'album/:albumId',
    loader: albumLoader,
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Albums />
        </Suspense>
      </RouteErrorBoundary>
    ),
  },
  {
    path: 'song/:songId',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Songs />
        </Suspense>
      </RouteErrorBoundary>
    ),
  },
  {
    path: 'genre/:genreName',
    element: (
      <RouteErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Genres />
        </Suspense>
      </RouteErrorBoundary>
    ),
  },
];
