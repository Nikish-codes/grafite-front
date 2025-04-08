import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import './App.css';
import './styles/MathJax.css'; // Global MathJax styles
import { auth } from './services/firebaseConfig';
import { useAuth } from './context/AuthContext';
import { preloadCommonMath } from './services/mathJaxService';

// Import pages
import HomePage from './pages/HomePage';
import SubjectsPage from './pages/SubjectsPage';
import ChaptersPage from './pages/ChaptersPage';
import TopicsPage from './pages/TopicsPage';
import QuestionsListPage from './pages/QuestionsListPage';
import QuestionPage from './pages/QuestionPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ProgressAnalyticsPage from './pages/ProgressAnalyticsPage';
import BookmarksPage from './pages/BookmarksPage';
import ProtectedRoute from './components/ProtectedRoute';

// Import providers
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';

// Import services
import { initializeDatabase } from './services/supabaseService';

// Import custom components
import PrettyURL from './components/common/PrettyURL';

// Enhanced SecurityGuard component with route persistence
const SecurityGuard = ({ children }) => {
  useEffect(() => {
    // Only redirect in production and when not already on HTTPS
    if (process.env.NODE_ENV === 'production' && 
        window.location.protocol === 'http:') {
      window.location.replace(`https:${window.location.href.substring(window.location.protocol.length)}`);
    }
    
    // Security headers removed as requested by user
    
    // Session timeout handler - log out after 30 minutes of inactivity
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      // 30 minutes in milliseconds
      inactivityTimer = setTimeout(() => {
        // Check if user is authenticated before attempting logout
        if (auth.currentUser) {
          alert('Your session has expired due to inactivity. Please login again.');
          // Sign out
          auth.signOut();
          // Save current path before redirecting
          localStorage.setItem('lastPath', window.location.pathname);
          window.location.href = '/auth';
        }
      }, 30 * 60 * 1000);
    };
    
    // Start the timer
    resetInactivityTimer();
    
    // Reset timer on user activity
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    
    return () => {
      // Cleanup
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);
  
  return <>{children}</>;
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

// Simple function to initialize Supabase connections
const initSupabase = () => {
  console.log('Initializing Supabase connection...');
  // This is just a placeholder as initializeDatabase handles the actual initialization
  return Promise.resolve();
};

// Create a separate component for the app content
const AppContent = () => {
  const dispatch = useDispatch();
  const { user, loading } = useAuth();
  
  // Add route persistence
  useEffect(() => {
    // Save current path whenever it changes
    const savePath = () => {
      if (window.location.pathname !== '/auth') {
        localStorage.setItem('lastPath', window.location.pathname);
      }
    };
    
    // Add event listener for path changes
    window.addEventListener('beforeunload', savePath);
    
    return () => {
      window.removeEventListener('beforeunload', savePath);
    };
  }, []);

  // Initialize app 
  useEffect(() => {
    // Initialize Supabase
    initSupabase();
    
    // MathJax is now loaded via CDN in index.html
    // No need to initialize it here
    
    // Initialize database
    console.log('Initializing database on app startup...');
    initializeDatabase().catch(error => {
      console.error('Error during database initialization:', error);
    });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - get Supabase ID
        const supabaseUserId = localStorage.getItem(`supabase_uid_${firebaseUser.uid}`);
        
        // Update Redux state (keep this for backward compatibility)
        dispatch({
          type: 'auth/setUser',
          payload: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            supabaseUserId,
          },
        });

        // Initialize database if needed
        try {
          await initializeDatabase();
        } catch (error) {
          console.error('Failed to initialize database on auth state change:', error);
        }
      } else {
        // User is signed out
        dispatch({ type: 'auth/clearUser' });
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Force MathJax typesetting when App loads
  useEffect(() => {
    setTimeout(() => {
      if (window.MathJax && window.MathJax.typeset) {
        try {
          window.MathJax.typeset();
          console.log('Initial MathJax typesetting completed');
        } catch (e) {
          console.error('Error in initial MathJax typesetting:', e);
        }
      }
    }, 500);
  }, []);

  // Show loading spinner while auth state is being determined
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SecurityGuard>
      <Router>
        <Toaster position="top-center" toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#1E3A8A',
            },
          },
          error: {
            style: {
              background: '#991B1B',
            },
          },
        }} />
        <PrettyURL />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Auth page - redirect to home if already logged in */}
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/" replace /> : <AuthPage />} 
            />
            
            {/* Check for saved path on root */}
            <Route path="/" element={
              <ProtectedRoute>
                {(() => {
                  // Check if there's a saved path to restore
                  const lastPath = localStorage.getItem('lastPath');
                  if (lastPath && lastPath !== '/' && lastPath !== '/auth') {
                    // Clear the saved path to prevent infinite redirects
                    localStorage.removeItem('lastPath');
                    return <Navigate to={lastPath} replace />;
                  }
                  return <HomePage />;
                })()}
              </ProtectedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/subjects/:examType" element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/chapters/:examType/:subject" element={
              <ProtectedRoute>
                <ChaptersPage />
              </ProtectedRoute>
            } />
            
            <Route path="/topics/:examType/:subject/:chapterId" element={
              <ProtectedRoute>
                <TopicsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/questions/:examType/:subject/:chapterName" element={
              <ProtectedRoute>
                <QuestionsListPage />
              </ProtectedRoute>
            } />
            
            <Route path="/question/:examType/:subject/:chapterName/:questionId" element={
              <ProtectedRoute>
                <QuestionPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <ProgressAnalyticsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/bookmarks" element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            } />

            {/* Redirect any unknown routes to home if authenticated, or auth if not */}
            <Route path="*" element={
              user ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />
            } />
          </Routes>
        </Suspense>
      </Router>
    </SecurityGuard>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </AuthProvider>
  );
}

export default App;
