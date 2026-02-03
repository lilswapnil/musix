import React from "react";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function TopAlbumsList({ albums, onAlbumClick }) {
  return (
    <ScrollableSection title="Trending Albums">
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div
            key={album.id}
            className="flex-shrink-0 w-32 sm:w-40 md:w-42 lg:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted rounded"
            onClick={() => onAlbumClick(album)}
          >
            <div className="relative">
              <img
                src={album.coverArt}
                alt={album.title}
                className="w-full h-32 sm:h-40 md:h-42 lg:h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="p-2 sm:p-3 md:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                  {album.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-white mt-0.5 sm:mt-1 truncate">
                  {album.artist}
                </p>
                {album.releaseDate && (
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
                    {album.releaseDate.substring(0, 4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollableSection>
  );
}
