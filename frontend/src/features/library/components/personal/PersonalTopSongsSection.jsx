import React from "react";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function PersonalTopSongsSection({ topTracks, onSongClick }) {
  return (
    <ScrollableSection title="Songs">
      <div className="flex space-x-2">
        {Array.from({ length: Math.ceil(topTracks.length / 4) }).map(
          (_, groupIndex) => {
            const groupTracks = topTracks.slice(
              groupIndex * 4,
              groupIndex * 4 + 4
            );
            return (
              <div
                key={groupIndex}
                className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
              >
                {groupTracks.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className="flex items-center mb-2 last:mb-0 border-muted border p-2 rounded hover:bg-opacity-90 transition-colors cursor-pointer"
                    onClick={() => onSongClick(track)}
                  >
                    <div className="w-12 h-12 flex-shrink-0">
                      <img
                        src={track.album?.images?.[0]?.url}
                        alt={track.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="ml-3 flex-grow min-w-0 text-start text-white">
                      <div className="font-semibold truncate">{track.name}</div>
                      <div className="text-xs truncate">
                        {track.artists?.map((a) => a.name).join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }
        )}
      </div>
    </ScrollableSection>
  );
}
