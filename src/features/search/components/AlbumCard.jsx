import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AlbumCard({ album }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/album/${album.id}`);
  };

  return (
    <div
      className="flex-shrink-0 w-64 md:w-72 lg:w-80 cursor-pointer group perspective-1000"
      onClick={handleClick}
    >
      {/* Album container with vinyl record effect */}
      <div className="relative w-full aspect-square mb-4">
        {/* Vinyl Record - positioned behind and slides out on hover */}
        <div className="absolute top-0 right-0 w-full h-full transition-transform duration-500 ease-out group-hover:translate-x-8 z-0">
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 shadow-2xl overflow-hidden">
            {/* Vinyl grooves effect */}
            <div className="absolute inset-0 opacity-40">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-gray-700"
                  style={{
                    top: `${5 + i * 4.5}%`,
                    left: `${5 + i * 4.5}%`,
                    right: `${5 + i * 4.5}%`,
                    bottom: `${5 + i * 4.5}%`,
                  }}
                />
              ))}
            </div>

            {/* Center label with stars/moon design */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-gray-600 flex items-center justify-center shadow-inner">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Stars pattern */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white text-xs">★</div>
                <div className="absolute top-1/3 right-2 text-white text-xs">★</div>
                <div className="absolute top-1/3 left-2 text-white text-xs">★</div>
                <div className="absolute bottom-1/3 right-3 text-white text-xs">★</div>
                <div className="absolute bottom-1/3 left-3 text-white text-xs">★</div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-sm">☽</div>
                {/* Center hole */}
                <div className="absolute w-4 h-4 rounded-full bg-gray-900 border border-gray-700"></div>
              </div>
            </div>

            {/* Vinyl shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>
          </div>
        </div>

        {/* Album Cover - positioned in front */}
        <div className="absolute top-0 left-0 w-full h-full transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-105 z-10">
          <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
            <img
              src={album.coverArt || album.cover_big || album.cover_medium || album.cover || "https://via.placeholder.com/400x400?text=No+Cover"}
              alt={album.title || album.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/400x400?text=No+Cover";
              }}
            />
            {/* Parental Advisory label if needed */}
            {album.explicit_lyrics && (
              <div className="absolute bottom-2 right-2 bg-black text-white text-[8px] px-2 py-1 font-bold">
                PARENTAL<br/>ADVISORY<br/>EXPLICIT CONTENT
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* Album Info */}
      <div className="text-center px-2">
        <h3 className="font-bold text-white text-base md:text-lg truncate mb-1 group-hover:text-accent transition-colors">
          {album.title || album.name}
        </h3>
        <p className="text-sm text-muted truncate mb-1">
          {album.artist}
        </p>
        {album.releaseDate && (
          <p className="text-xs text-muted/70">
            {album.releaseDate.substring(0, 4)}
          </p>
        )}
        {album.trackCount && (
          <p className="text-xs text-muted/70 mt-1">
            {album.trackCount} tracks
          </p>
        )}
      </div>
    </div>
  );
}
