import React from "react";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function TopArtistsList({ artists, onArtistClick }) {
  return (
    <ScrollableSection title="Trending Artists">
      <div className="flex space-x-2 pb-1">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="flex-shrink-0 w-32 sm:w-40 md:w-42 lg:w-48 overflow-hidden cursor-pointer group relative border-muted glass-hover transition-all"
            onClick={() => onArtistClick(artist)}
            style={{ aspectRatio: "1.6/1.7" }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                style={{ backgroundImage: `url(${artist.picture})` }}
              ></div>
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>

            <div className="relative h-full flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative mb-3 border-2 border-white overflow-hidden rounded-full">
                <img
                  src={artist.picture}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center mt-1 z-10">
                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg truncate drop-shadow">
                  {artist.name}
                </h3>
                {artist.fans > 0 && (
                  <p className="text-[10px] sm:text-xs text-white mt-0.5 drop-shadow-lg">
                    {artist.fans.toLocaleString()} fans
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollableSection>
  );
}
