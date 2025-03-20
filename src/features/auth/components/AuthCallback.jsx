import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getCodeVerifier, clearCodeVerifier } from "../../../utils/pkceUtils";
import { setToken } from "../../../utils/tokenStorage";

export default function AuthCallback() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState("");
    
    useEffect(() => {
        const processAuthCallback = async () => {
            console.log("Current URL:", window.location.href);
            
            // Handle hash fragment (#) for access token (implicit flow)
            if (window.location.hash && window.location.hash.includes('access_token')) {
                const params = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = params.get('access_token');
                
                if (accessToken) {
                    console.log("Found access_token in hash");
                    login(null, accessToken);
                    setToken(accessToken);
                    navigate('/home');
                    return;
                }
            }

            // Handle search params (?code=) for authorization code flow
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code');
            const verifier = getCodeVerifier();
            
            console.log("Code found:", !!code);
            console.log("Verifier found:", !!verifier);

            if (code && verifier) {
                try {
                    // Determine correct redirect URI based on environment
                    const redirectUri = window.location.hostname === 'localhost' || 
                                        window.location.hostname === '127.0.0.1'
                        ? import.meta.env.VITE_SPOTIFY_REDIRECT_URI 
                        : "https://lilswapnil.github.io/musix/#/callback";
                    
                    console.log("Using redirect URI:", redirectUri);
                    
                    const response = await fetch('https://accounts.spotify.com/api/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            grant_type: 'authorization_code',
                            code,
                            redirect_uri: redirectUri,
                            client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
                            code_verifier: verifier,
                        }).toString(),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        console.log("Token exchange successful");
                        login(null, data.access_token);
                        // Use localStorage instead of sessionStorage
                        localStorage.setItem('spotify_access_token', data.access_token);
                        setToken(data.access_token);
                        clearCodeVerifier();
                        navigate('/home');
                    } else {
                        console.error("Token exchange failed:", data);
                        setError(data.error_description || "Authentication failed");
                        navigate('/login');
                    }
                } catch (error) {
                    console.error("Error during token exchange:", error);
                    setError("Network error during authentication");
                    navigate('/login');
                }
            } else {
                console.error("No code or verifier found");
                setError("Missing authentication parameters");
                navigate('/login');
            }
        };

        processAuthCallback();
    }, [login, navigate]);

    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-accent">Authenticating with Spotify...</p>
                {error && <p className="mt-2 text-red-500">{error}</p>}
            </div>
        </div>
    );
}