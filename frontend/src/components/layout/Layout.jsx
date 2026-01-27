import NavBar from "./NavBar";
import { Outlet, useLocation, useNavigation } from "react-router-dom";
import LoadingSpinner from "../common/ui/LoadingSpinner";
import SpotifyPlayer from "../player/SpotifyPlayer";

export default function Layout() {
  const location = useLocation();
  const navigation = useNavigation();
  const currentPath = location.hash.substring(1) || '/';
  const hideNavBar = currentPath === '/login' || currentPath === '/signup';
  const isLoading = navigation.state === 'loading';

  return (
    <div className="min-h-screen text-secondary">
      {!hideNavBar && <NavBar />}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 pb-24">
        {isLoading ? (
          <LoadingSpinner message="Loading page..." />
        ) : (
          <Outlet />
        )}
      </main>
      {/* Persistent bottom player (global across routes) */}
      <SpotifyPlayer />

      {/* Add safe bottom padding for mobile */}
      <div className="h-safe-bottom md:hidden"></div>
    </div>
  );
}