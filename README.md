# Musix 🎵

[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18.16.0-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0.8-green)](https://www.mongodb.com/)

Musix is a full-stack music streaming web application designed to deliver a seamless music experience. Discover new tracks, create playlists, and enjoy personalized recommendations based on your listening habits.

![Musix Screenshot](client/public/screenshot.png) *Add your own screenshots here*

## Features ✨

- **User Authentication**: Secure signup/login with JWT.
- **Playlist Management**: Create, edit, and delete playlists.
- **Music Interaction**: Like/unlike songs, view listening history.
- **Search**: Find songs, artists, or albums quickly.
- **Recommendations**: AI-powered suggestions based on your preferences.
- **Responsive Design**: Works smoothly on all devices.

## Installation 🛠️

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB Atlas account or local MongoDB instance

### Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/lilswapnil/musix.git
   cd musix

   Install dependencies

bash
Copy
# Client
cd client && npm install

# Server
cd ../server && npm install
Configure Environment Variables

Create .env in /server:

env
Copy
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:3000
Start the application

bash
Copy
# From root directory
npm run dev  # Starts both client and server concurrently
Access client at http://localhost:3000

Server runs on http://localhost:5000

Tech Stack 💻
Component	Technology
Frontend	React, Redux Toolkit, Tailwind CSS
Backend	Node.js, Express
Database	MongoDB, Mongoose ODM
Authentication	JSON Web Tokens (JWT)
Deployment	(Specify if deployed, e.g., Vercel + Render)
Contributing 🤝
Fork the repository.

Create a feature branch: git checkout -b feature/your-idea.

Commit changes: git commit -m 'Add awesome feature'.

Push to the branch: git push origin feature/your-idea.

Open a Pull Request.

License 📄
This project is licensed under the MIT License - see LICENSE for details.

Acknowledgments 🙏
Built with ❤️ by Swapnil.

UI inspiration from Spotify.

React Icons for iconography.

Happy Listening! 🎧
Report an Issue | View API Docs if available

Copy

---

### Notes:
1. Replace `your_jwt_secret_key` and `your_mongodb_connection_string` with actual values.
2. Add real screenshots by uploading images to the repo and updating the `![Musix Screenshot]` URL.
3. Customize the "Deployment" section if the app is hosted live.
4. Include API documentation link if available.
New chat

