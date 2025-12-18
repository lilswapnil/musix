# Fixing "Google App Blocked" Error

If you're seeing an "App Blocked" error when trying to log in with Google/YouTube, this means your Google Cloud Console app is not verified and is restricted to test users only.

## Why This Happens

Google requires apps that access user data to go through a verification process. Until verified, the app can only be used by:
1. The app owner
2. Users added as "Test users" in Google Cloud Console

## Quick Fix: Add Yourself as a Test User

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you haven't)

### Step 2: Configure OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**
2. You should see your app's consent screen configuration

### Step 3: Add Test Users
1. Scroll down to the **Test users** section
2. Click **+ ADD USERS**
3. Enter the email addresses you want to allow (your own email or team members)
4. Click **SAVE**

### Step 4: Try Logging In Again
1. Go back to your Musix app
2. Click "Continue with YouTube"
3. You should now be able to log in successfully

## Permanent Fix: Verify Your App (Optional)

If you want anyone to be able to use YouTube login:

### Step 1: Complete OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Fill out all required fields:
   - App name: "Musix"
   - User support email
   - App logo (optional but recommended)
   - App domain
   - Developer contact information

### Step 2: Add Required Scopes
Your app currently uses:
- `https://www.googleapis.com/auth/youtube.readonly` - View your YouTube account

Make sure this scope is listed in the **Scopes** section.

### Step 3: Submit for Verification
1. Click **SUBMIT FOR VERIFICATION**
2. Provide required documentation:
   - YouTube video showing how your app works
   - Privacy policy URL
   - Terms of service URL
3. Wait for Google's review (can take 1-4 weeks)

## Alternative: Use Internal User Type

If this app is only for personal use or a small team:

1. Go to **OAuth consent screen**
2. Change **User Type** to **Internal**
3. This limits the app to users in your Google Workspace organization
4. No verification required!

## Common Issues

### "Access blocked: This app's request is invalid"
**Solution:** Check your redirect URIs in OAuth 2.0 Client IDs:
1. Go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Ensure these URIs are listed:
   - `http://localhost:5173/musix/callback.html` (local development)
   - `https://lilswapnil.github.io/musix/callback` (production)

### "The app is still in testing mode"
**Solution:** Either:
- Add yourself as a test user (see above)
- OR publish the app (requires verification)

### "YouTube API key not set"
**Solution:**
1. Get a YouTube Data API v3 key from Google Cloud Console
2. Update `.env`:
   ```
   VITE_YOUTUBE_API_KEY=your_actual_api_key_here
   ```

## Current Configuration

Your app's YouTube credentials are in `.env`:
```env
VITE_YOUTUBE_CLIENT_ID=1012525230747-v782enkdj6po6ogdu4u6vgmgqg97ahv3.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=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
VITE_YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY  # ⚠️ Replace this!
```

## Testing Checklist

After adding test users:
- [ ] Can log in with Google/YouTube
- [ ] User profile is retrieved correctly
- [ ] AuthContext is updated with authentication state
- [ ] Can access protected routes after login
- [ ] Logout clears YouTube tokens properly

## Security Notes

⚠️ **Important:** Never commit your `.env` file to version control!

Your OAuth credentials should remain private. If exposed:
1. Revoke the client ID in Google Cloud Console
2. Generate new credentials
3. Update `.env` with new values
4. Add `.env` to `.gitignore`

## Need Help?

Check these resources:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [YouTube API Documentation](https://developers.google.com/youtube/v3)
- [OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)

## For Developers

If you're setting up Google auth for the first time:

1. **Create a Google Cloud Project**
   ```
   https://console.cloud.google.com/projectcreate
   ```

2. **Enable YouTube Data API v3**
   ```
   APIs & Services > Library > Search "YouTube Data API v3" > Enable
   ```

3. **Create OAuth 2.0 Credentials**
   ```
   APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized JavaScript origins: http://localhost:5173, https://lilswapnil.github.io
   - Authorized redirect URIs: http://localhost:5173/musix/callback.html, https://lilswapnil.github.io/musix/callback
   ```

4. **Create API Key**
   ```
   APIs & Services > Credentials > Create Credentials > API Key
   (For YouTube Data API v3)
   ```

5. **Configure OAuth Consent Screen**
   - Add app name, logo, support email
   - Add test users
   - Add required scopes

6. **Update .env**
   ```env
   VITE_YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   VITE_YOUTUBE_CLIENT_SECRET=your_client_secret
   VITE_YOUTUBE_API_KEY=your_api_key
   ```

That's it! Your Google/YouTube authentication should now work. 🎉
