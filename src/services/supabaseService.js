/**
 * Supabase service for analytics and user progress tracking
 */
import { createClient } from '@supabase/supabase-js';
import { getCurrentSupabaseId } from './identityService';
import { auth } from './firebaseConfig';

// Supabase configuration
// Using the Grafite Supabase project configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://fbjtujkjilikefcmvtqt.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZianR1amtqaWxpa2VmY212dHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDA3NTksImV4cCI6MjA1OTQxNjc1OX0.Ynuf62lg6BulCC9blE4n4Ap4POazyuF5Pqr3A_bXAh8';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Initialize the database by creating necessary tables if they don't exist
 * This function creates the required tables for user data storage
 */
export const initializeDatabase = async () => {
  try {
    console.log('Creating database tables directly...');
    
    // Create user_activities table
    const { error: createActivitiesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_activities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          event_type TEXT NOT NULL,
          event_data JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activities_event_type ON user_activities(event_type);
        CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp);
      `
    });
    
    if (createActivitiesError) {
      console.error('Error creating user_activities table:', createActivitiesError);
      
      // Fallback: try creating the table directly
      console.log('Attempting direct table creation...');
      await supabase.from('user_activities').insert({
        user_id: crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000001',
        event_type: 'table_init',
        event_data: { message: 'Initializing table' },
        timestamp: new Date().toISOString()
      }).select();
    } else {
      console.log('user_activities table created successfully');
    }
    
    // Create user_progress table
    const { error: createProgressError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_progress (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          question_id TEXT,
          module_id TEXT,
          chapter_id TEXT,
          subject TEXT,
          chapter TEXT,
          exam_type TEXT,
          is_correct BOOLEAN,
          time_spent INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
        CREATE INDEX IF NOT EXISTS idx_user_progress_chapter_id ON user_progress(chapter_id);
      `
    });
    
    if (createProgressError) {
      console.error('Error creating user_progress table:', createProgressError);
      
      // Fallback: try creating the table directly
      await supabase.from('user_progress').insert({
        user_id: crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000001',
        question_id: 'init',
        module_id: 'init',
        chapter_id: 'init',
        subject: 'init',
        chapter: 'init',
        exam_type: 'init',
        is_correct: false,
        time_spent: 0
      }).select();
    } else {
      console.log('user_progress table created successfully');
    }
    
    // Create user_analytics table
    const { error: createAnalyticsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_analytics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          module_id TEXT,
          chapter_id TEXT,
          question_count INTEGER DEFAULT 0,
          correct_count INTEGER DEFAULT 0,
          time_spent INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_analytics_module_id ON user_analytics(module_id);
        CREATE INDEX IF NOT EXISTS idx_user_analytics_chapter_id ON user_analytics(chapter_id);
      `
    });
    
    if (createAnalyticsError) {
      console.error('Error creating user_analytics table:', createAnalyticsError);
      
      // Fallback: try creating the table directly
      await supabase.from('user_analytics').insert({
        user_id: crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000001',
        module_id: 'init',
        chapter_id: 'init',
        question_count: 0,
        correct_count: 0,
        time_spent: 0
      }).select();
    } else {
      console.log('user_analytics table created successfully');
    }
    
    // Create user_performance table
    const { error: createPerformanceError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_performance (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          total_questions INTEGER DEFAULT 0,
          correct_answers INTEGER DEFAULT 0,
          total_time_spent INTEGER DEFAULT 0,
          average_accuracy REAL DEFAULT 0,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_user_performance_user_id ON user_performance(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_performance_timestamp ON user_performance(timestamp);
      `
    });
    
    if (createPerformanceError) {
      console.error('Error creating user_performance table:', createPerformanceError);
      
      // Fallback: try creating the table directly
      await supabase.from('user_performance').insert({
        user_id: crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000001',
        total_questions: 0,
        correct_answers: 0,
        total_time_spent: 0,
        average_accuracy: 0
      }).select();
    } else {
      console.log('user_performance table created successfully');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  }
};

/**
 * Get the current Supabase user ID for data operations
 * @returns {string|null} Supabase user ID or null if not authenticated
 */
const getCurrentSupabaseUserId = () => {
  return getCurrentSupabaseId();
};

/**
 * Track a user's activity
 * @param {string} eventType - Type of event (e.g., 'question_viewed', 'question_answered')
 * @param {Object} eventData - Data associated with the event
 * @returns {Promise} - Promise with insert result
 */
export const trackUserActivity = async (eventType, eventData) => {
  try {
    const userId = getCurrentSupabaseUserId();
    if (!userId) {
      console.warn('No Supabase user ID found for tracking');
      return null;
    }
    
    console.log('Tracking user activity:', { userId, eventType, eventData });
    
    // First check if the table exists
    const { error: checkError } = await supabase
      .from('user_activities')
      .select('id')
      .limit(1);
      
    if (checkError && checkError.code === '42P01') {
      console.warn('Table user_activities does not exist');
      return null;
    }
    
    // Insert with auth context using the auth client
    const { data, error } = await supabase.auth.getSession().then(async (session) => {
      if (!session.data.session) {
        console.warn('No active session found for RLS');
        
        // Try inserting without auth context as fallback
        return await supabase
          .from('user_activities')
          .insert([
            {
              user_id: userId,
              event_type: eventType,
              event_data: eventData,
              timestamp: new Date().toISOString(),
            },
          ]);
      }
      
      // With auth context - this respects RLS policies
      return await supabase
        .from('user_activities')
        .insert([
          {
            user_id: userId,
            event_type: eventType,
            event_data: eventData,
            timestamp: new Date().toISOString(),
          },
        ]);
    });

    // Handle errors
    if (error) {
      console.error('Error tracking user activity:', error);
      
      // If it's an RLS error, log more details
      if (error.code === '42501') {
        console.error('RLS policy violation. Make sure you have the proper INSERT policy and are using the correct user_id');
      }
      
      return null;
    }
    
    console.log('Successfully tracked user activity');
    return data;
  } catch (error) {
    console.error('Exception tracking user activity:', error);
    return null;
  }
};

/**
 * Get a user's progress
 * @returns {Promise} - Promise with user progress data
 */
export const getUserProgress = async () => {
  try {
    const userId = getCurrentSupabaseUserId();
    if (!userId) {
      console.warn('No Supabase user ID found for getting progress');
      return [];
    }
    
    console.log('Getting progress for user ID:', userId);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching progress data:', error);
      
      // If it's an RLS error, log more details
      if (error.code === '42501') {
        console.error('RLS policy violation in getUserProgress');
      }
      
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception getting user progress:', error);
    return [];
  }
};

/**
 * Update a user's progress
 * @param {Object} progressData - Progress data to update
 * @returns {Promise} - Promise with update result
 */
export const updateUserProgress = async (progressData) => {
  try {
    const userId = getCurrentSupabaseUserId();
    if (!userId) {
      console.warn('No Supabase user ID found for updating progress');
      return null;
    }
    
    console.log('Updating progress for user ID:', userId);
    
    const sanitizedData = {
      user_id: userId,
      ...progressData,
      updated_at: new Date().toISOString(),
    };
    
    console.log('Updating with data:', sanitizedData);
    
    const { data, error } = await supabase
      .from('user_progress')
      .upsert([sanitizedData]);

    if (error) {
      console.error('Error updating progress data:', error);
      
      // If it's an RLS error, log more details
      if (error.code === '42501') {
        console.error('RLS policy violation in updateUserProgress');
      }
      
      return null;
    }
    
    console.log('Progress updated successfully');
    return data;
  } catch (error) {
    console.error('Exception updating user progress:', error);
    return null;
  }
};

/**
 * Get analytics for a specific module
 * @param {string} moduleId - Module ID
 * @returns {Promise} - Promise with module analytics data
 */
export const getModuleAnalytics = async (moduleId) => {
  try {
    const userId = getCurrentSupabaseUserId();
    if (!userId) {
      console.warn('No Supabase user ID found for getting module analytics');
      return [];
    }
    
    console.log('Getting module analytics for user ID:', userId, 'module:', moduleId);
    
    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    if (error) {
      console.error('Error fetching module analytics:', error);
      
      // If it's an RLS error, log more details
      if (error.code === '42501') {
        console.error('RLS policy violation in getModuleAnalytics');
      }
      
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception getting module analytics:', error);
    return [];
  }
};

/**
 * Get analytics for a specific chapter
 * @param {string} chapterId - Chapter ID
 * @returns {Promise} - Promise with chapter analytics data
 */
export const getChapterAnalytics = async (chapterId) => {
  try {
    const userId = getCurrentSupabaseUserId();
    if (!userId) {
      console.warn('No Supabase user ID found for getting chapter analytics');
      return [];
    }
    
    console.log('Getting chapter analytics for user ID:', userId, 'chapter:', chapterId);
    
    const { data, error } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Error fetching chapter analytics:', error);
      
      // If it's an RLS error, log more details
      if (error.code === '42501') {
        console.error('RLS policy violation in getChapterAnalytics');
      }
      
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception getting chapter analytics:', error);
    return [];
  }
};

/**
 * Get overall user performance analytics
 * @returns {Promise} - Promise with overall performance data
 */
export const getOverallPerformance = async () => {
  try {
    const userId = getCurrentSupabaseUserId();
    if (!userId) {
      console.warn('No Supabase user ID found for getting performance data');
      return null;
    }
    
    console.log('Getting overall performance for user ID:', userId);
    
    const { data, error } = await supabase
      .from('user_performance')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching performance data:', error);
      
      // If it's an RLS error, log more details
      if (error.code === '42501') {
        console.error('RLS policy violation in getOverallPerformance');
      }
      
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Exception getting overall performance:', error);
    return null;
  }
};

export { supabase };