import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { signInWithGoogle, signOutUser } from '../services/authService';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed:', currentUser?.email);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener...');
      unsubscribe();
    };
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/auth'];
      const isPublicPath = publicPaths.includes(location.pathname);

      if (user && isPublicPath) {
        console.log('Authenticated user accessing public path, redirecting to home...');
        navigate('/', { replace: true });
      } else if (!user && !isPublicPath) {
        console.log('Unauthenticated user accessing protected path, redirecting to auth...');
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const login = async () => {
    try {
      setError(null);
      const result = await signInWithGoogle();
      return result;
    } catch (error) {
      console.error('Google authentication error:', error);
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOutUser();
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 