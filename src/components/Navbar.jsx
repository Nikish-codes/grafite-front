import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../services/supabaseClient';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl font-bold">GrafitePrep</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Home
                </Link>
                {user && (
                  <>
                    <Link to="/subjects/JEE" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                      Subjects
                    </Link>
                    <Link to="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                      Analytics
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-300 hover:text-white">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
