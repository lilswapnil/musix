# Musix Backend

Node.js/Express backend for the Musix app. Provides auth helpers, Spotify proxy
routes, recommendations, and basic user endpoints.

## Requirements

- Node.js (use the repo's current version)
- npm

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `cp .env.example .env`
3. Fill in required variables (see below).

## Environment Variables

Required:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_REDIRECT_URI`
- `SPOTIFY_LOCAL_REDIRECT_URI`

Optional:
- `PORT` (default: `8080`)
- `FRONTEND_ORIGIN` (comma-separated list of allowed origins)

## Run

- Dev: `npm run dev`

The server starts on `http://localhost:8080` by default.

## Routes

Base: `http://localhost:8080`

- `GET /` – health message
- `GET /api/health` – health check
- `GET /api/me` – current user profile (requires auth)
- `GET /api/recommendations` – recommendations (requires auth)

Spotify auth + proxy:
- `POST /api/spotify/auth/token` – exchange code for tokens
- `POST /api/spotify/auth/refresh` – refresh access token
- `POST /api/spotify/token` – store access token in backend
- `POST /api/spotify/auth/exchange` – exchange code (alt route)
- `POST /api/spotify/auth/refresh` – refresh token (alt route)
- `ANY /api/spotify/*` – Spotify Web API proxy

## Notes

- CORS allows the origins in `FRONTEND_ORIGIN`. Defaults include common local
  dev ports (`5173`/`5174`) and hostnames (`localhost`/`127.0.0.1`).