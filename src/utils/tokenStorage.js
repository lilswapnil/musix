// Storage keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const USER_PROFILE_KEY = 'spotify_user_profile';

// Token management functions
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token);
export const removeAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

// User profile management
export function getUserProfile() {
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    return profileJson ? JSON.parse(profileJson) : null;
  } catch (error) {
    console.error('Error parsing stored user profile:', error);
    return null;
  }
}

export function setUserProfile(profile) {
  if (!profile) return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error storing user profile:', error);
  }
}

export const removeUserProfile = () => localStorage.removeItem(USER_PROFILE_KEY);

// Clear all auth data
export function clearAuthData() {
  removeAccessToken();
  removeRefreshToken();
  removeUserProfile();
}

// Aliases for backward compatibility
export const getToken = getAccessToken;
export const removeToken = removeAccessToken;
