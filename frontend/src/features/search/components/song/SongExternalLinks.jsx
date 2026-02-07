import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt, faFileAlt } from "@fortawesome/free-solid-svg-icons";

export default function SongExternalLinks({
  song,
  geniusSong,
  showGeniusSearchLink
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <a
        href={song.link}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
      >
        Listen on Deezer
        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
      </a>

      <a
        href={`https://open.spotify.com/search/${encodeURIComponent(
          `${song.name} ${song.artist}`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#1DB954]/20 hover:bg-[#1DB954]/40 border border-[#1DB954]/50 text-white px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
      >
        Play on Spotify
      </a>

      {!geniusSong && showGeniusSearchLink && (
        <a
          href={`https://genius.com/search?q=${encodeURIComponent(
            `${song.name} ${song.artist}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-yellow-400/20 hover:bg-yellow-400/40 border border-yellow-400/50 text-white px-3 py-1.5 text-xs rounded-full inline-flex items-center gap-1.5 transition-all"
        >
          <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
          Find Lyrics
        </a>
      )}
    </div>
  );
}
