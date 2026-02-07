import React from "react";

export default function NowPlayingEmpty() {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
      <div className="text-center p-8 glass-light rounded-lg shadow-lg">
        <p className="text-lg text-muted">No track is currently playing.</p>
        <p className="text-sm mt-2">Play some music on Spotify!</p>
      </div>
    </div>
  );
}
