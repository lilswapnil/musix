/**
 * Token Storage Utilities
 * Manages secure storage and retrieval of authentication tokens and user profile
 */

// Storage keys for consistent access
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const USER_PROFILE_KEY = 'spotify_user_profile';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';

/**
 * Get stored access token
 * @returns {string|null} The access token or null if not found
 */
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

/**
 * Store access token in local storage
 * @param {string} token - Access token to store
 * @param {number} expiresIn - Token expiry time in seconds
 */
export const setAccessToken = (token, expiresIn) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  
  // Store expiry time if provided
  if (expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

/**
 * Remove access token from storage
 */
export const removeAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

/**
 * Get stored refresh token
 * @returns {string|null} The refresh token or null if not found
 */
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/**
 * Store refresh token in local storage
 * @param {string} token - Refresh token to store
 */
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);

/**
 * Remove refresh token from storage
 */
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

/**
 * Get token expiry timestamp
 * @returns {number|null} Expiry timestamp in milliseconds or null if not found
 */
export const getTokenExpiry = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry) : null;
};

/**
 * Check if the stored token is expired
 * @returns {boolean} True if token is expired or expiry unknown, false otherwise
 */
export const isTokenExpired = () => {
  const expiry = getTokenExpiry();
  // Add a 1-minute buffer to refresh before actual expiration
  return !expiry || Date.now() > expiry - 60000; 
};

/**
 * Retrieves user profile from local storage
 * Handles JSON parsing and error catching
 * @returns {Object|null} User profile object or null if not found/invalid
 */
export function getUserProfile() {
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    return profileJson ? JSON.parse(profileJson) : null;
  } catch (error) {
    console.error('Error parsing stored user profile:', error);
    return null;
  }
}

/**
 * Saves user profile to local storage
 * @param {Object} profile - User profile to store
 */
export function setUserProfile(profile) {
  if (!profile) return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error storing user profile:', error);
  }
}

/**
 * Remove user profile from storage
 */
export const removeUserProfile = () => localStorage.removeItem(USER_PROFILE_KEY);

/**
 * Removes all authentication related data from storage
 */
export function clearAuthData() {
  removeAccessToken();
  removeRefreshToken();
  removeUserProfile();
}

/**
 * Check if we have a valid authentication session
 * @returns {boolean} True if we have valid auth data
 */
export function hasValidSession() {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  const profile = getUserProfile();
  
  return !!token && !!refreshToken && !!profile;
}

// Aliases for backward compatibility
export const getToken = getAccessToken;
export const removeToken = removeAccessToken;
