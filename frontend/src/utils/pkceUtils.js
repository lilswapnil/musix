/**
 * PKCE Challenge Generator for Spotify OAuth
 */

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from({ length }, () => 
    possible.charAt(Math.floor(Math.random() * possible.length))).join('');
}

// Base64 URL encode a string
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate SHA-256 hash
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

// Generate PKCE challenge
export const generatePKCEChallenge = async () => {
  try {
    const codeVerifier = generateRandomString(64);
    const digestBuffer = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(digestBuffer);
    return { codeVerifier, codeChallenge };
  } catch (error) {
    console.error('Error generating PKCE challenge:', error);
    throw error;
  }
};

// Storage functions for the code verifier
const CODE_VERIFIER_KEY = 'pkce_code_verifier';
export const storeCodeVerifier = (codeVerifier) => localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
export const getCodeVerifier = () => localStorage.getItem(CODE_VERIFIER_KEY);

/**
 * Removes the PKCE code verifier from local storage
 * Important for security to clear after auth flow completes
 */
export const clearCodeVerifier = () => localStorage.removeItem(CODE_VERIFIER_KEY);