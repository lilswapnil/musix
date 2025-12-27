const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const {
  saveRefreshToken,
  getStoredRefreshToken,
  getCachedAccessToken,
  setCachedAccessToken,
  isKeyVaultReady
} = require('./azureVault');
const { invokeAzureMl } = require('./azureMlClient');
const config = require('./config');

const app = express();
const PORT = config.port;

app.set('trust proxy', 1);

const corsOptions = config.cors.allowedOrigins.length
  ? {
      origin: config.cors.allowedOrigins,
      credentials: config.cors.allowCredentials
    }
  : {
      origin: true,
      credentials: config.cors.allowCredentials
    };

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(cors(corsOptions));
app.use(express.json({ limit: config.security.requestBodyLimit }));

const sensitiveLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/azure', sensitiveLimiter);
app.use('/refresh-token', sensitiveLimiter);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const buildError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const requireServiceKey = (req, res, next) => {
  const serviceKey = config.security.serviceApiKey;
  if (!serviceKey) {
    if (config.isProduction) {
      return next(buildError('Service key not configured', 500));
    }
    return next();
  }

  const providedKey = req.header('x-service-key') || req.query.serviceKey;
  if (providedKey !== serviceKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid service key' });
  }

  return next();
};

const maybeRequireAzureServiceKey = config.security.requireAzureServiceKey
  ? requireServiceKey
  : (req, res, next) => next();

const buildAzureMlPayload = (body = {}) => {
  if (body.payload && Object.keys(body.payload).length > 0) {
    return body.payload;
  }

  const sanitized = {};

  const pushField = (key, value) => {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  };

  pushField('track', body.track);
  pushField('audioFeatures', body.audioFeatures);
  pushField('history', Array.isArray(body.history) ? body.history.slice(0, 25) : undefined);
  pushField('metadata', body.metadata || body.context || body.options);

  if (Object.keys(sanitized).length === 0) {
    throw new Error('Provide "payload" or track context for Azure ML request');
  }

  return sanitized;
};

// Serve static files from the React app if in production
if (config.isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
}

app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    keyVaultReady: isKeyVaultReady()
  });
});

app.post('/api/azure/spotify/refresh-token', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!isNonEmptyString(refreshToken)) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    await saveRefreshToken(refreshToken);
    return res.json({ storedInKeyVault: isKeyVaultReady(), status: 'saved' });
  } catch (error) {
    console.error('Azure storage error:', error.message);
    return res.status(500).json({ error: 'Failed to store refresh token' });
  }
});

app.post('/api/azure/spotify/access-token', requireServiceKey, async (req, res) => {
  try {
    const cachedToken = getCachedAccessToken();
    if (cachedToken) {
      return res.json({ access_token: cachedToken, source: 'cache' });
    }

    const refreshToken = req.body?.refreshToken || await getStoredRefreshToken();
    if (!isNonEmptyString(refreshToken)) {
      return res.status(404).json({ error: 'No refresh token available' });
    }

      const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
          client_id: config.spotify.clientId,
          client_secret: config.spotify.clientSecret
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const payload = tokenResponse.data || {};
    setCachedAccessToken(payload.access_token, payload.expires_in);

    if (payload.refresh_token) {
      await saveRefreshToken(payload.refresh_token);
    }

    return res.json({
      access_token: payload.access_token,
      expires_in: payload.expires_in,
      scope: payload.scope,
      token_type: payload.token_type,
      source: 'spotify'
    });
  } catch (error) {
    console.error('Azure token service error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to issue access token' });
  }
});

app.post('/api/azure/ml/recommendations', maybeRequireAzureServiceKey, async (req, res) => {
  if (!config.azureMl.enabled) {
    return res.status(501).json({ error: 'Azure ML endpoint not configured' });
  }

  try {
    const payload = buildAzureMlPayload(req.body || {});
    const inference = await invokeAzureMl(payload);

    return res.json({
      ok: true,
      model: config.azureMl.deploymentName || null,
      data: inference
    });
  } catch (error) {
    const details = error.response?.data || error.message;
    console.error('Azure ML recommendation error:', details);
    return res.status(500).json({
      error: 'Azure ML invocation failed',
      details
    });
  }
});

// Spotify authentication callback route
app.get('/callback', sensitiveLimiter, async (req, res) => {
  const { code } = req.query;
  
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.spotify.redirectUri,
        client_id: config.spotify.clientId,
        client_secret: config.spotify.clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    res.redirect(`${config.spotify.clientUrl}/#access_token=${response.data.access_token}&refresh_token=${response.data.refresh_token}`);
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.redirect(`${config.spotify.clientUrl}/#error=auth_failed`);
  }
});

// Token refresh endpoint
app.post('/refresh-token', async (req, res) => {
  const providedRefreshToken = req.body?.refresh_token;
  
    try {
      const refreshToken = providedRefreshToken || await getStoredRefreshToken();
      if (!isNonEmptyString(refreshToken)) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }
    
      const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
          client_id: config.spotify.clientId,
          client_secret: config.spotify.clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const payload = response.data;
    if (payload?.refresh_token) {
      await saveRefreshToken(payload.refresh_token);
    }
    
    res.json(payload);
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
});

// Catch-all route for client-side routing in production
if (config.isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  void next; // keep four-arg signature to ensure Express error handler behavior
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  console.error('Unhandled error:', err);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});