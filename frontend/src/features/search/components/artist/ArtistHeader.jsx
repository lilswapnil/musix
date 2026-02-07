import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faMusic } from "@fortawesome/free-solid-svg-icons";

export default function ArtistHeader({
  artist,
  albums,
  topTracks,
  onAlbumClick,
  formatFanCount
}) {
  if (!artist) return null;

  const latestAlbum = albums.length
    ? [...albums].sort(
        (a, b) =>
          new Date(b.releaseDate || "1900-01-01") -
          new Date(a.releaseDate || "1900-01-01")
      )[0]
    : null;

  return (
    <div
      className="flex flex-col mb-6 rounded-lg p-4 relative overflow-hidden shadow-lg"
      style={{ aspectRatio: "2/1" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${
              artist.picture_xl ||
              artist.picture_big ||
              artist.picture_medium ||
              artist.picture
            })`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px"
          }}
        ></div>
      </div>

      <div className="flex-grow"></div>

      <div className="relative flex flex-col ml-6 md:flex-row items-start md:items-start justify-center py-4 md:py-6 mt-auto">
        <div className="text-center md:text-left z-10 flex-1">
          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-black text-white mb-2"
            style={{
              textShadow:
                "2px 2px 8px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)"
            }}
          >
            {artist.name}
          </h1>

          <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6 justify-center md:justify-start">
            {artist.nb_fan > 0 && (
              <div className="flex items-center justify-center md:justify-start text-white drop-shadow">
                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                {formatFanCount(artist.nb_fan)} fans
              </div>
            )}

            {latestAlbum && (
              <div
                className="flex items-center justify-center md:justify-start text-white drop-shadow cursor-pointer group"
                onClick={() => onAlbumClick(latestAlbum.id)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-2 overflow-hidden rounded">
                    <img
                      src={latestAlbum.coverArt}
                      alt={latestAlbum.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-accent">Latest Release</span>
                    <div className="flex items-center">
                      <span className="group-hover:underline">
                        {latestAlbum.name}
                      </span>
                      <span className="text-xs text-muted ml-2">
                        {latestAlbum.releaseDate &&
                          `(${latestAlbum.releaseDate.substring(0, 4)})`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!latestAlbum && topTracks.length > 0 && (
              <div className="flex items-center justify-center md:justify-start text-white drop-shadow">
                <FontAwesomeIcon icon={faMusic} className="mr-2" />
                {topTracks.length} top tracks
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center md:justify-start">
            <a
              href={artist.link || `https://www.deezer.com/artist/${artist.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/80 border border-white hover:border-accent text-white px-3 py-2 text-sm rounded-md inline-block transition-colors shadow-md"
            >
              Listen on Deezer
            </a>
            <a
              href={`https://open.spotify.com/search/${encodeURIComponent(
                artist.name
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-spotify hover:bg-[#1DB954]/80 text-white px-3 py-2 text-sm rounded-md inline-block transition-colors shadow-md"
            >
              Play on Spotify
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
