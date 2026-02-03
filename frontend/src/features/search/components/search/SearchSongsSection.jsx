import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function SearchSongsSection({
  groupedSongs,
  currentlyPlaying,
  likedSongs,
  onPlayPause,
  onLike,
  onSongClick
}) {
  return (
    <>
      {Object.entries(groupedSongs).map(([groupName, groupSongs]) => (
        <div key={groupName} className="mb-8">
          <ScrollableSection
            title={<h3 className="text-2xl font-semibold text-start">{groupName}</h3>}
          >
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(groupSongs.length / 4) }).map(
                (_, groupIndex) => {
                  const groupTracks = groupSongs.slice(
                    groupIndex * 4,
                    groupIndex * 4 + 4
                  );
                  return (
                    <div
                      key={groupIndex}
                      className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
                    >
                      {groupTracks.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded glass-hover transition-all cursor-pointer"
                          onClick={() => onSongClick(song.id)}
                        >
                          <div className="w-12 h-12 flex-shrink-0 relative group">
                            <img
                              src={song.albumArt}
                              alt={song.name}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://via.placeholder.com/300x300?text=No+Image";
                              }}
                            />
                            {song.previewUrl && (
                              <button
                                onClick={(e) =>
                                  onPlayPause(song.id, song.previewUrl, e)
                                }
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                              >
                                <FontAwesomeIcon
                                  icon={
                                    currentlyPlaying === song.id
                                      ? faPause
                                      : faPlay
                                  }
                                  className="text-white"
                                />
                              </button>
                            )}
                          </div>

                          <div className="ml-3 flex-grow min-w-0 text-start">
                            <div className="font-semibold text-white truncate">
                              {song.name}
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-muted truncate">
                                {song.artist}
                              </div>
                            </div>
                          </div>

                          <button
                            className="ml-2 p-2 rounded-full hover:bg-muted/20 transition-colors"
                            onClick={(e) => onLike(song.id, e)}
                            aria-label={
                              likedSongs[song.id] ? "Unlike" : "Like"
                            }
                          >
                            <FontAwesomeIcon
                              icon={faHeart}
                              className={`${
                                likedSongs[song.id]
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
      ))}
    </>
  );
}
