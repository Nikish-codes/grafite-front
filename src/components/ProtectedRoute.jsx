import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component that redirects to login page if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - Either the children or a redirect to login
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If auth is still loading, don't render anything yet
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    // Save the current path for later restoration
    if (location.pathname !== '/auth') {
      localStorage.setItem('lastPath', location.pathname + location.search);
    }
    
    return <Navigate to="/auth" replace />;
  }

  // User is authenticated, render the protected route
  return children;
};

export default ProtectedRoute;
