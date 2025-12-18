import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

export const youtubeService = {
  /**
   * Initialize the Google API client
   */
  initClient: () => {
    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            scope: SCOPES,
          })
          .then(() => resolve())
          .catch((error) => reject(error));
      });
    });
  },

  /**
   * Sign in the user and get the access token
   */
  signIn: async () => {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      const accessToken = user.getAuthResponse().access_token;

      // Save the token to localStorage
      localStorage.setItem('youtube_access_token', accessToken);

      // Get and save user profile
      const profile = user.getBasicProfile();
      const userProfile = {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        image: profile.getImageUrl(),
        provider: 'youtube'
      };

      localStorage.setItem('youtube_user_profile', JSON.stringify(userProfile));

      return { accessToken, userProfile };
    } catch (error) {
      console.error('YouTube Sign-In Error:', error);
      throw error;
    }
  },

  /**
   * Fetch YouTube subscriptions
   */
  fetchSubscriptions: async () => {
    const accessToken = localStorage.getItem('youtube_access_token');
    if (!accessToken) {
      throw new Error('No YouTube access token found');
    }

    try {
      const response = await gapi.client.youtube.subscriptions.list({
        part: 'snippet',
        mine: true,
      });
      return response.result.items;
    } catch (error) {
      console.error('Error fetching YouTube subscriptions:', error);
      throw error;
    }
  },
};