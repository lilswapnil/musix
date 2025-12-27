const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
const refreshSecretName = process.env.AZURE_SPOTIFY_REFRESH_SECRET_NAME || 'SpotifyRefreshToken';
const cacheTtlMs = Number(process.env.AZURE_ACCESS_TOKEN_CACHE_MS || 55000);

let secretClient = null;
let credentialError = null;
let fallbackRefreshToken = process.env.PERSISTED_SPOTIFY_REFRESH_TOKEN || null;
let cachedAccessToken = null;
let cachedAccessTokenExpiry = 0;

if (keyVaultUrl) {
  try {
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(keyVaultUrl, credential);
  } catch (error) {
    credentialError = error;
    console.error('Failed to initialize Azure credentials:', error.message);
  }
} else {
  console.warn('AZURE_KEY_VAULT_URL not provided. Defaulting to in-memory storage.');
}

const isKeyVaultReady = () => !!secretClient;

const setCachedAccessToken = (token, expiresInSeconds = 55) => {
  if (!token) {
    cachedAccessToken = null;
    cachedAccessTokenExpiry = 0;
    return;
  }
  cachedAccessToken = token;
  cachedAccessTokenExpiry = Date.now() + Math.min(expiresInSeconds * 1000, cacheTtlMs);
};

const getCachedAccessToken = () => {
  if (!cachedAccessToken || Date.now() > cachedAccessTokenExpiry) {
    cachedAccessToken = null;
    return null;
  }
  return cachedAccessToken;
};

const saveRefreshToken = async (refreshToken) => {
  if (!refreshToken) throw new Error('Refresh token is required to save');

  fallbackRefreshToken = refreshToken;

  if (!secretClient) {
    if (credentialError) {
      console.warn('Azure credentials unavailable; storing refresh token in memory only.');
    }
    return refreshToken;
  }

  await secretClient.setSecret(refreshSecretName, refreshToken);
  return refreshToken;
};

const getStoredRefreshToken = async () => {
  if (secretClient) {
    try {
      const secret = await secretClient.getSecret(refreshSecretName);
      if (secret?.value) {
        fallbackRefreshToken = secret.value;
        return secret.value;
      }
    } catch (error) {
      console.error('Failed to retrieve refresh token from Key Vault:', error.message);
    }
  }

  return fallbackRefreshToken;
};

module.exports = {
  saveRefreshToken,
  getStoredRefreshToken,
  isKeyVaultReady,
  getCachedAccessToken,
  setCachedAccessToken
};
