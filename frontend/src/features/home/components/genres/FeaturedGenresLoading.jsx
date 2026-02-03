import React from "react";

export default function FeaturedGenresLoading() {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-start">Your Genres</h2>
      <div className="flex justify-center items-center h-32 sm:h-44">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-accent">Loading your genres...</p>
        </div>
      </div>
    </div>
  );
}
