import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, getRedirectResult } from 'firebase/auth';
import { isMobileDevice } from '../utils/deviceDetection';

const AuthPage = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Get the return URL from location state or default to home page
  const from = location.state?.from || '/';

  // Add handling for redirect paths
  useEffect(() => {
    // Check for user authentication state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is already logged in, redirect to saved path or home
        const lastPath = localStorage.getItem('lastPath');
        if (lastPath && lastPath !== '/auth') {
          // Clear the path to prevent redirect loops
          localStorage.removeItem('lastPath');
          navigate(lastPath, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Check for redirect result on component mount (for all devices)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setGoogleLoading(true);

        // Check if we have a redirect in progress (from localStorage)
        const redirectStarted = localStorage.getItem('auth_redirect_started');

        try {
          const result = await getRedirectResult(auth);

          if (result && result.user) {
            console.log('Redirect result detected in AuthPage');
            // User has been authenticated via redirect
            // The user state will be updated by the AuthContext

            // Clear the redirect tracking
            localStorage.removeItem('auth_redirect_started');

            // Update Redux store with user information
            dispatch({
              type: 'auth/setUser',
              payload: {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                // Note: supabaseUserId might not be available here
                // It should be handled by the AuthContext
              },
            });

            toast.success('Logged in with Google successfully!');
          } else if (redirectStarted) {
            // If we had a redirect in progress but no result, it might have failed
            console.log('Redirect was in progress but no result was returned');
            // Only clear if it's been more than 2 minutes (to avoid clearing during normal redirect flow)
            const startTime = parseInt(redirectStarted, 10);
            const now = Date.now();
            if (now - startTime > 2 * 60 * 1000) {
              localStorage.removeItem('auth_redirect_started');
            }
          }
        } catch (redirectError) {
          console.error('Error getting redirect result:', redirectError);

          // Handle the specific sessionStorage error
          if (redirectError.message && redirectError.message.includes('sessionStorage is inaccessible')) {
            console.warn('SessionStorage issue detected in AuthPage');
            toast.error('Authentication error: Browser storage issue. Please try again or use a different browser.');
          }

          // Clear the redirect tracking if there was an error
          localStorage.removeItem('auth_redirect_started');
        }
      } catch (err) {
        console.error('Error in AuthPage redirect handling:', err);
        setError(err.message || 'An error occurred during Google authentication');
      } finally {
        setGoogleLoading(false);
      }
    };

    checkRedirectResult();
  }, [dispatch]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      // Try to authenticate with Google
      const result = await loginWithGoogle();

      // If we get a result, it means we used popup authentication (fallback)
      if (result && result.user) {
        console.log('User authenticated with Google popup');

        // Update Redux store with user information
        dispatch({
          type: 'auth/setUser',
          payload: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            supabaseUserId: result.user.supabaseUserId
          },
        });

        toast.success('Logged in with Google successfully!');

        // Navigate to home or saved path
        const lastPath = localStorage.getItem('lastPath');
        if (lastPath && lastPath !== '/auth') {
          localStorage.removeItem('lastPath');
          navigate(lastPath, { replace: true });
        } else {
          navigate('/', { replace: true });
        }

        setGoogleLoading(false);
      } else {
        // We're redirecting to Google auth
        // We'll show a loading message but not navigate or update state
        console.log('Redirecting to Google authentication...');
        // We don't set googleLoading to false here as we're redirecting away
      }
    } catch (err) {
      console.error('Google authentication error:', err);

      // Handle the specific sessionStorage error
      if (err.message && err.message.includes('sessionStorage is inaccessible')) {
        toast.error('Authentication error: Browser storage issue. Please try again or use a different browser.');
      } else {
        setError(err.message || 'An error occurred during Google authentication');
        toast.error('Authentication failed. Please try again.');
      }

      setGoogleLoading(false);
    }
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Login successful
      toast.success('Login successful!');

      // Get the redirect path
      const lastPath = localStorage.getItem('lastPath');
      if (lastPath && lastPath !== '/auth') {
        localStorage.removeItem('lastPath');
        navigate(lastPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      setIsLoading(false);
      setLoginError(error.message);
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Sign in to Grafite
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded-md text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="w-full">
            <Button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 rounded-md"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                    <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                    <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                    <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                    <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AuthPage;
