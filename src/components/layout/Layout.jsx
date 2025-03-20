import NavBar from "./NavBar";
import { Outlet, useLocation } from "react-router-dom";
import logo from '../../assets/logo-light.svg';

export default function Layout() {
  const location = useLocation();
  const currentPath = location.hash.substring(1) || '/';
  const hideNavBar = currentPath === '/login' || currentPath === '/signup';

  return (
    <div className="min-h-screen bg-primary text-secondary">
      {!hideNavBar && <NavBar />}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 pb-24">
        <Outlet />
      </main>
      
      {/* Add safe bottom padding for mobile */}
      <div className="h-safe-bottom md:hidden"></div>
    </div>
  );
}