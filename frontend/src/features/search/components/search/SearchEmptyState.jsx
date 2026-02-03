import React from "react";

export default function SearchEmptyState({ query, hasResults }) {
  if (hasResults) return null;

  if (query) {
    return (
      <div className="text-center p-8 glass-light rounded-lg shadow-lg">
        <p className="text-lg text-muted">No results found for "{query}"</p>
        <p className="text-sm mt-2">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="text-center p-8 glass-light rounded-lg shadow-lg">
      <p className="text-lg text-muted">Enter a search query to find music</p>
      <p className="text-sm mt-2">Search for your favorite artists, songs, or albums</p>
    </div>
  );
}
