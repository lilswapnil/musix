import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faExternalLinkAlt, 
  faMusic,
  faSpinner,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import { geniusService } from '../../../services/geniusService';

/**
 * Modal component to display song lyrics from Genius
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.songTitle - Title of the song
 * @param {string} props.artistName - Name of the artist
 * @param {string} props.albumArt - Album art URL (optional)
 * @param {number} props.geniusSongId - Genius song ID (optional, for direct lookup)
 */
export default function LyricsModal({ 
  isOpen, 
  onClose, 
  songTitle, 
  artistName, 
  albumArt,
  geniusSongId 
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [songData, setSongData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!geniusService.isConfigured()) {
          setError('Genius API is not configured. Please add your access token.');
          setLoading(false);
          return;
        }

        let result;
        
        if (geniusSongId) {
          // Direct lookup by Genius ID
          result = await geniusService.getSongLyrics(geniusSongId);
        } else if (songTitle) {
          // Search by title and artist
          result = await geniusService.searchLyrics(songTitle, artistName);
        } else {
          setError('No song information provided.');
          setLoading(false);
          return;
        }

        if (!result) {
          setError('Song not found on Genius.');
          setLoading(false);
          return;
        }

        setSongData(result.song);
        setLyricsData(result.lyrics);
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError(err.message || 'Failed to load lyrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [isOpen, songTitle, artistName, geniusSongId]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-primary rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-primary border-b border-white/10">
          <div className="flex items-center p-4">
            {/* Album art or song info */}
            <div className="flex items-center flex-1 min-w-0">
              {(albumArt || songData?.albumArt) && (
                <img 
                  src={albumArt || songData?.albumArt}
                  alt={songTitle || songData?.title}
                  className="w-12 h-12 rounded-lg object-cover mr-3 flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {songData?.title || songTitle || 'Lyrics'}
                </h2>
                <p className="text-sm text-muted truncate">
                  {songData?.artist || artistName || 'Unknown Artist'}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors ml-2"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} className="text-white text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <FontAwesomeIcon 
                icon={faSpinner} 
                className="text-accent text-3xl animate-spin mb-4" 
              />
              <p className="text-muted">Loading lyrics...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="text-muted text-4xl mb-4" 
              />
              <p className="text-white mb-2">{error}</p>
              {songTitle && (
                <a 
                  href={`https://genius.com/search?q=${encodeURIComponent(songTitle + ' ' + (artistName || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white inline-flex items-center transition-colors"
                >
                  Search on Genius
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
                </a>
              )}
            </div>
          )}

          {!loading && !error && lyricsData && (
            <div>
              {lyricsData.found ? (
                <div className="lyrics-content">
                  {lyricsData.sections.map((section, index) => (
                    <div key={index} className="mb-4">
                      {section.type === 'header' ? (
                        <p className="text-accent font-semibold text-sm mb-2">
                          {section.text}
                        </p>
                      ) : (
                        <p className="text-white whitespace-pre-line leading-relaxed">
                          {section.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FontAwesomeIcon 
                    icon={faMusic} 
                    className="text-muted text-4xl mb-4" 
                  />
                  <p className="text-white mb-2">{lyricsData.message}</p>
                  {lyricsData.lyricsUrl && (
                    <a 
                      href={lyricsData.lyricsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white inline-flex items-center transition-colors"
                    >
                      View on Genius
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Genius attribution */}
        {!loading && lyricsData?.found && (
          <div className="sticky bottom-0 bg-primary border-t border-white/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                Lyrics provided by Genius
              </span>
              {(lyricsData?.lyricsUrl || songData?.url) && (
                <a 
                  href={lyricsData?.lyricsUrl || songData?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline inline-flex items-center"
                >
                  View on Genius
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-[10px]" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
