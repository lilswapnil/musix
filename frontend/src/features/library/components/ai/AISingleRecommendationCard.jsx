import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

export default function AISingleRecommendationCard({
  recommendation,
  onPlayNow,
  onAddToQueue
}) {
  return (
    <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg group">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/50">
          {recommendation.album?.images?.[0]?.url && (
            <img
              src={recommendation.album.images[0].url}
              alt={recommendation.album.name}
              className="w-full h-full object-cover opacity-50 blur-sm scale-110"
            />
          )}
        </div>
      </div>

      <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row">
        <div className="mx-auto sm:mx-0 mb-4 sm:mb-0 sm:mr-6 md:mr-8 flex-shrink-0">
          {recommendation.album?.images?.[0]?.url ? (
            <img
              src={recommendation.album.images[0].url}
              alt={recommendation.album.name}
              className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 object-cover shadow-lg rounded-lg"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 glass-light flex items-center justify-center rounded-lg">
              <FontAwesomeIcon icon={faPlay} className="text-4xl text-muted" />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end text-center sm:text-start">
          <div>
            <div className="flex flex-col sm:flex-row items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                    Next Up
                  </span>
                </div>
                <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-white mb-2 truncate">
                  {recommendation.name}
                </h2>
                <p className="text-lg sm:text-lg text-white/80 mb-1">
                  {recommendation.artists?.map((a) => a.name).join(", ")}
                </p>
                <p className="text-white sm:block hidden text-sm">
                  {recommendation.album?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex justify-center sm:justify-start gap-3">
            <button
              onClick={() => onPlayNow(recommendation.uri)}
              className="flex items-center bg-accent hover:bg-accent/80 text-primary py-2 px-4 rounded-full transition-colors font-semibold"
            >
              <FontAwesomeIcon icon={faPlay} className="mr-2" />
              Play Now
            </button>
            <button
              onClick={() => onAddToQueue(recommendation.uri)}
              className="flex items-center bg-accent hover:bg-accent/80 text-primary py-2 px-4 rounded-full transition-colors font-semibold"
            >
              <FontAwesomeIcon icon={faPlay} className="mr-2" />
              Add to Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
