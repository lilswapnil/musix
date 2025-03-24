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
    console.log("Generating PKCE challenge...");
    
    // Generate code verifier (random string between 43-128 chars)
    const codeVerifier = generateRandomString(64);
    console.log("Generated verifier:", codeVerifier);
    
    // Store code verifier in localStorage for later use
    localStorage.setItem('pkce_code_verifier', codeVerifier);
    
    // Generate code challenge from verifier
    const digestBuffer = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(digestBuffer);
    console.log("Generated challenge:", codeChallenge);
    
    // Return both values as an object
    return { codeVerifier, codeChallenge };
  } catch (error) {
    console.error('Error generating PKCE challenge:', error);
    throw error;
  }
};

// Export other utility functions
export const getCodeVerifier = () => localStorage.getItem('pkce_code_verifier');
export const clearCodeVerifier = () => localStorage.removeItem('pkce_code_verifier');