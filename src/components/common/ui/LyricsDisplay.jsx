import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faExternalLinkAlt, 
  faSpinner,
  faFileAlt,
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import { geniusService } from '../../../services/geniusService';

/**
 * Component to display lyrics inline on a song page
 * @param {Object} props
 * @param {string} props.songTitle - Title of the song
 * @param {string} props.artistName - Name of the artist
 * @param {boolean} props.collapsible - Whether lyrics can be collapsed (default true)
 * @param {boolean} props.initiallyExpanded - Whether to start expanded (default false)
 */
export default function LyricsDisplay({ 
  songTitle, 
  artistName,
  collapsible = true,
  initiallyExpanded = false
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [songData, setSongData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!songTitle) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        if (!geniusService.isConfigured()) {
          setError('Genius API is not configured.');
          setLoading(false);
          return;
        }

        const result = await geniusService.searchLyrics(songTitle, artistName);

        if (!result) {
          setError('Lyrics not found.');
          setLoading(false);
          return;
        }

        setSongData(result.song);
        setLyricsData(result.lyrics);
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError('Failed to load lyrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [songTitle, artistName]);

  // Don't render if Genius isn't configured
  if (!geniusService.isConfigured()) {
    return null;
  }

  if (loading) {
    return (
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <FontAwesomeIcon icon={faFileAlt} className="text-accent mr-2" />
          <h3 className="text-xl font-semibold text-white">Lyrics</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <FontAwesomeIcon 
            icon={faSpinner} 
            className="text-accent text-2xl animate-spin mr-3" 
          />
          <span className="text-muted">Loading lyrics...</span>
        </div>
      </div>
    );
  }

  if (error || !lyricsData) {
    return (
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFileAlt} className="text-accent mr-2" />
            <h3 className="text-xl font-semibold text-white">Lyrics</h3>
          </div>
        </div>
        <div className="text-center py-6">
          <p className="text-muted mb-4">{error || 'Lyrics not available.'}</p>
          <a 
            href={`https://genius.com/search?q=${encodeURIComponent((songTitle || '') + ' ' + (artistName || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline inline-flex items-center"
          >
            Search on Genius
            <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2 text-sm" />
          </a>
        </div>
      </div>
    );
  }

  if (!lyricsData.found) {
    return (
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFileAlt} className="text-accent mr-2" />
            <h3 className="text-xl font-semibold text-white">Lyrics</h3>
          </div>
        </div>
        <div className="text-center py-6">
          <p className="text-muted mb-4">{lyricsData.message}</p>
          {lyricsData.lyricsUrl && (
            <a 
              href={lyricsData.lyricsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-white inline-flex items-center transition-colors"
            >
              View on Genius
              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Determine preview text (first section or partial)
  const previewLines = lyricsData.plainText?.split('\n').slice(0, 6).join('\n') || '';

  return (
    <div className="glass rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faFileAlt} className="text-accent mr-2" />
          <h3 className="text-xl font-semibold text-white">Lyrics</h3>
          {songData && (
            <span className="ml-2 text-sm text-muted">
              by {songData.artist}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* External link */}
          <a 
            href={lyricsData.lyricsUrl || songData?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline inline-flex items-center text-sm"
          >
            Genius
            <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-xs" />
          </a>

          {/* Collapse toggle */}
          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronUp : faChevronDown} 
                className="text-muted"
              />
            </button>
          )}
        </div>
      </div>

      {/* Lyrics content */}
      <div className={`lyrics-content relative ${collapsible && !isExpanded ? 'max-h-48 overflow-hidden' : ''}`}>
        {(!collapsible || isExpanded) ? (
          // Full lyrics
          lyricsData.sections.map((section, index) => (
            <div key={index} className="mb-4">
              {section.type === 'header' ? (
                <p className="text-accent font-semibold text-sm mb-2">
                  {section.text}
                </p>
              ) : (
                <p className="text-white/90 whitespace-pre-line leading-relaxed text-start">
                  {section.text}
                </p>
              )}
            </div>
          ))
        ) : (
          // Preview only
          <p className="text-white/90 whitespace-pre-line leading-relaxed text-start">
            {previewLines}
          </p>
        )}

        {/* Gradient fade for collapsed state */}
        {collapsible && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand button for collapsed state */}
      {collapsible && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 w-full py-2 text-accent hover:text-accent/80 transition-colors text-sm flex items-center justify-center"
        >
          Show full lyrics
          <FontAwesomeIcon icon={faChevronDown} className="ml-2" />
        </button>
      )}

      {/* Genius attribution */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-muted text-center">
          Lyrics provided by{' '}
          <a 
            href="https://genius.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Genius
          </a>
        </p>
      </div>
    </div>
  );
}
