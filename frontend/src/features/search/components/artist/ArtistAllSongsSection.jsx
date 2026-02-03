import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function ArtistAllSongsSection({
  allSongs,
  hasMoreSongs,
  loadingMoreSongs,
  onLoadMore,
  currentlyPlaying,
  likedSongs,
  onPlayPause,
  onLike,
  onAlbumClick,
  onSongClick
}) {
  if (!allSongs.length) return null;

  return (
    <div className="mb-8">
      <ScrollableSection
        title={<h3 className="text-2xl font-semibold text-start">Songs</h3>}
        onLoadMore={hasMoreSongs ? onLoadMore : null}
        loadingMore={loadingMoreSongs}
      >
        <div className="flex space-x-2">
          {Array.from({ length: Math.ceil(allSongs.length / 4) }).map(
            (_, groupIndex) => {
              const groupTracks = allSongs.slice(
                groupIndex * 4,
                groupIndex * 4 + 4
              );
              return (
                <div
                  key={groupIndex}
                  className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[340px] lg:w-[390px]"
                >
                  {groupTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center mb-3 last:mb-0 border-muted border p-2 rounded hover:glass transition-all cursor-pointer"
                      onClick={() => onSongClick(track.id)}
                    >
                      <div className="w-12 h-12 flex-shrink-0 relative group">
                        <img
                          src={track.albumArt}
                          alt={track.name}
                          className="w-full h-full object-cover rounded"
                        />
                        {track.previewUrl && (
                          <button
                            onClick={(e) =>
                              onPlayPause(track.id, track.previewUrl, e)
                            }
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          >
                            <FontAwesomeIcon
                              icon={
                                currentlyPlaying === track.id ? faPause : faPlay
                              }
                              className="text-white"
                            />
                          </button>
                        )}
                      </div>

                      <div className="ml-3 flex-grow min-w-0 text-start">
                        <div className="font-semibold text-white truncate">
                          {track.name}
                        </div>
                        <div className="flex justify-between">
                          <div className="text-xs text-accent truncate">
                            {track.albumId ? (
                              <span
                                className="cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAlbumClick(track.albumId);
                                }}
                              >
                                {track.albumName}
                              </span>
                            ) : (
                              track.albumName
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        className="ml-2 p-1.5 rounded-full hover:bg-muted/20 transition-colors"
                        onClick={(e) => onLike(track.id, e)}
                        aria-label={likedSongs[track.id] ? "Unlike" : "Like"}
                      >
                        <FontAwesomeIcon
                          icon={faHeart}
                          className={`${
                            likedSongs[track.id] ? "text-red-500" : "text-muted"
                          } text-sm`}
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
