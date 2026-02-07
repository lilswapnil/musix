import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause, faClock } from "@fortawesome/free-solid-svg-icons";

export default function AlbumTracksSection({
  tracks,
  currentlyPlaying,
  likedSongs,
  onSongClick,
  onPlayPause,
  onLike,
  formatTime
}) {
  return (
    <div className="mb-8">
      <h3 className="text-3xl font-semibold mb-4 text-start">Tracks</h3>

      <div className="hidden md:grid grid-cols-12 border-b border-muted/30 pb-2 mb-2 text-muted text-sm">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5 text-start">Title</div>
        <div className="col-span-4 text-start">Artist</div>
        <div className="col-span-1 text-center">
          <FontAwesomeIcon icon={faClock} />
        </div>
        <div className="col-span-1 text-center">
          <FontAwesomeIcon icon={faHeart} />
        </div>
      </div>

      {tracks.length > 0 ? (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`grid grid-cols-12 items-center py-2 px-2 rounded-md glass-hover transition-all ${
                currentlyPlaying === track.id ? "glass" : ""
              }`}
              onClick={() => onSongClick(track.id)}
            >
              <div className="col-span-1 text-center relative group">
                <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
                  <span className="group-hover:opacity-0 transition-opacity">
                    {track.trackNumber}
                  </span>
                  {track.previewUrl && (
                    <button
                      onClick={(e) => onPlayPause(track.id, track.previewUrl, e)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={
                        currentlyPlaying === track.id ? "Pause" : "Play"
                      }
                    >
                      <FontAwesomeIcon
                        icon={currentlyPlaying === track.id ? faPause : faPlay}
                        className="text-accent"
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-11 md:col-span-5 text-white font-medium truncate pl-2 md:pl-0 text-start">
                {track.name}
              </div>

              <div className="hidden md:block col-span-4 text-accent text-sm truncate text-start">
                {track.artist}
              </div>

              <div className="hidden md:flex col-span-1 justify-center text-muted text-sm">
                {formatTime(track.duration)}
              </div>

              <div className="hidden md:flex col-span-1 justify-center">
                <button
                  className="p-1 hover:bg-muted/10 rounded-full transition-colors"
                  onClick={(e) => onLike(track.id, e)}
                  aria-label={likedSongs[track.id] ? "Unlike" : "Like"}
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    className={`${
                      likedSongs[track.id] ? "text-red-500" : "text-muted"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-primary-light/20 rounded-md">
          <p className="text-muted">No tracks available</p>
        </div>
      )}
    </div>
  );
}
