const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const USER_PROFILE_KEY = 'spotify_user_profile';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getUserProfile() {
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (!profileJson) return null;
    
    return JSON.parse(profileJson);
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

export function removeUserProfile() {
  localStorage.removeItem(USER_PROFILE_KEY);
}

export function clearAuthData() {
  removeAccessToken();
  removeRefreshToken();
  removeUserProfile();
}

// Add these aliases for backward compatibility
export function getToken() {
  return getAccessToken();
}

export function removeToken() {
  return removeAccessToken();
}
