import React from "react";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function FeaturedPlaylistsList({ playlists, onPlaylistClick }) {
  return (
    <ScrollableSection title="Featured Playlists">
      <div className="flex space-x-2 pb-1">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden glass-hover transition-all cursor-pointer group border-muted rounded"
            onClick={() => onPlaylistClick(playlist)}
          >
            <div className="relative">
              <img
                src={playlist.coverArt}
                alt={playlist.title}
                className="w-full h-32 sm:h-40 md:h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="p-2 sm:p-3 md:p-4">
              <div className="text-center">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                  {playlist.title}
                </h3>
                {playlist.tracksCount > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
                    {playlist.tracksCount} tracks
                  </p>
                )}
                {playlist.description && (
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1 truncate">
                    {playlist.description}
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
