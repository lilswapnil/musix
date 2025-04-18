import React, { useState, useEffect } from 'react';
import { spotifyService } from '../../../services/spotifyServices';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faKey, faSignOutAlt, faMusic, faCalendarAlt, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from '../../../components/common/ui/ScrollableSection';
import { getAccessToken, getUserProfile } from '../../../utils/tokenStorage';

export default function UserDetails() {
  const [user, setUser] = useState(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Check if we have a token directly - avoid unnecessary redirects
        const accessToken = getAccessToken();
        if (!accessToken) {
          console.log('No access token found, redirecting to login');
          navigate('/login');
          return;
        }
        
        // Try to use cached user profile first if available
        const cachedProfile = getUserProfile();
        if (cachedProfile) {
          setUser(cachedProfile);
          
          // Still fetch recently played in the background
          fetchRecentlyPlayed(accessToken);
        } else {
          // If no cached profile, fetch everything
          await fetchFullProfileData(accessToken);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch user's recently played tracks only
    const fetchRecentlyPlayed = async (token) => {
      try {
        const recentPlayed = await spotifyService.apiRequest('/me/player/recently-played', {
          params: { limit: 10 }
        });
        
        if (recentPlayed && recentPlayed.items) {
          setRecentlyPlayed(recentPlayed.items);
        }
      } catch (err) {
        console.error("Error fetching recently played:", err);
        // Don't set error since we at least have the profile
      }
    };
    
    // Fetch both profile and recently played
    const fetchFullProfileData = async (token) => {
      // Fetch user data
      const userData = await spotifyService.getCurrentUser();
      setUser(userData);
      
      // Fetch recently played tracks
      const recentPlayed = await spotifyService.apiRequest('/me/player/recently-played', {
        params: { limit: 10 }
      });
      
      if (recentPlayed && recentPlayed.items) {
        setRecentlyPlayed(recentPlayed.items);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-accent">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-6 text-center">
        <p className="text-error mb-2">{error}</p>
        <button 
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header with greeting */}
      
        <h1 className="text-3xl font-bold mb-6 text-white text-start">
          {getGreeting()}, {user.display_name}!
        </h1>
        <div className="rounded-xl p-6 bg-primary-light/30 shadow-lg">
        {/* User profile card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            {user.images && user.images[0] ? (
              <img 
                src={user.images[0].url} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-accent/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-accent/30 flex items-center justify-center text-3xl font-bold text-accent">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <span className="absolute -bottom-1 -right-1 bg-green-500 h-6 w-6 rounded-full flex items-center justify-center border-2 border-primary-light text-xs font-semibold">
              {user.product === 'premium' ? 'P' : 'F'}
            </span>
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">{user.display_name}</h2>
            <p className="text-muted">{user.email}</p>
            {user.followers && (
              <p className="text-sm text-muted mt-1">{user.followers.total} followers</p>
            )}
            {user.product && (
              <div className="mt-2">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  user.product === 'premium' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.product.charAt(0).toUpperCase() + user.product.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-start">Dashboard</h2>
        
        {/* Recently played tracks */}
        <div className="bg-primary-light/30 rounded-lg p-4">
          
        </div>
      </div>

      <h2 className="text-3xl font-bold text-start">Account Details</h2>
      {/* Account information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary-light/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-accent" />
            Contact Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted">Email:</span>
              <span className="text-white">{user.email}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted">Spotify Profile:</span>
              <a 
                href={user.external_urls?.spotify} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                View Profile
              </a>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-light/30 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FontAwesomeIcon icon={faMusic} className="mr-2 text-accent" />
            Account Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted">Country:</span>
              <span className="text-white">{user.country || 'Not specified'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted">Account Type:</span>
              <span className={`text-xs px-3 py-1 rounded-full ${
                user.product === 'premium' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {user.product ? user.product.charAt(0).toUpperCase() + user.product.slice(1) : 'Free'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted">Content Filtering:</span>
              <span className="text-white">
                {user.explicit_content?.filter_enabled ? 'Filtered' : 'Allowed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <a 
          href={user.external_urls?.spotify} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-[#1DB954] hover:bg-[#1DB954]/90 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faMusic} className="mr-2" />
          Open in Spotify
        </a>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center bg-transparent border border-accent text-accent hover:bg-accent/10 py-2 px-4 rounded-lg transition-colors"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}