import React from "react";

export default function TrendingSongsLoading() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-4 text-start">Trending Now</h2>
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-accent">Loading trending songs...</p>
        </div>
      </div>
    </div>
  );
}
