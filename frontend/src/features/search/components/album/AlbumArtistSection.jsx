import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCompactDisc } from "@fortawesome/free-solid-svg-icons";

export default function AlbumArtistSection({
  artistData,
  album,
  artistImage,
  spotifyArtistData,
  onArtistClick
}) {
  if (!artistData) return null;

  const albumArtist = album?.artist;

  return (
    <div className="mb-8">
      <h3 className="text-3xl font-semibold mb-4 text-start">About the Artist</h3>
      <div className="glass rounded-lg p-4 md:p-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
            <img
              src={artistImage || albumArtist?.picture_medium}
              alt={albumArtist?.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h4
              className="text-2xl font-bold text-white mb-2 hover:underline cursor-pointer"
              onClick={() => albumArtist?.id && onArtistClick(albumArtist.id)}
            >
              {albumArtist?.name}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {albumArtist?.nb_fan > 0 && (
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-muted text-sm">Fans</span>
                  <span className="text-white text-xl font-semibold">
                    {albumArtist.nb_fan >= 1000000
                      ? `${(albumArtist.nb_fan / 1000000).toFixed(1)}M`
                      : albumArtist.nb_fan >= 1000
                      ? `${(albumArtist.nb_fan / 1000).toFixed(0)}K`
                      : albumArtist.nb_fan}
                  </span>
                </div>
              )}

              {spotifyArtistData?.followers?.total > 0 && (
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-muted text-sm">Spotify Followers</span>
                  <span className="text-white text-xl font-semibold">
                    {spotifyArtistData.followers.total >= 1000000
                      ? `${(spotifyArtistData.followers.total / 1000000).toFixed(
                          1
                        )}M`
                      : spotifyArtistData.followers.total >= 1000
                      ? `${(spotifyArtistData.followers.total / 1000).toFixed(0)}K`
                      : spotifyArtistData.followers.total}
                  </span>
                </div>
              )}

              {albumArtist?.nb_album > 0 && (
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-muted text-sm">Albums</span>
                  <span className="text-white text-xl font-semibold">
                    {albumArtist.nb_album}
                  </span>
                </div>
              )}

              {spotifyArtistData?.popularity > 0 && (
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-muted text-sm">Spotify Popularity</span>
                  <div className="flex items-center gap-2">
                    <div className="w-full max-w-[100px] bg-muted/30 rounded-full h-2">
                      <div
                        className="bg-spotify h-2 rounded-full"
                        style={{ width: `${spotifyArtistData.popularity}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-semibold">
                      {spotifyArtistData.popularity}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {spotifyArtistData?.genres && spotifyArtistData.genres.length > 0 && (
              <div className="mb-4">
                <span className="text-muted text-sm">Genres:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {spotifyArtistData.genres.slice(0, 5).map((genre, index) => (
                    <span
                      key={index}
                      className="bg-primary-light/50 text-white text-xs px-3 py-1 rounded-full border border-muted/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 md:mt-3">
              <button
                onClick={() => albumArtist?.id && onArtistClick(albumArtist.id)}
                className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                View Artist Profile
              </button>

              {albumArtist?.link && (
                <a
                  href={albumArtist.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary/50 hover:bg-primary/70 border border-muted text-white px-4 py-2 rounded-md inline-flex items-center transition-colors ml-3"
                >
                  Listen on Deezer
                </a>
              )}

              {albumArtist?.name && (
                <a
                  href={`https://open.spotify.com/search/${encodeURIComponent(
                    albumArtist.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-spotify hover:bg-[#1DB954]/80 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors ml-3"
                >
                  Find on Spotify
                </a>
              )}
            </div>
          </div>
        </div>

        {albumArtist?.nb_album > 0 && (
          <div className="mt-8">
            <h5 className="text-xl font-medium text-white mb-4">
              Check out more albums by {albumArtist.name}
            </h5>
            <div className="flex justify-center md:justify-start">
              <button
                onClick={() => albumArtist?.id && onArtistClick(albumArtist.id)}
                className="bg-primary-light/50 hover:bg-primary-light/80 text-white px-4 py-2 rounded-md transition-colors"
              >
                <FontAwesomeIcon icon={faCompactDisc} className="mr-2" />
                View All Albums
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
