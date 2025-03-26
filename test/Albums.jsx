import React from 'react';
import ScrollableSection from '../src/components/common/ui/ScrollableSection';

export default function Albums({ albums }) {
  if (!albums || albums.length === 0) return null;

  return (
    <ScrollableSection title="Albums">
      <div className="flex space-x-2 pb-1">
        {albums.slice(0, 10).map((album) => (
          <div
            key={album.id}
            className="flex-shrink-0 w-36 sm:w-44 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer"
            onClick={() => window.open(album.external_urls.spotify, '_blank')}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={album.images[0]?.url || 'https://via.placeholder.com/300?text=No+Image'}
                alt={album.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3 w-full">
              <h3 className="font-semibold text-white text-xs sm:text-sm truncate max-w-full">{album.name}</h3>
              <p className="text-xxs sm:text-xs text-muted mt-1 truncate max-w-full">
                {album.artists.map(artist => artist.name).join(', ')}
              </p>
              <p className="text-xxs text-muted mt-1">
                {album.release_date?.substring(0, 4)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollableSection>
  );
}