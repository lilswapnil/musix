import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";


export default function Artists({ artists }) {
  if (!artists || artists.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-start">Artists</h2>
      
      {/* Mobile view (scrollable horizontal list) */}
      <div className="sm:hidden overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex space-x-3 px-1">
          {artists.slice(0, 8).map((artist) => (
            <div
              key={artist.id}
              className="flex-shrink-0 w-[140px] relative h-44 rounded-lg overflow-hidden shadow-lg group cursor-pointer"
              onClick={() => window.open(artist.external_urls.spotify, '_blank')}
            >
              {/* Background with blur effect */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary/50">
                  {artist.images && artist.images[0] ? (
                    <img 
                      src={artist.images[0]?.url}
                      alt={artist.name}
                      className="w-full h-full object-cover opacity-50 blur-sm scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-light"></div>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                {/* Artist image circle */}
                <div className="mx-auto">
                  {artist.images && artist.images[0] ? (
                    <img 
                      src={artist.images[0]?.url}
                      alt={artist.name}
                      className="w-16 h-16 object-cover rounded-full border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-dark flex items-center justify-center rounded-full">
                      <FontAwesomeIcon icon={faUser} className="text-xl text-muted" />
                    </div>
                  )}
                </div>
                
                {/* Artist info */}
                <div className="text-center">
                  <h3 className="font-bold text-white text-sm truncate">{artist.name}</h3>
                  <p className="text-xxs text-white/80 mt-0.5">
                    {artist.followers.total.toLocaleString()} Followers
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {artist.genres.slice(0, 1).map((genre) => (
                      <span 
                        key={genre} 
                        className="text-xxs bg-white/20 text-white px-1.5 py-0.5 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tablet view (2 columns grid) */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-3">
        {artists.slice(0, 6).map((artist) => (
          <div
            key={artist.id}
            className="relative h-56 rounded-lg overflow-hidden shadow-lg group cursor-pointer"
            onClick={() => window.open(artist.external_urls.spotify, '_blank')}
          >
            {/* Background with blur effect */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary/50">
                {artist.images && artist.images[0] ? (
                  <img 
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    className="w-full h-full object-cover opacity-50 blur-sm scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-light"></div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              {/* Artist image circle */}
              <div className="mx-auto">
                {artist.images && artist.images[0] ? (
                  <img 
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    className="w-24 h-24 object-cover rounded-full border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary-dark flex items-center justify-center rounded-full">
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-muted" />
                  </div>
                )}
              </div>
              
              {/* Artist info */}
              <div className="text-center">
                <h3 className="font-bold text-white text-lg truncate">{artist.name}</h3>
                <p className="text-xs text-white/80 mt-1">
                  {artist.followers.total.toLocaleString()} Followers
                </p>
                
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {artist.genres.slice(0, 2).map((genre) => (
                    <span 
                      key={genre} 
                      className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Hover state - shown by default on touch devices */}
              <div className="absolute top-2 right-2 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <div className="bg-white/10 p-2 rounded-full min-w-touch min-h-touch flex items-center justify-center">
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="text-white text-xs sm:text-sm" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop view (3-4 columns grid) */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artists.slice(0, 8).map((artist) => (
          <div
            key={artist.id}
            className="relative h-60 lg:h-64 rounded-lg overflow-hidden shadow-lg group cursor-pointer"
            onClick={() => window.open(artist.external_urls.spotify, '_blank')}
          >
            {/* Background with blur effect */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary/50">
                {artist.images && artist.images[0] ? (
                  <img 
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    className="w-full h-full object-cover opacity-50 blur-sm scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-light"></div>
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              {/* Artist image circle */}
              <div className="mx-auto">
                {artist.images && artist.images[0] ? (
                  <img 
                    src={artist.images[0]?.url}
                    alt={artist.name}
                    className="w-28 h-28 md:w-24 md:h-24 lg:w-28 lg:h-28 object-cover rounded-full border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-primary-dark flex items-center justify-center rounded-full">
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-muted" />
                  </div>
                )}
              </div>
              
              {/* Artist info */}
              <div className="text-center">
                <h3 className="font-bold text-white text-lg lg:text-xl truncate">{artist.name}</h3>
                <p className="text-sm text-white/80 mt-1">
                  {artist.followers.total.toLocaleString()} Followers
                </p>
                
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {artist.genres.slice(0, 3).map((genre) => (
                    <span 
                      key={genre} 
                      className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Hover state */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/10 p-2 rounded-full">
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="text-white text-sm" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}