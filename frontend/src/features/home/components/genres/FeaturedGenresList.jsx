import React from "react";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";

export default function FeaturedGenresList({ genres, source, onGenreClick }) {
  return (
    <div className="mb-10">
      <ScrollableSection title="Featured Genres">
        <div className="flex space-x-2 pb-1">
          {genres.map((genre) => (
            <div
              key={genre.id}
              className="flex-shrink-0 w-[160px] sm:w-36 md:w-48 lg:w-46 overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => onGenreClick(genre)}
            >
              <div className="relative h-42 sm:h-32 md:h-36 lg:h-48 lg:w-full">
                <img
                  src={genre.imageUrl || "https://via.placeholder.com/280x280?text=Genre"}
                  alt={genre.displayName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300x300?text=Genre";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 flex items-end">
                  <h3 className="text-white font-bold p-3 text-sm">
                    {genre.displayName}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-4">Source: {source}</p>
      </ScrollableSection>
    </div>
  );
}
