import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function ArtistAlbumsSection({ albums, onAlbumClick }) {
  if (!albums.length) return null;

  return (
    <ScrollableSection title={<h3 className="text-2xl font-semibold text-start">Albums</h3>}>
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div
            key={album.id}
            className="flex-shrink-0 w-32 sm:w-40 md:w-42 lg:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
            onClick={() => onAlbumClick(album.id)}
          >
            <div className="relative">
              <img
                src={album.coverArt}
                alt={album.name}
                className="w-full h-32 sm:h-40 md:h-42 lg:h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faPlay}
                    className="text-white text-sm sm:text-base md:text-xl"
                  />
                </div>
              </div>
            </div>
            <div className="p-2 sm:p-3 md:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                  {album.name}
                </h3>
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
