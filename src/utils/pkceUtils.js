import pkceChallenge from 'pkce-challenge';

/**
 * PKCE Challenge Generator for Spotify OAuth
 */

// Generate a random string for code verifier
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
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
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return digest;
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

export const storeCodeVerifier = (codeVerifier) => {
  localStorage.setItem('pkce_code_verifier', codeVerifier);
};

export const getCodeVerifier = () => localStorage.getItem('pkce_code_verifier');

export const clearCodeVerifier = () => localStorage.removeItem('pkce_code_verifier');