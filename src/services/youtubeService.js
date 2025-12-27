const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

const IS_CONFIGURED = Boolean(
  CLIENT_ID &&
  !String(CLIENT_ID).includes('your_youtube_client_id_here')
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
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google OAuth script.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const ensureTokenClient = async () => {
  if (!IS_CONFIGURED) {
    throw new Error('YouTube login is not configured.');
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google OAuth client is unavailable.');
  }

  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {}
    });
  }

  return tokenClient;
};

async function fetchUserProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube user profile');
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

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
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
      throw new Error('YouTube login is not configured.');
    }

    const client = await ensureTokenClient();

    return new Promise((resolve, reject) => {
      client.callback = async (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        const accessToken = response.access_token;
        localStorage.setItem('youtube_access_token', accessToken);

        try {
          const userProfile = await fetchUserProfile(accessToken);
          localStorage.setItem('youtube_user_profile', JSON.stringify(userProfile));
          resolve({ accessToken, userProfile });
        } catch (error) {
          reject(error);
        }
      };

      client.requestAccessToken({ prompt: 'consent' });
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