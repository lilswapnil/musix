import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain,
  faPlay,
  faPause,
  faMusic,
  faHistory,
  faCheckCircle,
  faExclamationCircle,
  faRobot,
  faForward
} from '@fortawesome/free-solid-svg-icons';
import { aiRecommendationService } from '../../../services/aiRecommendationService';

export default function AIRecommendations() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState(null);
  const [lastRecommendation, setLastRecommendation] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState('AI recommendations are off');

  useEffect(() => {
    // Set up event listener for recommendation service
    const handleRecommendationEvent = (event) => {
      console.log('Recommendation event:', event);

      switch (event.type) {
        case 'started':
          setStatusMessage('AI is listening for tracks...');
          break;

        case 'stopped':
          setStatusMessage('AI recommendations are off');
          setLastRecommendation(null);
          setCurrentTrack(null);
          break;

        case 'track_changed':
          setCurrentTrack(event.track);
          setStatusMessage(`Analyzing: ${event.track.name}`);
          break;

        case 'track_queued':
          setLastRecommendation(event.recommendedTrack);
          setStatusMessage(
            `Queued: ${event.recommendedTrack.name} by ${event.recommendedTrack.artists.join(', ')}`
          );
          // Update history
          setHistory(aiRecommendationService.getHistory(10));
          break;

        case 'no_track_playing':
          setStatusMessage('No track playing - play something to start!');
          break;

        case 'no_recommendations':
          setStatusMessage('Could not find recommendations for this track');
          break;

        case 'error':
          setStatusMessage(`Error: ${event.error}`);
          break;

        case 'queue_error':
          setStatusMessage(`Queue error: ${event.error}`);
          break;

        default:
          break;
      }

      // Update status
      setStatus(aiRecommendationService.getStatus());
    };

    // Add listener
    aiRecommendationService.addListener(handleRecommendationEvent);

    // Get initial status
    const initialStatus = aiRecommendationService.getStatus();
    setIsEnabled(initialStatus.isEnabled);
    setStatus(initialStatus);

    if (initialStatus.isEnabled) {
      setHistory(aiRecommendationService.getHistory(10));
    }

    // Cleanup
    return () => {
      aiRecommendationService.removeListener(handleRecommendationEvent);
    };
  }, []);

  const handleToggle = () => {
    if (isEnabled) {
      aiRecommendationService.stop();
      setIsEnabled(false);
    } else {
      aiRecommendationService.start({
        checkInterval: 30000 // Check every 30 seconds
      });
      setIsEnabled(true);
      setHistory(aiRecommendationService.getHistory(10));
    }
  };

  const handleClearHistory = () => {
    aiRecommendationService.clearHistory();
    setHistory([]);
    setLastRecommendation(null);
  };

  return (
    <div className="mb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faBrain} className="text-3xl text-accent" />
          <h2 className="text-3xl font-bold">AI Auto-Queue</h2>
        </div>
        <button
          onClick={handleToggle}
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
            isEnabled
              ? 'bg-accent text-white hover:bg-accent/80 shadow-lg'
              : 'bg-primary-light text-text hover:bg-primary-light/80'
          }`}
        >
          <FontAwesomeIcon icon={isEnabled ? faPause : faPlay} />
          {isEnabled ? 'Stop AI' : 'Start AI'}
        </button>
      </div>

      {/* Description */}
      <p className="text-muted mb-6">
        AI automatically analyzes what you're listening to and queues similar tracks based on your taste.
      </p>

      {/* Status Card */}
      <div className="bg-primary-light rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${
              isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <h3 className="text-xl font-semibold">Status</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={isEnabled ? faCheckCircle : faExclamationCircle}
              className={isEnabled ? 'text-green-500' : 'text-gray-500'}
            />
            <span className="text-sm">{statusMessage}</span>
          </div>

          {currentTrack && isEnabled && (
            <div className="bg-primary/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faMusic} className="text-accent" />
                <span className="text-sm font-semibold">Currently Analyzing</span>
              </div>
              <p className="text-sm truncate">
                {currentTrack.name} • {currentTrack.artists.map(a => a.name).join(', ')}
              </p>
            </div>
          )}

          {lastRecommendation && isEnabled && (
            <div className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faForward} className="text-accent" />
                <span className="text-sm font-semibold">Last Queued</span>
              </div>
              <p className="text-sm font-medium">{lastRecommendation.name}</p>
              <p className="text-xs text-muted">
                {lastRecommendation.artists.join(', ')} • {lastRecommendation.album}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {isEnabled && history.length > 0 && (
        <div className="bg-primary-light rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHistory} className="text-accent" />
              <h3 className="text-xl font-semibold">Recommendation History</h3>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-accent hover:underline"
            >
              {showHistory ? 'Hide' : 'Show'} ({history.length})
            </button>
          </div>

          {showHistory && (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((entry, index) => (
                  <div
                    key={index}
                    className="bg-primary/30 p-4 rounded-lg hover:bg-primary/40 transition"
                  >
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faRobot} className="text-accent mt-1" />
                      <div className="flex-1">
                        <div className="text-xs text-muted mb-1">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted">Based on:</span>{' '}
                          <span className="font-medium">{entry.currentTrack.name}</span>
                          <span className="text-muted">
                            {' '}
                            by {entry.currentTrack.artists.join(', ')}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          <FontAwesomeIcon icon={faForward} className="text-accent mr-2" />
                          <span className="font-medium text-accent">
                            {entry.recommendedTrack.name}
                          </span>
                          <span className="text-muted">
                            {' '}
                            by {entry.recommendedTrack.artists.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleClearHistory}
                className="mt-4 text-sm text-error hover:underline"
              >
                Clear History
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
