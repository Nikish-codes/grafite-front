import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import StudyTimeTracker from '../../features/analytics/StudyTimeTracker';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Always use dark mode, no toggle option
  const isDarkMode = true;
  const { user, isAuthenticated, logout } = useAuth();
  
  // Always set to dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);
  
  // Dark mode is now enforced, no toggle function needed
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Navigation items
  const navItems = [
    // Home button removed as requested
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              
              <span className="text-xl font-bold text-primary">Grafite</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium ${
                    location.pathname === item.path
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* User Menu (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Show Analytics and Discord buttons only on homepage */}
              {location.pathname === '/' && (
                <div className="flex items-center space-x-3 mr-4">
                  <Link
                    to="/analytics"
                    className="px-3 py-1.5 rounded-md font-medium bg-blue-900/40 text-white hover:bg-blue-700 transition-colors duration-200 text-sm"
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/bookmarks"
                    className="px-3 py-1.5 rounded-md font-medium bg-amber-900/40 text-white hover:bg-amber-700 transition-colors duration-200 text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                    </svg>
                    Bookmarks
                  </Link>
                  <a
                    href="https://discord.gg/k6uzz2CTdN"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1.5 rounded-md font-medium bg-[#5865F2] text-white hover:bg-[#4752c4] transition-colors duration-200 text-sm"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
                    </svg>
                    Discord
                  </a>
                </div>
              )}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-sm font-medium text-gray-400 hover:text-white">
                    <span>{user.email ? user.email.split('@')[0] : 'User'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700">
                      Profile
                    </Link>
                    <Link
                      to="/bookmarks"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                      </svg>
                      Bookmarks
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/auth" 
                  className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/80 text-white rounded-md"
                >
                  Login
                </Link>
              )}
              
              {/* Theme Toggle */}
              
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              {/* Show Analytics and Discord buttons only on homepage for mobile */}
              {location.pathname === '/' && (
                <div className="flex items-center space-x-2 mr-3">
                  <Link
                    to="/analytics"
                    className="px-2 py-1 text-xs rounded-md font-medium bg-blue-900/40 text-white hover:bg-blue-700 transition-colors duration-200"
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/bookmarks"
                    className="px-2 py-1 text-xs rounded-md font-medium bg-amber-900/40 text-white hover:bg-amber-700 transition-colors duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 mr-1">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                    </svg>
                    Bookmarks
                  </Link>
                  <a
                    href="https://discord.gg/k6uzz2CTdN"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-2 py-1 text-xs rounded-md font-medium bg-[#5865F2] text-white hover:bg-[#4752c4] transition-colors duration-200"
                  >
                    <svg className="w-2.5 h-2.5 mr-1" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
                    </svg>
                    Discord
                  </a>
                </div>
              )}
              <button
                onClick={toggleMenu}
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-neutral-900 border-b border-neutral-800">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium ${
                    location.pathname === item.path
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-gray-400 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/bookmarks"
                    className="text-sm font-medium text-gray-400 hover:text-white flex items-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                    </svg>
                    Bookmarks
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-sm font-medium text-red-400 hover:text-red-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="text-sm font-medium text-gray-400 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
              
              {/* Dark mode toggle removed */}
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer - Only shown on homepage */}
      {location.pathname === '/' && (
        <footer className="bg-neutral-900 border-t border-neutral-800 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-400">
                  &copy; {new Date().getFullYear()} Grafite. All rights reserved.
                </p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
      
      {/* Study Time Tracker */}
      <StudyTimeTracker />
    </div>
  );
};

export default Layout;