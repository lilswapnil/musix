import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faMusic, faHeadphones, faCompactDisc } from "@fortawesome/free-solid-svg-icons";

export default function GenreHeader({
  decodedGenreName,
  genreImage,
  genreObject,
  defaultImage,
  onGoBack
}) {
  return (
    <>
      <button
        onClick={onGoBack}
        className="flex items-center text-muted hover:text-white mb-6 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Back
      </button>

      <div className="flex flex-col md:flex-row mb-8 glass rounded-lg p-4 md:p-6 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
            style={{ backgroundImage: `url(${genreImage})` }}
          ></div>
          <div className="absolute inset-0 bg-primary-dark/70"></div>
        </div>

        <div className="w-full md:w-48 lg:w-64 xl:w-80 flex-shrink-0 mb-4 md:mb-0 md:mr-6 relative z-10">
          <div className="aspect-square w-full rounded-lg overflow-hidden shadow-xl">
            <img
              src={genreImage}
              alt={decodedGenreName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultImage;
              }}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between relative z-10 text-start">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
              {decodedGenreName}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm m-2">
              <div className="flex items-center text-muted">
                <FontAwesomeIcon icon={faMusic} className="mr-2" />
                Music Genre
              </div>

              {genreObject?.popularity && (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faHeadphones} className="mr-2" />
                  Popularity: {genreObject.popularity}
                </div>
              )}

              {genreObject?.yearRange && (
                <div className="flex items-center text-muted">
                  <FontAwesomeIcon icon={faCompactDisc} className="mr-2" />
                  Popular: {genreObject.yearRange}
                </div>
              )}
            </div>

            <p className="text-white/80 mt-4 max-w-2xl">
              {genreObject?.description ||
                `Explore ${decodedGenreName} music and discover new artists, songs, and albums in this genre.`}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href={`https://www.deezer.com/search/${encodeURIComponent(
                decodedGenreName
              )}/genre`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/80 border-2 border-muted hover:border-accent text-white px-4 py-3 rounded-md inline-block transition-colors"
            >
              Find on Deezer
            </a>
            <a
              href={`https://open.spotify.com/search/${encodeURIComponent(
                decodedGenreName
              )}/genres`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-spotify hover:bg-[#1DB954]/80 text-white px-4 py-3 rounded-md inline-block transition-colors"
            >
              Explore on Spotify
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
