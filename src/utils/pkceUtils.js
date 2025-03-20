import pkceChallenge from 'pkce-challenge';

// Generate PKCE challenge and verifier
export const generatePKCEChallenge = () => {
  const pkce = pkceChallenge();
  localStorage.setItem('code_verifier', pkce.code_verifier);
  return pkce.code_challenge;
};

// Get stored code verifier
export const getCodeVerifier = () => {
  return localStorage.getItem('code_verifier');
};

// Clear stored code verifier
export const clearCodeVerifier = () => {
  localStorage.removeItem('code_verifier');
};