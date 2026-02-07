import React from "react";

export default function LibraryLoading() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-accent">Loading your library...</p>
      </div>
    </div>
  );
}
