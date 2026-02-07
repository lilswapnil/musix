import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep
} from "@fortawesome/free-solid-svg-icons";

export default function NowPlayingCard({
  currentTrack,
  artistImage,
  liked,
  onLike,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious
}) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
      <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/50">
            {(artistImage || currentTrack.album.images[0]?.url) && (
              <img
                src={artistImage || currentTrack.album.images[0].url}
                alt={currentTrack.artists[0]?.name || currentTrack.album.name}
                className="w-full h-full object-cover opacity-50 blur-sm scale-110"
              />
            )}
          </div>
        </div>

        <div className="relative z-10 p-4 sm:p-8 flex flex-col sm:flex-row">
          <div className="mx-auto sm:mx-0 mb-4 sm:mb-0 sm:mr-6 md:mr-8 flex-shrink-0">
            {currentTrack.album.images[0]?.url ? (
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 object-cover shadow-lg rounded-lg"
              />
            ) : (
              <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-primary-dark flex items-center justify-center rounded-lg">
                <FontAwesomeIcon icon={faPlay} className="text-4xl text-muted" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-end text-center sm:text-start">
            <div>
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1">
                  <h2 className="text-l sm:text-2xl md:text-3xl font-bold text-white mb-2 truncate">
                    {currentTrack.name}
                  </h2>
                  <p className="text-lg sm:text-xl text-white/80 mb-1">
                    {currentTrack.artists.map((artist) => artist.name).join(", ")}
                  </p>
                  <p className="text-white sm:block hidden">{currentTrack.album.name}</p>
                </div>

              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start gap-3">
              <button
                type="button"
                onClick={onPrevious}
                className="h-12 w-12 rounded-full bg-primary/20 hover:bg-primary/30 text-white transition-colors flex items-center justify-center"
                aria-label="Previous track"
              >
                <FontAwesomeIcon icon={faBackwardStep} />
              </button>
              <button
                type="button"
                onClick={onPlayPause}
                className="h-12 w-12 rounded-full bg-accent hover:bg-accent/80 text-primary transition-colors flex items-center justify-center"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="h-12 w-12 rounded-full bg-primary/20 hover:bg-primary/30 text-white transition-colors flex items-center justify-center"
                aria-label="Next track"
              >
                <FontAwesomeIcon icon={faForwardStep} />
              </button>
              <button
                type="button"
                onClick={onLike}
                className="h-12 w-12 rounded-full hover:bg-text/20 text-white transition-colors flex items-center justify-center"
                aria-label={liked ? "Unlike" : "Like"}
              >
                <FontAwesomeIcon
                  icon={faHeart}
                  className={`text-xl ${liked ? "text-red-500" : "text-white"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
