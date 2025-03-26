const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';

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
