import React from "react";

export default function TopAlbumsEmpty({ message }) {
  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold mb-4 text-start">Trending Albums</h2>
      <div className="border-muted border rounded-lg p-6 text-center">
        <p className="text-error mb-4">{message}</p>
      </div>
    </div>
  );
}
