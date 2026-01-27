import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import logo from '../../assets/logo-light.svg';
import { debounce } from '../../utils/requestUtils';

export default function NavBar() {
  const [searchInput, setSearchInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Create debounced search handler
  const debouncedSearch = useMemo(() => 
    debounce((query) => {
      if (query.trim()) {
        navigate(`/search?query=${encodeURIComponent(query)}`);
      }
    }, 500)
  , [navigate]);

  // Update search input and trigger debounced search
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    debouncedSearch(query);
  };

  // Handle form submission (immediate search)
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchInput)}`);
    }
  };

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isSearchPage = location.pathname === '/search';

  return (
    <nav className="glass-dark border border-white/20 sticky top-2 z-50 shadow-lg rounded-lg mx-2 sm:mx-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center justify-between h-16">
          {/* Logo - made bigger on mobile */}
          <div className="flex-shrink-0 z-10">
            <NavLink to="/home" className="flex items-center">
              <img className="h-8 sm:h-10 md:h-12 w-auto" src={logo} alt="MusixApp Logo" />
            </NavLink>
          </div>

          {/* Navigation links - hidden on mobile, absolute center on larger screens */}
          <div className="hidden md:flex absolute left-0 right-0 justify-center">
            <div className="flex items-center space-x-4">
              <NavLink 
                to="/home" 
                className={({isActive}) => 
                  isActive 
                    ? "text-white font-medium px-3 py-2 rounded-md"
                    : "text-muted hover:text-white px-3 py-2 rounded-md transition-colors"
                }
              >
                Home
              </NavLink>
              <NavLink 
                to="/my-library" 
                className={({isActive}) => 
                  isActive 
                    ? "text-white font-medium px-3 py-2 rounded-md"
                    : "text-muted hover:text-white px-3 py-2 rounded-md transition-colors"
                }
              >
                Library
              </NavLink>
              <NavLink 
                to="/account" 
                className={({isActive}) => 
                  isActive 
                    ? "text-white font-medium px-3 py-2 rounded-md"
                    : "text-muted hover:text-white px-3 py-2 rounded-md transition-colors"
                }
              >
                Account
              </NavLink>
            </div>
          </div>

          {/* Search bar - responsive width */}
          <div className="hidden md:block w-36 lg:w-48 z-10">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={handleSearchInput}
                className={`w-full bg-transparent border ${
                  isSearchPage ? 'border-white text-white' : 'border-muted text-muted'
                } focus:border-accent focus:ring-1 focus:ring-accent focus:text-white rounded-full py-1.5 px-4 
                placeholder-muted focus:outline-none transition-colors`}
              />
              <button 
                type="submit"
                className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-muted hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-muted hover:text-white p-2"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - fullscreen overlay with better mobile navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 glass bg-opacity-95 z-40 h-[100dvh]">
          <div className="px-4 pt-20 pb-6 h-full flex flex-col">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-white p-2 touch-manipulation"
              aria-label="Close menu"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleSearch} className="relative mb-8 px-2 w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={handleSearchInput}
                className="w-full bg-transparent border border-muted focus:border-accent rounded-full py-3 px-4 text-white placeholder-muted focus:outline-none"
              />
              <button 
                type="submit"
                className="absolute right-2 top-0 h-full px-5 flex items-center justify-center text-muted hover:text-white touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </form>

            <div className="flex-1 flex flex-col">
              <NavLink 
                to="/home" 
                className={({isActive}) => 
                  `block text-lg py-6 border-b border-muted/20 ${isActive ? 'text-white font-medium' : 'text-muted'}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink 
                to="/my-library" 
                className={({isActive}) => 
                  `block text-lg py-6 border-b border-muted/20 ${isActive ? 'text-white font-medium' : 'text-muted'}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Library
              </NavLink>
              <NavLink 
                to="/account" 
                className={({isActive}) => 
                  `block text-lg py-6 border-b border-muted/20 ${isActive ? 'text-white font-medium' : 'text-muted'}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Account
              </NavLink>
            </div>
            
            <div className="mt-auto pt-6 text-center text-muted text-sm">
              <p>© 2025 Music App</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}