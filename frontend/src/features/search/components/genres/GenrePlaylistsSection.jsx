import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl } from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../../components/common/ui/LoadingSpinner";
import GenrePlaylistGrid from "./GenrePlaylistGrid";

export default function GenrePlaylistsSection({
  decodedGenreName,
  playlistsLoading,
  playlistsError,
  spotifyPlaylists,
  deezerPlaylists,
  defaultImage,
  onPlaylistClick
}) {
  return (
    <div className="mb-8">
      <h3 className="text-3xl font-semibold mb-4 text-start flex items-center">
        <FontAwesomeIcon icon={faListUl} className="mr-3" />
        Playlists in {decodedGenreName}
      </h3>

      {playlistsLoading ? (
        <div className="glass-light rounded-lg p-8 text-center shadow-lg">
          <LoadingSpinner message={`Loading ${decodedGenreName} playlists...`} />
        </div>
      ) : playlistsError ? (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
          <p className="text-error">{playlistsError}</p>
        </div>
      ) : (
        <>
          {spotifyPlaylists.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold mb-4 text-start flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Spotify Playlists
              </h4>
              <GenrePlaylistGrid
                playlists={spotifyPlaylists}
                source="Spotify"
                defaultImage={defaultImage}
                onPlaylistClick={onPlaylistClick}
              />
            </div>
          )}

          {deezerPlaylists.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-semibold mb-4 text-start flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.594v3.027h5.189v-3.027h-5.19zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.81v3.029h5.19V16.81H0zm6.27 0v3.029h5.189V16.81h-5.19zm6.271 0v3.029h5.19V16.81h-5.19zm6.27 0v3.029H24V16.81h-5.19z" />
                </svg>
                Deezer Playlists
              </h4>
              <GenrePlaylistGrid
                playlists={deezerPlaylists}
                source="Deezer"
                defaultImage={defaultImage}
                onPlaylistClick={onPlaylistClick}
              />
            </div>
          )}

          {spotifyPlaylists.length === 0 && deezerPlaylists.length === 0 && (
            <div className="glass-light rounded-lg p-8 text-center shadow-lg">
              <p className="text-muted mb-4">
                No playlists found for {decodedGenreName}
              </p>
              <p className="text-sm text-muted">Try searching for a different genre</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
