import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function RecentPlayedGroupSection({
  groupName,
  tracks,
  likedSongs,
  onLike,
  onSongClick
}) {
  return (
    <div className="mb-6">
      <ScrollableSection
        title={<h3 className="text-xl font-semibold text-start">{groupName}</h3>}
      >
        <div className="flex space-x-2">
          {Array.from({ length: Math.ceil(tracks.length / 4) }).map(
            (_, groupIndex) => {
              const groupTracks = tracks.slice(
                groupIndex * 4,
                groupIndex * 4 + 4
              );
              return (
                <div
                  key={groupIndex}
                  className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[400px] lg:w-[390px]"
                >
                  {groupTracks.map((item, index) => (
                    <div
                      key={`${item.track.id}-${index}`}
                      className="flex items-center mb-2 last:mb-0 border-muted border p-2 rounded hover:bg-opacity-90 transition-colors cursor-pointer"
                      onClick={() => {
                        void onSongClick(item.track);
                      }}
                    >
                      <div className="w-12 h-12 flex-shrink-0">
                        <img
                          src={item.track.album.images[0]?.url}
                          alt={item.track.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>

                      <div className="ml-3 flex-grow min-w-0 text-start text-white">
                        <div className="font-semibold truncate">{item.track.name}</div>
                        <div className="text-xs truncate">
                          {item.track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </div>
                      </div>

                      <button
                        className="ml-2 p-2 rounded-full hover:bg-muted/20 transition-colors"
                        onClick={(e) => onLike(item.track.id, e)}
                        aria-label={
                          likedSongs[item.track.id] ? "Unlike" : "Like"
                        }
                      >
                        <FontAwesomeIcon
                          icon={faHeart}
                          className={`${
                            likedSongs[item.track.id]
                              ? "text-red-500"
                              : "text-muted"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              );
            }
          )}
        </div>
      </ScrollableSection>
    </div>
  );
}
