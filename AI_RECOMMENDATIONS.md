# AI Recommendations Feature

## Overview

The AI Recommendations feature automatically captures what's currently playing on your Spotify account and uses Spotify's recommendation engine to intelligently queue the next song based on your listening patterns.

## How It Works

1. **Track Monitoring**: The service monitors what's currently playing on your Spotify account every 30 seconds
2. **Audio Analysis**: When a new track is detected, it analyzes the track's audio features (energy, danceability, mood/valence, etc.)
3. **AI Recommendations**: Uses Spotify's recommendation API with the current track and artists as seeds
4. **Smart Queueing**: Automatically adds the best matching recommendation to your playback queue
5. **History Tracking**: Maintains a history of recommendations for transparency

## Features

### Intelligent Recommendations
- Uses multiple seed types: current track, artists
- Leverages audio feature analysis for better matching
- Filters out already-queued tracks to avoid duplicates
- Maintains recommendation quality through Spotify's ML models

### User Controls
- **Start/Stop Toggle**: Enable or disable AI recommendations with one click
- **Real-time Status**: See what track is being analyzed and what's been queued
- **Recommendation History**: View past recommendations with timestamps
- **History Management**: Clear history when needed

### Smart Queue Management
- Automatically prevents duplicate tracks
- Resets queue tracking when all recommendations have been used
- Seamlessly integrates with Spotify's native queue

## Technical Implementation

### New Services

#### `aiRecommendationService.js`
Main service that orchestrates the AI recommendation flow:
- Monitors currently playing track
- Detects track changes
- Fetches recommendations
- Manages queue
- Maintains history
- Event-driven architecture for real-time UI updates

**Key Methods:**
- `start(options)` - Start the AI recommendation service
- `stop()` - Stop the service
- `addListener(callback)` - Subscribe to recommendation events
- `getHistory(limit)` - Get recommendation history
- `clearHistory()` - Clear all history
- `getStatus()` - Get current service status

### Spotify API Endpoints Added

#### `spotifyServices.js` - New Methods

1. **`getCurrentlyPlaying()`**
   - Endpoint: `GET /v1/me/player/currently-playing`
   - Returns: Currently playing track data
   - Handles 204 No Content responses

2. **`getRecommendations(options)`**
   - Endpoint: `GET /v1/recommendations`
   - Parameters:
     - `seed_tracks` - Track IDs to use as seeds
     - `seed_artists` - Artist IDs to use as seeds
     - `seed_genres` - Genre names to use as seeds
     - `target_*` - Audio feature targets (energy, danceability, etc.)
     - `limit` - Number of recommendations
   - Returns: Array of recommended tracks

3. **`addToQueue(trackUri, deviceId)`**
   - Endpoint: `POST /v1/me/player/queue`
   - Parameters:
     - `uri` - Spotify URI of track to add
     - `device_id` - Optional device ID
   - Returns: Success/error status

4. **`getAudioFeatures(trackId)`**
   - Endpoint: `GET /v1/audio-features/{id}`
   - Returns: Audio analysis data for intelligent matching

5. **`skipToNext(deviceId)`**
   - Endpoint: `POST /v1/me/player/next`
   - Skip to next track in queue

6. **`skipToPrevious(deviceId)`**
   - Endpoint: `POST /v1/me/player/previous`
   - Skip to previous track

### UI Components

#### `AIRecommendations.jsx`
React component providing the user interface:
- Toggle switch to enable/disable AI
- Real-time status display
- Current track being analyzed
- Last queued recommendation
- Expandable history view
- "How It Works" explanation section

**Component Features:**
- Event-driven updates from the service
- Responsive design with Tailwind CSS
- FontAwesome icons for better UX
- Smooth animations and transitions
- Auto-updating status messages

### OAuth Scopes Required

Added new scopes to `spotifyAuthService.js`:
- `user-modify-playback-state` - Required for adding tracks to queue
- `user-library-modify` - For future features (saving recommended tracks)

## Usage

### For Users

1. Navigate to the Library page in Musix
2. Find the "AI Auto-Queue" section
3. Click "Start AI" to begin automatic recommendations
4. Play music on Spotify as usual
5. AI will automatically queue similar tracks every time the song changes
6. View recommendation history to see what was queued and why
7. Click "Stop AI" to disable automatic queueing

### For Developers

```javascript
import { aiRecommendationService } from './services/aiRecommendationService';

// Start the service
aiRecommendationService.start({
  checkInterval: 30000 // Check every 30 seconds
});

// Listen to events
aiRecommendationService.addListener((event) => {
  switch (event.type) {
    case 'track_queued':
      console.log('Queued:', event.recommendedTrack.name);
      break;
    case 'track_changed':
      console.log('Now playing:', event.track.name);
      break;
    case 'error':
      console.error('Error:', event.error);
      break;
  }
});

// Get status
const status = aiRecommendationService.getStatus();
console.log('AI enabled:', status.isEnabled);

// Get history
const history = aiRecommendationService.getHistory(10);

// Stop the service
aiRecommendationService.stop();
```

## Event Types

The service emits the following events:

- `started` - Service has started
- `stopped` - Service has stopped
- `track_changed` - New track detected
- `track_queued` - Recommendation added to queue
- `no_track_playing` - No track currently playing
- `no_recommendations` - No recommendations found
- `error` - General error
- `queue_error` - Error adding to queue

## Audio Features Used

The AI uses the following audio features for matching:

- **Energy**: Intensity and activity level
- **Danceability**: How suitable for dancing
- **Valence**: Musical positivity/mood
- **Tempo**: BPM (if needed)
- **Acousticness**: Acoustic vs electronic
- **Instrumentalness**: Vocal vs instrumental
- **Speechiness**: Presence of spoken words
- **Liveness**: Presence of audience

## Configuration Options

### Check Interval
Default: 30 seconds (30000ms)

Adjust how often the service checks for track changes:
```javascript
aiRecommendationService.start({
  checkInterval: 20000 // Check every 20 seconds
});
```

### Recommendation Limit
Default: 10 recommendations per request

The service fetches 10 recommendations and picks the best one that hasn't been queued yet.

### History Size
Default: 50 entries

Maximum number of historical recommendations to keep in memory.

## Limitations

1. **Spotify Premium Required**: Queue modification requires Spotify Premium
2. **Active Playback**: User must be actively playing music on Spotify
3. **Rate Limits**: Respects Spotify API rate limits (handled automatically)
4. **Network**: Requires active internet connection
5. **Authentication**: User must be logged in with proper OAuth scopes

## Future Enhancements

Potential improvements for future versions:

1. **ML-based Learning**: Track which recommendations the user skips vs plays fully
2. **Time-based Preferences**: Different recommendations for different times of day
3. **Mood Adjustment**: Manual controls to adjust energy/mood levels
4. **Playlist Generation**: Save recommendation chains as playlists
5. **Multi-track Queue**: Queue multiple songs at once
6. **Genre Constraints**: Limit recommendations to specific genres
7. **Collaborative Filtering**: Learn from similar users' preferences
8. **Manual Override**: Skip or remove queued recommendations

## Troubleshooting

### AI Not Queueing Tracks
- Check that you're playing music on Spotify
- Verify you have Spotify Premium
- Ensure the AI toggle is enabled
- Check browser console for errors

### Recommendations Not Similar
- The service needs a few tracks to understand your taste
- Audio feature matching is probabilistic
- Try clearing history and restarting

### High API Usage
- Increase check interval to reduce API calls
- Default 30s interval is optimized for balance

## Files Modified/Created

### Created
- `/src/services/aiRecommendationService.js` - Main AI service
- `/src/features/library/components/AIRecommendations.jsx` - UI component
- `/AI_RECOMMENDATIONS.md` - This documentation

### Modified
- `/src/services/spotifyServices.js` - Added recommendation endpoints
- `/src/services/spotifyAuthService.js` - Added required OAuth scopes
- `/src/features/library/pages/LibraryPage.jsx` - Integrated AI component

## Dependencies

No new npm packages required! Uses existing:
- React 19
- Spotify Web API
- FontAwesome icons
- Tailwind CSS

## License

Same as main Musix project.
