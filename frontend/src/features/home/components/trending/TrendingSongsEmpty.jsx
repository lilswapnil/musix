import React from "react";

export default function TrendingSongsEmpty() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-start">Trending Now</h2>
      <div className="text-center p-8 glass-light rounded-lg shadow-lg">
        <p className="text-lg text-muted">No trending tracks available right now.</p>
        <p className="text-sm mt-2">Check back soon for the latest hits!</p>
      </div>
    </div>
  );
}
