import React from "react";

export default function SearchError({ error }) {
  if (!error) return null;

  return (
    <div className="bg-primary-light/50 p-4 mb-6 rounded-lg text-center">
      <p className="text-amber-500 mb-2">{error}</p>
      {error.includes("quickly") && (
        <p className="text-xs text-muted">
          Our API has rate limits to prevent overuse
        </p>
      )}
    </div>
  );
}
