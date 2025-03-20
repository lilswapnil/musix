import { useState, useEffect } from 'react';
import { getToken } from '../../../utils/tokenStorage';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import LoadingSpinner from '../../../components/common/ui/LoadingSpinner';

export default function NewReleases() {
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get API access token
    const fetchAccessToken = async () => {
      try {
        // Try to get user token first
        const userToken = getToken();
        if (userToken) {
          console.log("Using existing user token from localStorage");
          setAccessToken(userToken);
          return;
        }

        // If no user token, redirect to Spotify login
        const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
        
        console.log("No token found, redirecting to Spotify login");
        window.location.href = `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private user-read-email user-top-read user-read-recently-played`;
      } catch (err) {
        console.error("Error retrieving access token:", err);
        setError("Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    fetchAccessToken();
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchNewReleases();
    }
  }, [accessToken]);

  async function fetchNewReleases() {
    try {
      const searchParameters = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const response = await fetch(
        "https://api.spotify.com/v1/browse/new-releases?limit=12",
        searchParameters
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear it and refresh
          localStorage.removeItem('spotify_access_token');
          window.location.reload();
          return;
        }
        throw new Error("Failed to fetch new releases");
      }

      const newReleasesData = await response.json();
      setAlbums(newReleasesData.albums.items);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
        <LoadingSpinner message="Loading new releases..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
        <div className="bg-primary-light p-6 text-center rounded-lg">
          <p className="text-error mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no albums found (empty response)
  if (albums.length === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-4 text-start">New Releases</h2>
        <div className="text-center p-8 bg-primary-light/30 rounded-lg">
          <p className="text-lg text-muted">No new releases available right now.</p>
          <p className="text-sm mt-2">Check back later for the latest music!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollableSection title="New Releases" className="mb-0">
      <div className="flex space-x-2 pb-1">
        {albums.map((album) => (
          <div 
            key={album.id} 
            className="flex-shrink-0 w-36 sm:w-44 md:w-48 border-muted overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group"
            onClick={() => window.open(album.external_urls.spotify, '_blank')}
          >
            <div className="relative">
              {album.images[0]?.url && (
                <img 
                  src={album.images[0].url} 
                  alt={album.name}
                  className="w-full h-36 sm:h-44 md:h-48 object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={faExternalLinkAlt} 
                    className="text-white text-lg sm:text-xl"
                  />
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="w-full min-w-0 text-center">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{album.name}</h3>
                  <p className="text-xs text-white mt-1 truncate">
                    {album.artists.map(artist => artist.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollableSection>
  );
}