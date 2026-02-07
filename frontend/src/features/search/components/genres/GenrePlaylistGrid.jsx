import React from "react";

export default function GenrePlaylistGrid({
  playlists,
  source,
  defaultImage,
  onPlaylistClick
}) {
  if (!playlists || playlists.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        No playlists found from {source}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {playlists.map((playlist) => {
        const playlistId = playlist.id;
        const playlistName = source === "Spotify" ? playlist.name : playlist.title;
        const playlistImage =
          source === "Spotify"
            ? playlist.images && playlist.images[0]?.url
            : playlist.picture_xl || playlist.picture_big || playlist.picture_medium;
        const ownerName =
          source === "Spotify"
            ? playlist.owner?.display_name || "Spotify"
            : playlist.user?.name || "Deezer";
        const trackCount =
          source === "Spotify" ? playlist.tracks?.total || 0 : playlist.nb_tracks || 0;

        return (
          <div
            key={`${source}-${playlistId}`}
            className="glass-card rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 shadow-lg"
            onClick={() => onPlaylistClick(playlist, source)}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={playlistImage || defaultImage}
                alt={playlistName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/300x300?text=Playlist";
                }}
              />
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm truncate">{playlistName}</h4>
              <p className="text-xs text-muted truncate">By {ownerName}</p>
              <p className="text-xs text-muted">{trackCount} tracks</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
