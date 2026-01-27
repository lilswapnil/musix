# 🎵 Musix - Spotify Music Discovery Platform

A modern music streaming web application that integrates with Spotify API to discover, stream, and manage your favorite music. Built with React, Vite, and modern web technologies.

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Spotify API](https://img.shields.io/badge/Spotify_API-v1-1DB954?logo=spotify&logoColor=white)](https://developer.spotify.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Integration](#-api-integration)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- 🔐 **Spotify Authentication** - Secure OAuth 2.0 with PKCE flow
- 🎵 **Music Discovery** - Browse trending songs, albums, and artists
- 🎸 **Genre Exploration** - Discover music by genre
- 🎧 **Track Management** - Save and organize your favorite tracks
- 📚 **Library Management** - View your saved albums and songs
- ⭐ **Personalization** - Top tracks, artists, and recently played
- 🔍 **Advanced Search** - Search songs, artists, albums, and genres
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🌙 **Theme Support** - Dark/light mode compatibility

## 💻 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite** | Build tool & dev server |
| **React Router** | Client-side routing |
| **Tailwind CSS** | Styling & responsive design |
| **FontAwesome** | Icons |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **CORS** | Cross-origin requests |
| **dotenv** | Environment variables |

### Third-party APIs
| API | Purpose |
|-----|---------|
| **Spotify Web API** | Primary music data, user authentication, library management, playback control |
| **Deezer API** | Fallback music data source, trending content, genre browsing |
| **YouTube Data API** | Alternative authentication, video content integration |
| **Genius API** | Lyrics search and song information |
| **Azure Key Vault** | Secure token storage for server-side operations |
| **Azure ML** | AI-powered music recommendations (optional) |

## 🔌 API Integration Details

### Spotify Web API
**Base URL:** `https://api.spotify.com/v1`
**Authentication:** OAuth 2.0 with PKCE flow

| Endpoint | Purpose |
|----------|---------|
| `/me` | Get current user profile |
| `/me/top/tracks`, `/me/top/artists` | User's top items |
| `/me/player/recently-played` | Recently played tracks |
| `/me/tracks`, `/me/albums` | User's saved library |
| `/me/player` | Playback state and control |
| `/me/player/queue` | Add tracks to queue |
| `/me/player/next`, `/me/player/previous` | Skip controls |
| `/browse/new-releases` | New album releases |
| `/browse/featured-playlists` | Curated playlists |
| `/search` | Search tracks, artists, albums |
| `/audio-features` | Track audio analysis (energy, danceability, etc.) |
| `/recommendations` | Spotify's recommendation engine |
| `/artists/{id}`, `/albums/{id}`, `/tracks/{id}` | Get specific items |

**Required Scopes:**
- `user-read-private`, `user-read-email` - Profile access
- `user-read-currently-playing`, `user-read-playback-state` - Playback info
- `user-modify-playback-state` - Control playback
- `user-read-recently-played` - Listening history
- `user-library-read`, `user-library-modify` - Library access
- `user-top-read` - Top items
- `playlist-read-private`, `playlist-read-collaborative` - Playlist access
- `streaming` - Web Playback SDK (Premium only)

---

### Deezer API
**Base URL:** `https://api.deezer.com`
**Authentication:** None required (public endpoints)
**CORS Proxy:** `https://corsproxy.io/`

| Endpoint | Purpose |
|----------|---------|
| `/chart/0/tracks` | Trending songs |
| `/chart/0/albums` | Trending albums |
| `/chart/0/artists` | Trending artists |
| `/chart/0/playlists` | Featured playlists |
| `/genre` | Browse music genres |
| `/editorial` | Editorial content and categories |
| `/search`, `/search/track`, `/search/artist`, `/search/album` | Search functionality |
| `/artist/{id}` | Artist details |
| `/artist/{id}/top` | Artist's top tracks |
| `/artist/{id}/albums` | Artist's albums |
| `/album/{id}` | Album details and tracks |
| `/track/{id}` | Track details with 30s preview |
| `/playlist/{id}` | Playlist details |

**Use Cases:**
- Fallback when Spotify token unavailable
- 30-second track previews for non-Premium users
- Genre browsing and discovery
- Trending content without authentication

---

### YouTube Data API v3
**Authentication:** OAuth 2.0 via Google Identity Services
**Library:** `https://accounts.google.com/gsi/client`

| Scope | Purpose |
|-------|---------|
| `youtube.readonly` | Access YouTube data |
| `userinfo.profile` | User profile information |
| `userinfo.email` | User email address |

**Use Cases:**
- Alternative login method
- User profile retrieval
- Potential video content integration

---

### Genius API
**Base URL:** `https://api.genius.com`
**Authentication:** Bearer token
**CORS Proxy:** `https://corsproxy.io/`

| Endpoint | Purpose |
|----------|---------|
| `/search` | Search for songs by title/artist |
| `/songs/{id}` | Get song details and lyrics URL |
| `/artists/{id}` | Get artist information |
| `/artists/{id}/songs` | Get artist's songs |

**Use Cases:**
- Lyrics search and display
- Song metadata enrichment
- Artist information

---

### Azure Key Vault (Backend)
**Purpose:** Secure storage for Spotify refresh tokens

| Operation | Purpose |
|-----------|---------|
| `getSecret` | Retrieve stored refresh token |
| `setSecret` | Store new refresh token |

**Endpoints Exposed:**
- `POST /api/azure/spotify/refresh-token` - Store refresh token after OAuth
- `GET /api/azure/spotify/access-token` - Get fresh access token (requires `x-service-key`)

---

### Azure ML (Backend, Optional)
**Purpose:** AI-powered music recommendations

| Endpoint | Purpose |
|----------|---------|
| `POST /api/azure/ml/recommendations` | Get ML-based track recommendations |

**Request Format:**
```json
{
  "track": { "id": "spotify_track_id", "name": "Track Name" },
  "audioFeatures": { "energy": 0.9, "danceability": 0.8 },
  "history": [{ "currentTrackId": "...", "recommendedTrackId": "..." }]
}
```

## 📦 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **Spotify Developer Account** (free)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/lilswapnil/musix.git
cd musix
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables
Create a \`.env\` file in the project root:

\`\`\`env
# Spotify OAuth
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
VITE_SPOTIFY_LOCAL_REDIRECT_URI=http://localhost:5173/callback

# Backend secrets
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
CLIENT_URL=http://localhost:5173

# Azure token service (optional but recommended)
AZURE_KEY_VAULT_URL=https://your-vault-name.vault.azure.net/
AZURE_SPOTIFY_REFRESH_SECRET_NAME=SpotifyRefreshToken
AZURE_SERVICE_API_KEY=generated_service_key
PERSISTED_SPOTIFY_REFRESH_TOKEN= # optional local fallback
ALLOWED_ORIGINS=https://musix-now.vercel.app,https://app.example.com
CORS_ALLOW_CREDENTIALS=false
REQUEST_BODY_LIMIT=1mb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# Azure ML recommender (optional)
AZURE_ML_ENDPOINT_URL=https://<endpoint-name>.<region>.inference.ml.azure.com/score
AZURE_ML_DEPLOYMENT_NAME=recommender-v1
AZURE_ML_API_KEY=
AZURE_ML_API_KEY_HEADER=azureml-model-key
AZURE_ML_SCOPE=https://ml.azure.com/.default
AZURE_ML_TIMEOUT_MS=15000
AZURE_ML_REQUIRE_SERVICE_KEY=true

VITE_ENABLE_AZURE_ML_RECS=false
VITE_AZURE_ML_RECS_LIMIT=20

# Optional APIs
VITE_YOUTUBE_CLIENT_ID=your_youtube_client_id
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Backend
VITE_BACKEND_URL=http://localhost:5175
\`\`\`

### 4. Spotify Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Accept terms and create the app
4. Copy your **Client ID**
5. Paste it in \`.env\` as \`VITE_SPOTIFY_CLIENT_ID\`

## ⚙️ Configuration

### Update Backend URL (if different)
Edit \`src/services/spotifyAuthService.js\` if running on a different backend:
\`\`\`javascript
const REDIRECT_URI = 'http://your-backend-url/callback';
\`\`\`

### Tailwind CSS
Customization available in \`tailwind.config.js\`

### Vite Configuration
Modify \`vite.config.js\` for build optimization

## 💿 Usage

### Development Server
\`\`\`bash
npm run dev
\`\`\`
- Frontend: http://localhost:5173
- Backend: http://localhost:5000 (if running)

### Production Build
\`\`\`bash
npm run build
\`\`\`
Creates optimized build in \`dist/\` directory

### Preview Build
\`\`\`bash
npm run preview
\`\`\`

### Linting
\`\`\`bash
npm run lint
\`\`\`

## 📂 Project Structure

\`\`\`
musix/
├── src/
│   ├── features/              # Feature modules
│   │   ├── auth/             # Authentication flow
│   │   ├── home/             # Home page components
│   │   ├── search/           # Search functionality
│   │   ├── library/          # User library
│   │   └── account/          # Account settings
│   ├── components/            # Reusable components
│   │   ├── common/           # UI components
│   │   ├── layout/           # Layout components
│   │   ├── player/           # Player controls
│   │   └── routes/           # Route protectors
│   ├── services/              # API services
│   │   ├── spotifyServices.js
│   │   ├── spotifyAuthService.js
│   │   ├── genreService.js
│   │   └── azureMlService.js
│   ├── utils/                 # Utility functions
│   ├── context/               # React Context
│   ├── hooks/                 # Custom hooks
│   ├── App.jsx               # Main app component
│   └── main.jsx              # Entry point
├── public/                    # Static assets
├── backend/                   # Express backend
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
\`\`\`

## 🔗 Authentication Flows

### Spotify Authentication
- **Flow**: OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- **File**: `src/services/spotifyAuthService.js`
- **Token Storage**: localStorage with automatic refresh
- **Premium Detection**: Automatic fallback to display-only mode for free users

### Azure ML / Key Vault Token Service
- **Key Vault**: Persist the long-lived Spotify refresh token securely using `AZURE_KEY_VAULT_URL` and `AZURE_SPOTIFY_REFRESH_SECRET_NAME`.
- **Refresh capture**: After the PKCE login flow completes, the frontend calls `/api/azure/spotify/refresh-token` so the backend can store the new refresh token.
- **Managed access**: Azure ML jobs (or any trusted service) call `/api/azure/spotify/access-token` with the `x-service-key: <AZURE_SERVICE_API_KEY>` header to obtain short-lived Spotify access tokens without re-authentication.
- **Fallback**: If Key Vault is unavailable, the server keeps an in-memory copy (`PERSISTED_SPOTIFY_REFRESH_TOKEN`) so development environments still work.
- **Security middleware**: Configure `ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `REQUEST_BODY_LIMIT`, and the rate-limit knobs to match your production footprint. The backend automatically applies `helmet`, `compression`, `morgan`, and an adaptive rate limiter to every `/api/azure/*` call plus the refresh endpoint.
- **Health checks**: Cloud deployments can probe `/healthz` to verify uptime and Key Vault connectivity before routing traffic to the instance.

### Azure ML Recommendations (optional)
- **Configure env**: Provide `AZURE_ML_ENDPOINT_URL`, `AZURE_ML_DEPLOYMENT_NAME`, and either `AZURE_ML_API_KEY` (plus `AZURE_ML_API_KEY_HEADER`) or grant the backend's managed identity access to the endpoint scope (`AZURE_ML_SCOPE`). Toggle the UI with `VITE_ENABLE_AZURE_ML_RECS=true` and set `VITE_BACKEND_URL` so the frontend can reach the proxy route.
- **Proxy endpoint**: POST `/api/azure/ml/recommendations` with either a `payload` object (forwarded verbatim) or structured context:

  ```json
  {
    "track": { "id": "3n3Ppam7vgaVa1iaRUc9Lp", "name": "Hey Ya" },
    "audioFeatures": { "energy": 0.9, "danceability": 0.8 },
    "history": [
      { "currentTrackId": "3n3Ppam7vgaVa1iaRUc9Lp", "recommendedTrackId": "7ouMYWpwJ422jRcDASZB7P" }
    ]
  }
  ```

  The backend responds with `{ ok: true, model: <deployment>, data: <azure_response> }`. The frontend normalizes arrays such as `trackIds`, `recommendations`, or any list of Spotify IDs contained somewhere inside `data`.
- **Model output**: Ensure your Azure ML endpoint returns Spotify track identifiers (`id`, `trackId`, or `spotifyId`). The app fetches the actual metadata from Spotify before showing or queueing tracks, so the model never needs Spotify credentials.
- **Security**: Set `AZURE_ML_REQUIRE_SERVICE_KEY=true` if you need the `x-service-key` header for this route as well. Without it, access is limited to authenticated frontend clients but secrets stay on the server because Azure is invoked from backend code only.
- **Security**: `AZURE_ML_REQUIRE_SERVICE_KEY` defaults to `true`, so callers must supply the same `x-service-key` token that protects `/api/azure/spotify/access-token`. Set it to `false` only for trusted private networks.

### YouTube Authentication
- **Flow**: OAuth 2.0 via Google Identity Services
- **File**: `src/services/youtubeService.js`
- **Library**: Dynamically loads `https://accounts.google.com/gsi/client`

### Genius Integration
- **Authentication**: Bearer token (API access token)
- **File**: `src/services/geniusService.js`
- **Setup**: Create client at https://genius.com/api-clients

### Available Service Files
| File | Purpose |
|------|---------|
| `spotifyServices.js` | Spotify API wrapper with caching and rate limiting |
| `spotifyAuthService.js` | OAuth PKCE flow and token management |
| `deezerServices.js` | Deezer API wrapper with fallback support |
| `youtubeService.js` | Google OAuth and YouTube integration |
| `geniusService.js` | Genius lyrics and song info |
| `genreService.js` | Genre mapping and categorization |
| `azureMlService.js` | Azure ML recommendations client |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: \`git checkout -b feature/amazing-feature\`
3. **Commit** changes: \`git commit -m 'Add amazing feature'\`
4. **Push** to branch: \`git push origin feature/amazing-feature\`
5. **Open** a Pull Request

### Coding Standards
- Use functional components with React Hooks
- Follow ESLint configuration
- Keep components modular and reusable
- Add comments for complex logic
- Test changes before submitting PR

## 📝 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify** for the amazing Music API
- **React** community for fantastic resources
- **Tailwind CSS** for beautiful styling
- **Vite** for blazing-fast builds

## 📞 Support

- 🐛 Report bugs via [GitHub Issues](https://github.com/lilswapnil/musix/issues)
- 💬 Ask questions in Discussions
- �� Contact: [GitHub](https://github.com/lilswapnil)

---

<div align="center">
  <strong>Made with ❤️ by Scott</strong>
  <br/>
  <sub>Happy Discovering! 🎧</sub>
</div>
