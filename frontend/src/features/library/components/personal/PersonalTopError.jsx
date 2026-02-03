import React from "react";

export default function PersonalTopError({ error }) {
  if (!error) return null;

  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-4 text-start">Your Top Stats</h2>
      <div className="border-muted border rounded-lg p-6 text-center">
        <p className="text-error mb-2">{error}</p>
      </div>
    </div>
  );
}
