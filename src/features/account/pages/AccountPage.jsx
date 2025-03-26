import React, { useEffect, useState } from 'react';
import UserDetails from "../components/UserDetails";
import { getAccessToken } from '../../../utils/tokenStorage';
import { useNavigate } from 'react-router-dom';

export default function AccountPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Quick check for token without redirecting yet
    const token = getAccessToken();
    if (token) {
      setAuthenticated(true);
    } else {
      // Redirect to login only if definitely not authenticated
      localStorage.setItem('app_redirect_location', '/account');
      navigate('/login');
    }
    setChecking(false);
  }, [navigate]);

  // Only render the UserDetails when authentication is confirmed or being checked
  if (checking) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-accent">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Don't render anything, redirect will happen
  }

  return (
    <>
      <UserDetails />
    </>
  );
}
