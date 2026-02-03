import React from "react";

export default function NewReleasesEmpty() {
  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
      <div className="border-muted border rounded-lg p-6 text-center">
        <p className="text-muted mb-4">No new releases available</p>
      </div>
    </div>
  );
}
