import React from "react";

export default function SearchHeader({ query, hasResults, source }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-3xl font-bold text-start">
        {query ? `Search Results for "${query}"` : "Search for music"}
      </h2>
      {hasResults && (
        <span className="text-xs text-muted">
          via {source === "spotify" ? "Spotify" : "Deezer"}
        </span>
      )}
    </div>
  );
}
