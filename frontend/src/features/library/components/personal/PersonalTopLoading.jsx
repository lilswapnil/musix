import React from "react";

export default function PersonalTopLoading() {
  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-4 text-start">Your Top Stats</h2>
      <div className="flex justify-center items-center h-40">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-accent text-sm">Loading your top tracks...</p>
        </div>
      </div>
    </div>
  );
}
