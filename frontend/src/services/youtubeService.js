import { normalizeApiError } from './apiClient';

const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const IS_CONFIGURED = Boolean(
  CLIENT_ID &&
  CLIENT_ID.length > 10 &&
  !String(CLIENT_ID).includes('your_youtube_client_id_here') &&
  !String(CLIENT_ID).includes('placeholder')
);

let googleScriptPromise = null;
let tokenClient = null;

const loadGoogleScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google OAuth is only available in the browser.'));
  }

  if (googleScriptPromise) return googleScriptPromise;

  if (window.google?.accounts?.oauth2) {
    googleScriptPromise = Promise.resolve();
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for google.accounts to be available
      const checkGoogle = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    };
    script.onerror = () => reject(new Error('Failed to load Google OAuth script.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const ensureTokenClient = async () => {
  if (!IS_CONFIGURED) {
    throw new Error('YouTube login is not configured. Please add VITE_YOUTUBE_CLIENT_ID to your environment.');
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google OAuth client failed to load. Please check your internet connection and try again.');
  }

  if (!tokenClient) {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {},
        error_callback: (error) => {
          console.error('Google OAuth error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize token client:', error);
      throw new Error('Failed to initialize Google authentication. Please try again.');
    }
  }

  return tokenClient;
};

async function fetchUserProfile(accessToken) {
  const requestUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = new Error('Failed to fetch YouTube user profile');
    error.status = response.status;
    throw normalizeApiError(error, requestUrl);
  }

  const profile = await response.json();
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    image: profile.picture,
    provider: 'youtube'
  };
}

async function fetchYouTube(endpoint, params = {}) {
  const accessToken = localStorage.getItem('youtube_access_token');
  if (!accessToken) {
    throw new Error('No YouTube access token found');
  }

  const url = new URL(`https://youtube.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  if (API_KEY) {
    url.searchParams.set('key', API_KEY);
  }

  const requestUrl = url.toString();
  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = new Error(`YouTube API error: ${response.status}`);
    error.status = response.status;
    throw normalizeApiError(error, requestUrl);
  }

  return response.json();
}

export const youtubeService = {
  isConfigured: () => IS_CONFIGURED,

  initClient: async () => {
    if (!IS_CONFIGURED) {
      throw new Error('YouTube login is not configured.');
    }
    await loadGoogleScript();
  },

  signIn: async () => {
    if (!IS_CONFIGURED) {
      throw new Error('YouTube login is not configured. Please add your Google OAuth credentials.');
    }

    const client = await ensureTokenClient();

    return new Promise((resolve, reject) => {
      // Set up the callback before requesting access token
      client.callback = async (response) => {
        if (response.error) {
          console.error('Google OAuth error response:', response);
          reject(new Error(response.error_description || response.error || 'Authentication failed'));
          return;
        }

        const accessToken = response.access_token;
        if (!accessToken) {
          reject(new Error('No access token received from Google'));
          return;
        }
        
        localStorage.setItem('youtube_access_token', accessToken);

        try {
          const userProfile = await fetchUserProfile(accessToken);
          localStorage.setItem('youtube_user_profile', JSON.stringify(userProfile));
          resolve({ accessToken, userProfile });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          reject(new Error('Failed to fetch your Google profile. Please try again.'));
        }
      };

      try {
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (error) {
        console.error('Failed to request access token:', error);
        reject(new Error('Failed to open Google sign-in. Please check if popups are blocked.'));
      }
    });
  },

  fetchSubscriptions: async () => {
    const data = await fetchYouTube('subscriptions', {
      part: 'snippet',
      mine: 'true',
      maxResults: 25
    });
    return data.items || [];
  },

  clearSession: () => {
    localStorage.removeItem('youtube_access_token');
    localStorage.removeItem('youtube_user_profile');
  }
};