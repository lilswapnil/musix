import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { setToken } from "../../../utils/tokenStorage";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const processAuthCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const verifier = localStorage.getItem('pkce_code_verifier'); // Retrieve the code_verifier

      if (code && verifier) {
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: import.meta.env.MODE === 'development'
                ? import.meta.env.VITE_SPOTIFY_LOCAL_REDIRECT_URI.replace(/#/g, '%23')
                : import.meta.env.VITE_SPOTIFY_REDIRECT_URI.replace(/#/g, '%23'),
              client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
              code_verifier: verifier, // Use the retrieved code_verifier
            }).toString(),
          });

          const data = await response.json();
          if (response.ok) {
            setToken(data.access_token);
            login(null, data.access_token);
            localStorage.removeItem('pkce_code_verifier'); // Clear the code_verifier
            navigate('/home');
          } else {
            console.error("Error during token exchange:", data);
            navigate('/login');
          }
        } catch (error) {
          console.error("Error during token exchange:", error);
          navigate('/login');
        }
      } else {
        console.error("Authorization code or verifier is missing.");
        navigate('/login');
      }
    };

    processAuthCallback();
  }, [login, navigate]);

  return <h1>Authentication</h1>;
}
