import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getCodeVerifier, clearCodeVerifier } from "../../../utils/pkceUtils";

export default function AuthCallback() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const processAuthCallback = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get('code');
            const verifier = getCodeVerifier();

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
                            redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
                            client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
                            code_verifier: verifier,
                        }).toString(),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        login(null, data.access_token);
                        clearCodeVerifier();
                        navigate('/home');
                    } else {
                        navigate('/login');
                    }
                } catch (error) {
                    console.error("Error during token exchange:", error);
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        };

        processAuthCallback();
    }, [login, navigate]);

    return (
        <h1>Authentication</h1>
    )
}
