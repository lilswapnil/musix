import React from "react";

export default function GenreAlbumGrid({ albums, source, defaultImage, onAlbumClick }) {
  if (!albums || albums.length === 0) {
    return <div className="text-center py-4 text-muted">No albums found from {source}</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {albums.map((album) => {
        const albumId = album.id;
        const albumName = source === "Spotify" ? album.name : album.title;
        const albumImage =
          source === "Spotify"
            ? album.images && album.images[0]?.url
            : album.cover_xl || album.cover_big || album.cover_medium;
        const artistName =
          source === "Spotify"
            ? album.artists && album.artists[0]?.name
            : album.artist?.name;

        return (
          <div
            key={`${source}-${albumId}`}
            className="glass-card rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-lg"
            onClick={() => onAlbumClick(album, source)}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={albumImage || defaultImage}
                alt={albumName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x300?text=Album";
                }}
              />
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm truncate">{albumName}</h4>
              {artistName && <p className="text-xs text-muted truncate">{artistName}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
