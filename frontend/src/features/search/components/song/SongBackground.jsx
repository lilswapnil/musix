import React from "react";

export default function SongBackground({ albumArt }) {
  const backgroundUrl =
    albumArt || "https://via.placeholder.com/1200x1200?text=Music";

  return (
    <div className="fixed inset-0 z-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      />
    </div>
  );
}
