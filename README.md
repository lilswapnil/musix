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

### Third-party Services
| Service | Purpose |
|---------|---------|
| **Spotify Web API** | Music data & streaming |
| **Deezer API** | Additional music sources |
| **YouTube API** | Video content |

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

# Optional APIs
VITE_YOUTUBE_CLIENT_ID=your_youtube_client_id
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Backend
VITE_BACKEND_URL=http://localhost:5000
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
│   │   └── musicService.js
│   ├── utils/                 # Utility functions
│   ├── context/               # React Context
│   ├── hooks/                 # Custom hooks
│   ├── App.jsx               # Main app component
│   └── main.jsx              # Entry point
├── public/                    # Static assets
├── backend/                   # Express backend
├── script/                    # Analysis scripts
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
\`\`\`

## 🔗 API Integration

### Spotify Authentication
- **Flow**: OAuth 2.0 with PKCE
- **File**: \`src/services/spotifyAuthService.js\`
- **Scope**: User data, library access, playback

### Available Endpoints
- Search tracks, artists, albums
- Get user's top items
- Fetch user library
- Get recommendations
- Browse featured playlists

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
  <sub>Happy streaming! 🎧</sub>
</div>
