#!/usr/bin/env python3
"""
Spotify User Listening History Analysis

This script analyzes a user's Spotify listening history and provides insights
on listening patterns, genre distributions, audio features, and more.
"""

import os
import time
import json
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# Load environment variables from .env file
load_dotenv()

# Spotify API credentials
CLIENT_ID = os.getenv('VITE_SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
REDIRECT_URI = os.getenv('VITE_SPOTIFY_REDIRECT_URI')

# Required scopes for accessing listening history and user data
SCOPES = [
    'user-read-recently-played',
    'user-top-read',
    'user-read-playback-state',
    'user-library-read'
]

# Set up Spotify API client
def get_spotify_client():
    """Initialize and return a Spotify client with appropriate permissions."""
    auth_manager = SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=' '.join(SCOPES),
        cache_path=".spotify_cache"
    )
    return spotipy.Spotify(auth_manager=auth_manager)

def fetch_listening_history(sp, limit=50):
    """Fetch user's recent listening history."""
    print("Fetching recent listening history...")
    recent_tracks = sp.current_user_recently_played(limit=limit)
    
    # Transform into a more usable format
    tracks = []
    for item in recent_tracks['items']:
        track_data = {
            'track_id': item['track']['id'],
            'track_name': item['track']['name'],
            'artist_id': item['track']['artists'][0]['id'],
            'artist_name': item['track']['artists'][0]['name'],
            'album_id': item['track']['album']['id'],
            'album_name': item['track']['album']['name'],
            'played_at': item['played_at'],
            'timestamp': datetime.strptime(item['played_at'], '%Y-%m-%dT%H:%M:%S.%fZ')
        }
        tracks.append(track_data)
    
    return pd.DataFrame(tracks)

def fetch_top_items(sp, item_type='tracks', time_range='medium_term', limit=50):
    """Fetch user's top tracks or artists."""
    print(f"Fetching top {item_type} ({time_range})...")
    
    if item_type == 'tracks':
        top_items = sp.current_user_top_tracks(time_range=time_range, limit=limit)
        items_list = []
        for i, item in enumerate(top_items['items']):
            item_data = {
                'rank': i + 1,
                'id': item['id'],
                'name': item['name'],
                'artist': item['artists'][0]['name'],
                'popularity': item['popularity']
            }
            items_list.append(item_data)
    else:  # artists
        top_items = sp.current_user_top_artists(time_range=time_range, limit=limit)
        items_list = []
        for i, item in enumerate(top_items['items']):
            item_data = {
                'rank': i + 1,
                'id': item['id'],
                'name': item['name'],
                'genres': ', '.join(item['genres']),
                'popularity': item['popularity']
            }
            items_list.append(item_data)
    
    return pd.DataFrame(items_list)

def get_audio_features(sp, track_ids):
    """Get audio features for a list of track IDs."""
    print("Fetching audio features...")
    
    # Split into batches of 100 (Spotify API limit)
    features_list = []
    
    for i in range(0, len(track_ids), 100):
        batch_ids = track_ids[i:i+100]
        batch_features = sp.audio_features(batch_ids)
        features_list.extend(batch_features)
        
        # Respect API rate limits
        if i + 100 < len(track_ids):
            time.sleep(1)
    
    # Transform into a DataFrame
    features_df = pd.DataFrame(features_list)
    
    # Keep only the most relevant features
    relevant_features = [
        'id', 'danceability', 'energy', 'key', 'loudness', 
        'mode', 'speechiness', 'acousticness', 'instrumentalness', 
        'liveness', 'valence', 'tempo', 'duration_ms'
    ]
    
    return features_df[relevant_features]

def get_artists_genres(sp, artist_ids):
    """Get genres for a list of artist IDs."""
    print("Fetching artist genres...")
    genres_dict = {}
    
    # Split into batches of 50 (Spotify API limit)
    for i in range(0, len(artist_ids), 50):
        batch_ids = artist_ids[i:i+50]
        batch_artists = sp.artists(batch_ids)
        
        for artist in batch_artists['artists']:
            genres_dict[artist['id']] = artist['genres']
        
        # Respect API rate limits
        if i + 50 < len(artist_ids):
            time.sleep(1)
    
    return genres_dict

def analyze_listening_patterns(history_df):
    """Analyze listening patterns by time of day, day of week, etc."""
    print("Analyzing listening patterns...")
    
    # Add time components for analysis
    history_df['hour'] = history_df['timestamp'].dt.hour
    history_df['day_of_week'] = history_df['timestamp'].dt.day_name()
    history_df['date'] = history_df['timestamp'].dt.date
    
    # Listening by hour
    hour_counts = history_df['hour'].value_counts().sort_index()
    day_counts = history_df['day_of_week'].value_counts()
    
    # Sort days of week properly
    days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    day_counts = day_counts.reindex(days_order)
    
    # Calculate listening streak
    dates = sorted(history_df['date'].unique())
    max_streak = current_streak = 1
    
    for i in range(1, len(dates)):
        delta = dates[i] - dates[i-1]
        if delta.days == 1:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        elif delta.days > 1:
            current_streak = 1
    
    return {
        'hour_distribution': hour_counts,
        'day_distribution': day_counts,
        'total_tracks': len(history_df),
        'unique_tracks': history_df['track_id'].nunique(),
        'unique_artists': history_df['artist_id'].nunique(),
        'most_active_day': day_counts.idxmax(),
        'most_active_hour': hour_counts.idxmax(),
        'listening_streak': max_streak
    }

def analyze_genre_distribution(history_df, genres_dict):
    """Analyze genre distribution in listening history."""
    print("Analyzing genre distribution...")
    
    # Flatten genres for all tracks
    all_genres = []
    for _, row in history_df.iterrows():
        artist_genres = genres_dict.get(row['artist_id'], [])
        all_genres.extend(artist_genres)
    
    # Count genre occurrences
    genre_counts = Counter(all_genres)
    
    # Filter out genres with very few occurrences
    min_occurrences = 2
    significant_genres = {genre: count for genre, count in genre_counts.items() 
                         if count >= min_occurrences}
    
    return {
        'genre_counts': significant_genres,
        'top_genres': dict(sorted(significant_genres.items(), key=lambda x: x[1], reverse=True)[:10]),
        'total_genres': len(genre_counts),
        'significant_genres': len(significant_genres)
    }

def analyze_audio_features(history_df, features_df):
    """Analyze audio features of listened tracks."""
    print("Analyzing audio features...")
    
    # Merge audio features with history
    merged_df = pd.merge(history_df, features_df, left_on='track_id', right_on='id')
    
    # Calculate average features
    avg_features = merged_df[[
        'danceability', 'energy', 'speechiness', 'acousticness', 
        'instrumentalness', 'liveness', 'valence'
    ]].mean()
    
    # Calculate tempo distribution
    tempo_bins = [0, 60, 80, 100, 120, 140, 160, 180, 200]
    tempo_labels = ['Very Slow', 'Slow', 'Moderate-Slow', 'Moderate', 
                   'Moderate-Fast', 'Fast', 'Very Fast', 'Super Fast']
    
    merged_df['tempo_category'] = pd.cut(merged_df['tempo'], bins=tempo_bins, labels=tempo_labels)
    tempo_distribution = merged_df['tempo_category'].value_counts().sort_index()
    
    # Find mood based on valence and energy
    merged_df['mood'] = merged_df.apply(lambda x: determine_mood(x['valence'], x['energy']), axis=1)
    mood_distribution = merged_df['mood'].value_counts()
    
    return {
        'average_features': avg_features,
        'tempo_distribution': tempo_distribution,
        'mood_distribution': mood_distribution,
        'avg_duration_min': merged_df['duration_ms'].mean() / 60000  # Convert to minutes
    }

def determine_mood(valence, energy):
    """Determine mood based on valence and energy values."""
    if valence >= 0.6:
        if energy >= 0.6:
            return "Happy & Energetic"
        else:
            return "Calm & Positive"
    elif valence >= 0.4:
        if energy >= 0.6:
            return "Energetic & Neutral"
        else:
            return "Relaxed & Neutral"
    else:
        if energy >= 0.6:
            return "Angry & Intense"
        else:
            return "Sad & Melancholic"

def generate_recommendations(sp, top_tracks_df, top_artists_df):
    """Generate recommendations based on top tracks and artists."""
    print("Generating recommendations...")
    
    # Get seed tracks and artists (up to 5 total)
    seed_tracks = top_tracks_df['id'].head(3).tolist()
    seed_artists = top_artists_df['id'].head(2).tolist()
    
    # Get recommendations
    recommendations = sp.recommendations(
        seed_tracks=seed_tracks,
        seed_artists=seed_artists,
        limit=20
    )
    
    # Format recommendations
    rec_list = []
    for i, track in enumerate(recommendations['tracks']):
        rec_data = {
            'rank': i + 1,
            'id': track['id'],
            'name': track['name'],
            'artist': track['artists'][0]['name'],
            'album': track['album']['name'],
            'popularity': track['popularity']
        }
        rec_list.append(rec_data)
    
    return pd.DataFrame(rec_list)

def visualize_listening_patterns(patterns):
    """Create visualizations for listening patterns."""
    # Set up plot style
    plt.style.use('dark_background')
    sns.set(style="darkgrid")
    
    # Create a figure with subplots
    fig, axes = plt.subplots(2, 1, figsize=(12, 10))
    
    # Plot listening by hour
    hour_df = patterns['hour_distribution'].reset_index()
    hour_df.columns = ['Hour', 'Count']
    
    # Add missing hours with 0 count
    missing_hours = set(range(24)) - set(hour_df['Hour'])
    for hour in missing_hours:
        hour_df = hour_df.append({'Hour': hour, 'Count': 0}, ignore_index=True)
    
    hour_df = hour_df.sort_values('Hour')
    
    # Add time periods
    hour_df['Period'] = pd.cut(
        hour_df['Hour'], 
        bins=[0, 6, 12, 18, 24], 
        labels=['Night (0-6)', 'Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-24)'],
        include_lowest=True
    )
    
    # Plot by hour with color by period
    ax1 = axes[0]
    sns.barplot(x='Hour', y='Count', hue='Period', data=hour_df, ax=ax1)
    ax1.set_title('Listening Activity by Hour of Day', fontsize=16)
    ax1.set_xlabel('Hour of Day (24h format)')
    ax1.set_ylabel('Number of Tracks')
    
    # Plot listening by day of week
    day_df = patterns['day_distribution'].reset_index()
    day_df.columns = ['Day', 'Count']
    
    ax2 = axes[1]
    sns.barplot(x='Day', y='Count', data=day_df, palette='viridis', ax=ax2)
    ax2.set_title('Listening Activity by Day of Week', fontsize=16)
    ax2.set_xlabel('Day of Week')
    ax2.set_ylabel('Number of Tracks')
    
    plt.tight_layout()
    plt.savefig('listening_patterns.png')
    
    return 'listening_patterns.png'

def visualize_genres(genre_data):
    """Create visualizations for genre distribution."""
    plt.figure(figsize=(12, 8))
    
    # Create a pie chart for top genres
    plt.style.use('dark_background')
    
    genres = list(genre_data['top_genres'].keys())
    counts = list(genre_data['top_genres'].values())
    
    # Only show top 8 genres, group the rest as "Other"
    if len(genres) > 8:
        other_count = sum(counts[8:])
        genres = genres[:8] + ['Other']
        counts = counts[:8] + [other_count]
    
    # Create a colorful pie chart
    plt.pie(counts, labels=genres, autopct='%1.1f%%', startangle=90, 
            shadow=True, explode=[0.1 if i == 0 else 0 for i in range(len(genres))],
            colors=plt.cm.viridis(np.linspace(0, 1, len(genres))))
    
    plt.axis('equal')
    plt.title('Top Genres in Your Music', fontsize=18)
    plt.tight_layout()
    plt.savefig('genre_distribution.png')
    
    return 'genre_distribution.png'

def visualize_audio_features(features_data):
    """Create visualizations for audio features."""
    plt.style.use('dark_background')
    
    # Create radar chart for average features
    fig = plt.figure(figsize=(18, 10))
    
    # First subplot: Radar chart of audio features
    ax1 = fig.add_subplot(121, polar=True)
    
    # Get the average features for the radar chart
    features = ['danceability', 'energy', 'speechiness', 'acousticness', 
               'instrumentalness', 'liveness', 'valence']
    feature_values = features_data['average_features'][features].values
    
    # Number of variables
    N = len(features)
    
    # Compute angle for each axis
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]  # close the polygon
    
    # Add values (and close the polygon)
    values = feature_values.tolist()
    values += values[:1]
    
    # Draw the polygon
    ax1.plot(angles, values, linewidth=2, linestyle='solid')
    ax1.fill(angles, values, alpha=0.4)
    
    # Fix axis to go in the right order and start at 12 o'clock
    ax1.set_theta_offset(np.pi / 2)
    ax1.set_theta_direction(-1)
    
    # Draw axis lines for each angle and label
    plt.xticks(angles[:-1], features, size=12)
    
    # Draw ylabels
    ax1.set_rlabel_position(0)
    plt.yticks([0.2, 0.4, 0.6, 0.8], ["0.2", "0.4", "0.6", "0.8"], color="grey", size=10)
    plt.ylim(0, 1)
    
    plt.title("Audio Features Radar Chart", size=18, y=1.1)
    
    # Second subplot: Mood distribution pie chart
    ax2 = fig.add_subplot(122)
    
    mood_data = features_data['mood_distribution']
    moods = mood_data.index.tolist()
    counts = mood_data.values.tolist()
    
    colors = plt.cm.viridis(np.linspace(0, 1, len(moods)))
    ax2.pie(counts, labels=moods, autopct='%1.1f%%', startangle=90, 
            shadow=True, explode=[0.1 if "Happy" in mood else 0 for mood in moods],
            colors=colors)
    
    ax2.axis('equal')
    ax2.set_title('Mood Distribution in Your Music', fontsize=18)
    
    plt.tight_layout()
    plt.savefig('audio_features.png')
    
    return 'audio_features.png'

def generate_html_report(username, patterns, genre_data, audio_data, 
                         top_tracks, top_artists, recommendations):
    """Generate an HTML report with all the analysis results."""
    print("Generating HTML report...")
    
    html_template = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spotify Listening Analysis for {username}</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #eee;
                background-color: #121212;
                margin: 0;
                padding: 20px;
            }}
            h1, h2, h3 {{
                color: #1DB954;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}
            .header {{
                text-align: center;
                margin-bottom: 40px;
                padding: 20px;
                background-color: #181818;
                border-radius: 8px;
                border-left: 5px solid #1DB954;
            }}
            .section {{
                margin-bottom: 40px;
                padding: 20px;
                background-color: #181818;
                border-radius: 8px;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }}
            .stat-card {{
                background-color: #282828;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                transition: transform 0.3s ease;
            }}
            .stat-card:hover {{
                transform: translateY(-5px);
            }}
            .stat-value {{
                font-size: 2rem;
                font-weight: bold;
                color: #1DB954;
                margin: 10px 0;
            }}
            .stat-label {{
                font-size: 0.9rem;
                color: #b3b3b3;
            }}
            .visualization {{
                background-color: #282828;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: center;
            }}
            .visualization img {{
                max-width: 100%;
                height: auto;
                border-radius: 4px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            th, td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #333;
            }}
            th {{
                background-color: #282828;
                color: #1DB954;
            }}
            tr:hover {{
                background-color: #282828;
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background-color: #181818;
                border-radius: 8px;
                font-size: 0.9rem;
                color: #b3b3b3;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Spotify Listening Analysis</h1>
                <p>A detailed analysis of {username}'s listening history</p>
                <p>Generated on {datetime.now().strftime('%Y-%m-%d')}</p>
            </div>
            
            <div class="section">
                <h2>Listening Patterns Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Tracks Analyzed</div>
                        <div class="stat-value">{patterns['total_tracks']}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Unique Tracks</div>
                        <div class="stat-value">{patterns['unique_tracks']}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Unique Artists</div>
                        <div class="stat-value">{patterns['unique_artists']}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Listening Streak</div>
                        <div class="stat-value">{patterns['listening_streak']} days</div>
                    </div>
                </div>
                
                <div class="visualization">
                    <h3>When You Listen</h3>
                    <img src="listening_patterns.png" alt="Listening Patterns Visualization">
                    <p>You're most active on <strong>{patterns['most_active_day']}</strong> at around <strong>{patterns['most_active_hour']}:00</strong></p>
                </div>
            </div>
            
            <div class="section">
                <h2>Genre Analysis</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Genres</div>
                        <div class="stat-value">{genre_data['total_genres']}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Top Genre</div>
                        <div class="stat-value">{list(genre_data['top_genres'].keys())[0] if genre_data['top_genres'] else 'N/A'}</div>
                    </div>
                </div>
                
                <div class="visualization">
                    <h3>Your Top Genres</h3>
                    <img src="genre_distribution.png" alt="Genre Distribution Visualization">
                </div>
            </div>
            
            <div class="section">
                <h2>Music Characteristics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Average Mood</div>
                        <div class="stat-value">{audio_data['mood_distribution'].idxmax()}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Average Duration</div>
                        <div class="stat-value">{audio_data['avg_duration_min']:.1f} min</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Energy Level</div>
                        <div class="stat-value">{audio_data['average_features']['energy']:.2f}</div>
                        <div class="stat-label">out of 1.0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Danceability</div>
                        <div class="stat-value">{audio_data['average_features']['danceability']:.2f}</div>
                        <div class="stat-label">out of 1.0</div>
                    </div>
                </div>
                
                <div class="visualization">
                    <h3>Audio Features Analysis</h3>
                    <img src="audio_features.png" alt="Audio Features Visualization">
                </div>
            </div>
            
            <div class="section">
                <h2>Your Top Tracks</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Track</th>
                            <th>Artist</th>
                            <th>Popularity</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    # Add top tracks to the HTML
    for _, track in top_tracks.head(10).iterrows():
        html_template += f"""
                        <tr>
                            <td>{track['rank']}</td>
                            <td>{track['name']}</td>
                            <td>{track['artist']}</td>
                            <td>{track['popularity']}/100</td>
                        </tr>
        """
    
    html_template += """
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>Your Top Artists</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Artist</th>
                            <th>Genres</th>
                            <th>Popularity</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    # Add top artists to the HTML
    for _, artist in top_artists.head(10).iterrows():
        html_template += f"""
                        <tr>
                            <td>{artist['rank']}</td>
                            <td>{artist['name']}</td>
                            <td>{artist['genres']}</td>
                            <td>{artist['popularity']}/100</td>
                        </tr>
        """
    
    html_template += """
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>Recommended Tracks</h2>
                <p>Based on your listening history, you might enjoy these tracks:</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Track</th>
                            <th>Artist</th>
                            <th>Album</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    # Add recommendations to the HTML
    for _, rec in recommendations.head(10).iterrows():
        html_template += f"""
                        <tr>
                            <td>{rec['rank']}</td>
                            <td>{rec['name']}</td>
                            <td>{rec['artist']}</td>
                            <td>{rec['album']}</td>
                        </tr>
        """
    
    html_template += """
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>Generated by Musix Spotify Analysis Tool</p>
                <p>© 2025 Musix. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Write HTML to file
    with open('spotify_analysis_report.html', 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    return 'spotify_analysis_report.html'

def main():
    """Main function to run the analysis."""
    # Set up Spotify client
    print("Setting up Spotify client...")
    try:
        sp = get_spotify_client()
        
        # Get user info
        user_info = sp.me()
        username = user_info['display_name']
        print(f"Successfully connected to Spotify for user: {username}")
        
        # Fetch data
        history_df = fetch_listening_history(sp, limit=50)
        top_tracks_df = fetch_top_items(sp, item_type='tracks', time_range='medium_term', limit=50)
        top_artists_df = fetch_top_items(sp, item_type='artists', time_range='medium_term', limit=50)
        
        # Get track IDs for audio feature analysis
        track_ids = history_df['track_id'].unique().tolist()
        features_df = get_audio_features(sp, track_ids)
        
        # Get artist IDs for genre analysis
        artist_ids = history_df['artist_id'].unique().tolist()
        genres_dict = get_artists_genres(sp, artist_ids)
        
        # Perform analyses
        pattern_analysis = analyze_listening_patterns(history_df)
        genre_analysis = analyze_genre_distribution(history_df, genres_dict)
        audio_analysis = analyze_audio_features(history_df, features_df)
        
        # Generate recommendations
        recommendations_df = generate_recommendations(sp, top_tracks_df, top_artists_df)
        
        # Create visualizations
        visualize_listening_patterns(pattern_analysis)
        visualize_genres(genre_analysis)
        visualize_audio_features(audio_analysis)
        
        # Generate HTML report
        report_path = generate_html_report(
            username, 
            pattern_analysis, 
            genre_analysis, 
            audio_analysis,
            top_tracks_df,
            top_artists_df,
            recommendations_df
        )
        
        print(f"\nAnalysis complete! Report generated at: {report_path}")
        print("You can open this HTML file in your browser to view your Spotify listening analysis.")
        
    except Exception as e:
        print(f"Error: {e}")
        if "No token" in str(e):
            print("\nAuthorization Error: Make sure you've set up your Spotify API credentials correctly.")
            print("Check your .env file and ensure CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI are correctly configured.")
        else:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()