import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

export default function SongLyricsBanner({ geniusSong }) {
  if (!geniusSong) return null;

  return (
    <a
      href={geniusSong.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full max-w-sm glass p-4 rounded-lg hover:bg-white/20 transition-all group cursor-pointer mb-6"
    >
      <div className="flex items-center gap-3">
        {geniusSong.thumbnail && (
          <img
            src={geniusSong.thumbnail}
            alt="Genius"
            className="w-12 h-12 rounded-md object-cover"
          />
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <FontAwesomeIcon icon={faFileAlt} className="text-yellow-400 text-xs" />
            <span className="text-yellow-400 text-xs font-medium">View Lyrics</span>
          </div>
          <p className="text-white text-sm font-semibold truncate">{geniusSong.title}</p>
          <p className="text-white/60 text-xs truncate">{geniusSong.artist}</p>
        </div>
        <FontAwesomeIcon
          icon={faExternalLinkAlt}
          className="text-white/40 group-hover:text-white transition-colors text-sm"
        />
      </div>
    </a>
  );
}
