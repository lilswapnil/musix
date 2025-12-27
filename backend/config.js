const dotenv = require('dotenv');

dotenv.config();

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'y', 'on'].includes(String(value).toLowerCase());
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value = '') =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const requiredInProduction = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'CLIENT_URL'
];

const missing = requiredInProduction.filter(name => isProduction && !process.env[name]);

if (isProduction && missing.length > 0) {
  throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
}

const serviceKey = process.env.AZURE_SERVICE_API_KEY || '';
if (isProduction && !serviceKey) {
  throw new Error('AZURE_SERVICE_API_KEY is required in production to secure privileged routes.');
}

const config = {
  nodeEnv,
  isProduction,
  port: toNumber(process.env.PORT, 5175),
  cors: {
    allowedOrigins: toList(process.env.ALLOWED_ORIGINS),
    allowCredentials: toBool(process.env.CORS_ALLOW_CREDENTIALS, false)
  },
  security: {
    serviceApiKey: serviceKey,
    requireAzureServiceKey: toBool(process.env.AZURE_ML_REQUIRE_SERVICE_KEY, true),
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '1mb',
    rateLimit: {
      windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
      max: toNumber(process.env.RATE_LIMIT_MAX, 120)
    }
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    clientUrl: process.env.CLIENT_URL
  },
  azureMl: {
    enabled: Boolean(process.env.AZURE_ML_ENDPOINT_URL),
    endpointUrl: process.env.AZURE_ML_ENDPOINT_URL || '',
    deploymentName: process.env.AZURE_ML_DEPLOYMENT_NAME || '',
    timeoutMs: toNumber(process.env.AZURE_ML_TIMEOUT_MS, 15_000)
  }
};

module.exports = config;
