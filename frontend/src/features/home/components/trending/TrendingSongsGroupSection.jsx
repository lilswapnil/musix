import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function TrendingSongsGroupSection({
  groupName,
  songs,
  navigate,
  currentlyPlaying,
  likedSongs,
  onPlayPause,
  onLike
}) {
  return (
    <div className="mb-8">
      <ScrollableSection
        title={<h3 className="text-2xl font-semibold text-start">{groupName}</h3>}
      >
        <div className="flex space-x-2 ">
          {Array.from({ length: Math.ceil(songs.length / 4) }).map(
            (_, groupIndex) => {
              const groupTracks = songs.slice(
                groupIndex * 4,
                groupIndex * 4 + 4
              );
              return (
                <div
                  key={groupIndex}
                  className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
                >
                  {groupTracks.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded glass-hover transition-all cursor-pointer"
                      onClick={() => {
                        if (song.source === "spotify" && song.externalUrl) {
                          window.open(
                            song.externalUrl,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        } else {
                          navigate(`/song/${song.id}`);
                        }
                      }}
                    >
                      <div className="w-12 h-12 flex-shrink-0 relative group">
                        <img
                          src={song.albumArt}
                          alt={song.name}
                          className="w-full h-full object-cover rounded"
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
                                currentlyPlaying === song.id ? faPause : faPlay
                              }
                              className="text-white"
                            />
                          </button>
                        )}
                      </div>

                      <div className="ml-3 flex-grow min-w-0">
                        <div className="font-semibold text-start text-white truncate">
                          {song.name}
                        </div>
                        <div className="text-xs truncate flex items-center">
                          {song.artist}
                        </div>
                      </div>

                      <button
                        className="ml-2 p-2 rounded-full hover:bg-muted/20 transition-colors"
                        onClick={(e) => onLike(song.id, e)}
                        aria-label={likedSongs[song.id] ? "Unlike" : "Like"}
                      >
                        <FontAwesomeIcon
                          icon={faHeart}
                          className={`${
                            likedSongs[song.id] ? "text-red-500" : "text-muted"
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
