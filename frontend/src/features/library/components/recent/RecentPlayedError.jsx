import React from "react";

export default function RecentPlayedError({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center my-8">
      <p className="text-error mb-2">{message}</p>
      <button
        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
        onClick={onRetry}
      >
        Try Again
      </button>
    </div>
  );
}
