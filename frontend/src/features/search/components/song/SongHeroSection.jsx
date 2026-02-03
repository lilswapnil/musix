import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlay, faPause, faCompactDisc } from "@fortawesome/free-solid-svg-icons";

export default function SongHeroSection({
  song,
  isPlaying,
  liked,
  onPlayPause,
  onLike,
  onArtistClick,
  onAlbumClick,
  formatTime
}) {
  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full min-h-[70vh]">
      <div className="relative mb-6 group">
        <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-lg overflow-hidden shadow-2xl">
          <img
            src={song.albumArt || "https://via.placeholder.com/400x400?text=Album"}
            alt={song.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/400x400?text=Album";
            }}
          />
        </div>

        {song.previewUrl && (
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <FontAwesomeIcon
                icon={isPlaying ? faPause : faPlay}
                className="text-white text-2xl ml-1"
              />
            </div>
          </button>
        )}
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
          {song.name}
        </h1>

        <h2
          className="text-lg sm:text-xl text-white/80 hover:text-accent cursor-pointer transition-colors mb-1"
          onClick={onArtistClick}
        >
          {song.artist || "Unknown Artist"}
        </h2>

        {song.album && (
          <p
            className="text-white/60 text-sm hover:text-white/80 cursor-pointer transition-colors"
            onClick={onAlbumClick}
          >
            {song.album}
          </p>
        )}

        {song.duration && (
          <p className="text-white/50 text-xs mt-1 flex items-center justify-center gap-1">
            <FontAwesomeIcon icon={faCompactDisc} className="text-xs" />
            {formatTime(song.duration)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {song.previewUrl && (
          <button
            onClick={onPlayPause}
            className="bg-accent hover:bg-accent/80 text-black px-5 py-2 text-sm rounded-full inline-flex items-center gap-2 transition-all shadow-lg hover:scale-105"
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            {isPlaying ? "Pause" : "Play Preview"}
          </button>
        )}

        <button
          onClick={onLike}
          className={`${
            liked ? "bg-red-500/20 border-red-500" : "bg-white/10 border-white/30"
          } hover:bg-white/20 border px-5 py-2 text-sm rounded-full inline-flex items-center gap-2 transition-all shadow-lg hover:scale-105`}
        >
          <FontAwesomeIcon
            icon={faHeart}
            className={liked ? "text-red-500" : "text-white"}
          />
          <span className="text-white">{liked ? "Liked" : "Like"}</span>
        </button>
      </div>
    </div>
  );
}
