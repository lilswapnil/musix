# Authentication Flow Fixes

This document outlines all the critical fixes applied to the Spotify and Google/YouTube authentication flows.

## Issues Fixed

### 1. ProtectedRoute Loading State Variable Mismatch (CRITICAL)

**Issue:**
```javascript
// BEFORE - WRONG
const { isAuthenticated, loading } = useAuth();

// AuthContext exports 'isLoading', not 'loading'
```

**Fix:**
```javascript
// AFTER - CORRECT
const { isAuthenticated, isLoading } = useAuth();
```

**Impact:** The loading state was always `undefined`, causing improper handling of authentication checks and potentially allowing access to protected routes during loading states.

**File:** `src/components/routes/ProtectedRoute.jsx`

---

### 2. Missing Token Expiry Storage (CRITICAL)

**Issue:**
Spotify API returns `expires_in` (typically 3600 seconds) but it was not being stored, making token expiration checks unreliable.

**Fix in `exchangeCodeForToken()`:**
```javascript
// BEFORE
setAccessToken(data.access_token);

// AFTER
setAccessToken(data.access_token, data.expires_in);
```

**Fix in `refreshAccessToken()`:**
```javascript
// BEFORE
setAccessToken(data.access_token);

// AFTER
setAccessToken(data.access_token, data.expires_in);
```

**Impact:**
- Token expiry was never calculated or stored
- Tokens could be used past their expiration time
- Automatic token refresh wouldn't trigger at the right time
- API calls could fail with 401 errors

**Files:**
- `src/services/spotifyAuthService.js` (lines 64, 121)

---

### 3. Redirect URI Mismatch (CRITICAL)

**Issue:**
Two different methods were used to determine the redirect URI:
- Module-level: `import.meta.env.MODE === 'development'` (build-time check)
- Runtime: `window.location.hostname === 'localhost'` (runtime check)

This caused mismatches when:
- Running dev build on 127.0.0.1
- Running production build on localhost
- Resulted in "redirect_uri_mismatch" errors from Spotify

**Fix:**
Created a centralized helper function using consistent runtime checking:

```javascript
// Helper function to get consistent redirect URI
const getRedirectUri = () => {
  // Check if running on localhost (development)
  const isLocalhost = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

  return isLocalhost
    ? import.meta.env.VITE_SPOTIFY_LOCAL_REDIRECT_URI
    : import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
};
```

Used in both places:
- Authorization redirect (in `redirectToSpotify()`)
- Token exchange (in `exchangeCodeForToken()`)

**Impact:** Eliminated redirect URI mismatch errors during OAuth flow.

**File:** `src/services/spotifyAuthService.js`

---

### 4. YouTube Auth Not Integrated with AuthContext (HIGH)

**Issue:**
YouTube login was not properly integrated with the app's authentication state:
- Token stored in localStorage but AuthContext not updated
- `isAuthenticated` remained false even after successful login
- No user profile retrieved or stored
- Protected routes would deny access even with valid YouTube token

**Fixes:**

**A. Enhanced YouTube Service to Return User Profile:**
```javascript
// BEFORE
signIn: async () => {
  const user = await authInstance.signIn();
  const accessToken = user.getAuthResponse().access_token;
  localStorage.setItem('youtube_access_token', accessToken);
  return accessToken;
}

// AFTER
signIn: async () => {
  const user = await authInstance.signIn();
  const accessToken = user.getAuthResponse().access_token;

  // Get and save user profile
  const profile = user.getBasicProfile();
  const userProfile = {
    id: profile.getId(),
    name: profile.getName(),
    email: profile.getEmail(),
    image: profile.getImageUrl(),
    provider: 'youtube'
  };

  localStorage.setItem('youtube_access_token', accessToken);
  localStorage.setItem('youtube_user_profile', JSON.stringify(userProfile));

  return { accessToken, userProfile };
}
```

**B. Updated Login Page to Update AuthContext:**
```javascript
// BEFORE
const handleYouTubeLogin = async () => {
  const accessToken = await youtubeService.signIn();
  navigate('/home'); // AuthContext not updated!
};

// AFTER
const handleYouTubeLogin = async () => {
  setIsYouTubeLoading(true);
  const { accessToken, userProfile } = await youtubeService.signIn();

  // Update auth context
  setIsAuthenticated(true);
  setUserProfile(userProfile);

  navigate('/home');
};
```

**C. Added Error Handling and Loading States:**
- Loading spinner during YouTube sign-in
- Error messages displayed to user
- Graceful fallback to Spotify if YouTube fails

**Impact:** YouTube authentication now properly integrates with app state, allowing users to access protected routes and maintain session.

**Files:**
- `src/services/youtubeService.js`
- `src/features/auth/pages/LoginPage.jsx`

---

### 5. YouTube Token Not Cleared on Logout (MEDIUM)

**Issue:**
Logout function cleared Spotify tokens but left YouTube tokens in localStorage, causing:
- Stale tokens remaining after logout
- Potential auth confusion on re-login
- Security risk of orphaned tokens

**Fix:**
```javascript
// BEFORE
const logout = () => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiry');
  localStorage.removeItem('spotify_user_profile');
  // YouTube tokens NOT removed
};

// AFTER
const logout = () => {
  // Clear all Spotify tokens
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiry');
  localStorage.removeItem('spotify_user_profile');

  // Clear YouTube tokens
  localStorage.removeItem('youtube_access_token');
  localStorage.removeItem('youtube_user_profile');

  // Clear PKCE verifier
  localStorage.removeItem('pkce_code_verifier');
};
```

**Impact:** Complete cleanup on logout, preventing token leakage.

**File:** `src/context/AuthContext.jsx`

---

### 6. Environment Variable Issues (MEDIUM)

**Issue:**
- Duplicate `VITE_SPOTIFY_CLIENT_SECRET` key (line 16 had YouTube secret under Spotify key name)
- Duplicate `VITE_SPOTIFY_LOCAL_REDIRECT_URI`
- Poor organization of environment variables
- No `.env.example` file for reference

**Fixes:**

**A. Corrected Environment Variable Names:**
```bash
# BEFORE
VITE_SPOTIFY_CLIENT_SECRET=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  # Wrong!

# AFTER
VITE_YOUTUBE_CLIENT_SECRET=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
```

**B. Removed Duplicates:**
- Removed duplicate `VITE_SPOTIFY_LOCAL_REDIRECT_URI`

**C. Reorganized for Clarity:**
```bash
# Spotify API credentials
VITE_SPOTIFY_CLIENT_ID=...
VITE_SPOTIFY_CLIENT_SECRET=...
VITE_SPOTIFY_REDIRECT_URI=...
VITE_SPOTIFY_LOCAL_REDIRECT_URI=...

# YouTube/Google API credentials
VITE_YOUTUBE_CLIENT_ID=...
VITE_YOUTUBE_CLIENT_SECRET=...
VITE_YOUTUBE_API_KEY=...
VITE_YOUTUBE_REDIRECT_URI=...

# Tidal API credentials
VITE_TIDAL_CLIENT_ID=...
VITE_TIDAL_CLIENT_SECRET=...

# Client URL
CLIENT_URL=...
```

**D. Created `.env.example`:**
Template file for new developers with placeholder values.

**Impact:**
- Proper environment configuration
- Easier onboarding for new developers
- Prevents confusion and misconfiguration

**Files:**
- `.env`
- `.env.example` (new)

---

## Security Notes

### ⚠️ Important: Client Secrets in Frontend

**Current Issue:**
The `.env` file contains client secrets (both Spotify and YouTube) which are exposed in the built JavaScript bundle when using Vite's `VITE_` prefix.

**Recommendation:**
- **Do NOT use client secrets in the frontend**
- Client secrets should only be used in backend/server environments
- For Spotify: PKCE flow (currently implemented) doesn't require client secret
- For YouTube: Use API key for public access, or implement backend OAuth flow

**What to do:**
1. Remove `VITE_SPOTIFY_CLIENT_SECRET` from `.env` (not needed for PKCE)
2. Consider implementing a backend proxy for YouTube OAuth
3. Or use YouTube's public API key only for read-only operations

**Why this matters:**
- Client secrets in frontend code can be extracted by anyone
- Malicious users could use your credentials
- Violates OAuth 2.0 security best practices

---

## Testing Checklist

After applying these fixes, test the following scenarios:

### Spotify Authentication
- [ ] Fresh login redirects to Spotify correctly
- [ ] OAuth callback exchanges code for token successfully
- [ ] Access token and expiry are stored correctly
- [ ] User profile is fetched and stored
- [ ] Protected routes allow access after login
- [ ] Token refresh works automatically when expired
- [ ] Logout clears all Spotify tokens
- [ ] Can re-login after logout

### YouTube Authentication
- [ ] YouTube login button works
- [ ] Loading state shows during sign-in
- [ ] User profile is retrieved and stored
- [ ] AuthContext is updated with authenticated state
- [ ] Protected routes allow access after login
- [ ] Error messages display on failure
- [ ] Logout clears all YouTube tokens
- [ ] Can re-login after logout

### Edge Cases
- [ ] Expired token triggers automatic refresh
- [ ] Invalid token redirects to login
- [ ] Logout from one provider clears all tokens
- [ ] Guest mode still works
- [ ] Localhost and production environments both work
- [ ] 127.0.0.1 works same as localhost
- [ ] Protected routes show loading state properly
- [ ] Multiple rapid login attempts don't break state

---

## Files Modified

### Core Auth Files
1. `src/components/routes/ProtectedRoute.jsx` - Fixed loading state variable
2. `src/services/spotifyAuthService.js` - Fixed token expiry and redirect URI
3. `src/services/youtubeService.js` - Added user profile retrieval
4. `src/features/auth/pages/LoginPage.jsx` - Integrated YouTube with AuthContext
5. `src/context/AuthContext.jsx` - Added YouTube token cleanup

### Configuration Files
6. `.env` - Fixed variable names and organization
7. `.env.example` - Created template (NEW)

### Documentation
8. `AUTH_FIXES.md` - This file (NEW)

---

## Migration Notes

### For Existing Users

If you have an existing installation, you'll need to:

1. **Clear localStorage** after updating to ensure old tokens don't interfere:
   ```javascript
   localStorage.clear();
   ```

2. **Re-authenticate** with both Spotify and YouTube to populate new profile fields

3. **Update `.env`** file based on `.env.example` if needed

### For New Installations

1. Copy `.env.example` to `.env`
2. Fill in your API credentials
3. Ensure redirect URIs match your Spotify/YouTube app configurations
4. Start the dev server and test login flows

---

## Future Improvements

1. **Implement Backend OAuth Proxy**
   - Move client secrets to backend
   - Implement token exchange on server
   - Return only access tokens to frontend

2. **Add Token Refresh for YouTube**
   - YouTube tokens expire after 1 hour
   - Implement refresh token flow
   - Auto-refresh before expiration

3. **Unified Auth System**
   - Abstract provider-specific logic
   - Single auth interface for all providers
   - Easier to add new providers (Tidal, Apple Music, etc.)

4. **Better Error Handling**
   - User-friendly error messages
   - Automatic retry on transient failures
   - Logging for debugging

5. **Security Enhancements**
   - CSRF protection
   - State parameter validation
   - Secure token storage (consider httpOnly cookies)

---

## Support

If you encounter issues after these fixes:

1. Clear browser cache and localStorage
2. Check browser console for errors
3. Verify `.env` configuration matches your OAuth app settings
4. Ensure redirect URIs are whitelisted in Spotify/YouTube dashboards
5. Check that PKCE is enabled in Spotify app settings

For persistent issues, check:
- Spotify OAuth app configuration
- YouTube/Google Cloud Console settings
- Network tab for failed requests
- Console logs for detailed error messages
