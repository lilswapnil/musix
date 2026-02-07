import React from "react";

export default function NowPlayingError({ message, onRetry }) {
  return (
    <div className="mb-12 mt-4">
      <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
      <div className="glass p-6 text-center rounded-lg shadow-lg">
        <p className="text-error mb-4">{message}</p>
        <button
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
          onClick={onRetry}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
