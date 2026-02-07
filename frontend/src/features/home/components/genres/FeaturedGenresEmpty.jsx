import React from "react";

export default function FeaturedGenresEmpty({ message }) {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-start">Your Genres</h2>
      <div className="border-muted border rounded-lg p-6 text-center">
        <p className="text-muted mb-2">{message}</p>
        <p className="text-sm text-muted">
          Try listening to more music on Spotify to get personalized genres.
        </p>
      </div>
    </div>
  );
}
