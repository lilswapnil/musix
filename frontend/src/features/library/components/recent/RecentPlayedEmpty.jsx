import React from "react";

export default function RecentPlayedEmpty() {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-6 text-start">Recent Plays</h2>
      <div className="text-center p-8 glass-light rounded-lg shadow-lg">
        <p className="text-lg text-muted">No recently played tracks found.</p>
        <p className="text-sm mt-2">Try playing some music on Spotify!</p>
      </div>
    </div>
  );
}
