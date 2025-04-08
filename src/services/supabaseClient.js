import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with security options
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Enhanced client creation with security options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    // Disable retries on network failures to prevent excessive requests
    retryOnNetworkFailure: false,
    // Limit number of retries on connection issues
    maxRetries: 3,
  },
  // Specify headers for better security
  headers: {
    'X-Client-Info': 'grafite-frontend',
    'X-Content-Type-Options': 'nosniff',
  },
});

// Check and initialize database tables if they don't exist
export const initializeDatabase = async () => {
  try {
    console.log('Checking database tables...');
    
    // First check if the user_progress table exists by trying to query it
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);
        
      if (!error) {
        console.log('user_progress table exists and is accessible');
        return true;
      }
    } catch (queryError) {
      console.log('Error querying user_progress table, will attempt to create it');
    }
    
    // If we get here, either the table doesn't exist or we don't have permission to access it
    console.log('Creating user_progress table...');
    
    try {
      const { error: createError } = await supabase.rpc('create_user_progress_table');
      
      if (createError) {
        console.error('Failed to create table via RPC:', createError);
        
        // Try a different approach - use a simpler query that might work with limited permissions
        const { error: createTableError } = await supabase
          .from('user_progress')
          .insert([
            {
              user_id: '00000000-0000-0000-0000-000000000000',
              question_id: 'test-question',
              exam_type: 'test',
              subject: 'test',
              chapter: 'test',
              is_correct: false,
              score: 0,
              time_spent: 0
            }
          ])
          .select();
          
        if (createTableError) {
          console.error('Failed to create or access user_progress table:', createTableError);
          
          // Log this error but don't throw - we'll continue without the table
          console.log('The application will continue but progress tracking may not work properly.');
          console.log('Please ensure the database is properly set up with the required tables.');
        } else {
          console.log('Successfully created or accessed user_progress table');
          
          // Clean up the test record
          await supabase
            .from('user_progress')
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000000')
            .eq('question_id', 'test-question');
        }
      } else {
        console.log('Successfully created user_progress table via RPC');
      }
    } catch (createError) {
      console.error('Error during table creation attempt:', createError);
      console.log('The application will continue but progress tracking may not work properly.');
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('The application will continue but progress tracking may not work properly.');
    return true; // Return true anyway to allow the app to continue
  }
};

/**
 * Record user progress for a question and update analytics
 * @param {Object} progressData - The progress data to record
 * @returns {Promise} - The result of the insert operation
 */
export const recordProgress = async (progressData) => {
  try {
    // Get the supabaseUserId from the current user
    const supabaseUserId = progressData.userId || localStorage.getItem(`supabase_uid_${progressData.firebaseUid}`);
    
    if (!supabaseUserId) {
      console.error('No Supabase user ID found for progress recording');
      throw new Error('Missing Supabase user ID for progress recording');
    }
    
    // Validate required fields to prevent SQL injection
    if (!supabaseUserId || !progressData.questionId || 
        !progressData.examType || !progressData.subject || 
        !progressData.chapter) {
      console.error('Missing required fields:', { 
        userId: supabaseUserId, 
        questionId: progressData.questionId,
        examType: progressData.examType,
        subject: progressData.subject,
        chapter: progressData.chapter
      });
      throw new Error('Missing required fields for progress recording');
    }
    
    console.log('Recording progress with data:', {
      user_id: supabaseUserId,
      question_id: progressData.questionId,
      exam_type: progressData.examType,
      // other fields omitted for brevity
    });
    
    // Data sanitization
    const sanitizedData = {
      user_id: supabaseUserId,
      question_id: String(progressData.questionId).trim(),
      exam_type: String(progressData.examType).trim(),
      subject: String(progressData.subject).trim(),
      chapter: String(progressData.chapter).trim(),
      is_correct: Boolean(progressData.isCorrect),
      score: Number(progressData.score) || 0,
      time_spent: Number(progressData.timeSpent) || 0,
      attempt_count: Number(progressData.attemptCount) || 1,
      last_attempted_at: new Date().toISOString()
    };
    
    // 1. First, try to insert progress data
    const { data: progressData1, error: progressError } = await supabase
      .from('user_progress')
      .upsert([sanitizedData], { 
        onConflict: 'user_id, question_id',
        ignoreDuplicates: false 
      });

    // 2. Update user_analytics table regardless of progress insert result
    try {
      // Check if we already have an analytics record for this user/subject/chapter
      const { data: existingAnalytics, error: analyticsError } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', supabaseUserId)
        .eq('exam_type', sanitizedData.exam_type)
        .eq('subject', sanitizedData.subject)
        .eq('chapter', sanitizedData.chapter)
        .maybeSingle();
      
      if (analyticsError && analyticsError.code !== '42P01') {
        console.error('Error checking analytics:', analyticsError);
      }
      
      // Prepare analytics data
      const analyticsData = {
        user_id: supabaseUserId,
        exam_type: sanitizedData.exam_type,
        subject: sanitizedData.subject,
        chapter: sanitizedData.chapter,
        updated_at: new Date().toISOString()
      };
      
      if (existingAnalytics) {
        // Update existing record
        analyticsData.question_count = (existingAnalytics.question_count || 0) + 1;
        analyticsData.correct_count = sanitizedData.is_correct ? 
          (existingAnalytics.correct_count || 0) + 1 : 
          (existingAnalytics.correct_count || 0);
        analyticsData.time_spent = (existingAnalytics.time_spent || 0) + sanitizedData.time_spent;
        
        const { error: updateError } = await supabase
          .from('user_analytics')
          .update(analyticsData)
          .eq('id', existingAnalytics.id);
        
        if (updateError) {
          console.error('Error updating analytics:', updateError);
        } else {
          console.log('Updated user analytics for:', {
            subject: sanitizedData.subject,
            chapter: sanitizedData.chapter
          });
        }
      } else {
        // Insert new record
        analyticsData.question_count = 1;
        analyticsData.correct_count = sanitizedData.is_correct ? 1 : 0;
        analyticsData.time_spent = sanitizedData.time_spent;
        analyticsData.created_at = new Date().toISOString();
        
        const { error: insertError } = await supabase
          .from('user_analytics')
          .insert([analyticsData]);
        
        if (insertError) {
          console.error('Error inserting analytics:', insertError);
        } else {
          console.log('Created new user analytics for:', {
            subject: sanitizedData.subject,
            chapter: sanitizedData.chapter
          });
        }
      }
      
      // 3. Update user_performance table
      try {
        // Get current performance data
        const { data: performanceData, error: perfError } = await supabase
          .from('user_performance')
          .select('*')
          .eq('user_id', supabaseUserId)
          .eq('exam_type', sanitizedData.exam_type)
          .maybeSingle();
          
        if (perfError && perfError.code !== '42P01') {
          console.error('Error checking performance:', perfError);
        }
        
        // Prepare performance data
        const newPerformance = {
          user_id: supabaseUserId,
          exam_type: sanitizedData.exam_type,
          timestamp: new Date().toISOString()
        };
        
        if (performanceData) {
          // Update existing record
          newPerformance.total_questions = (performanceData.total_questions || 0) + 1;
          newPerformance.correct_answers = sanitizedData.is_correct ? 
            (performanceData.correct_answers || 0) + 1 : 
            (performanceData.correct_answers || 0);
          newPerformance.total_time_spent = (performanceData.total_time_spent || 0) + sanitizedData.time_spent;
          
          // Recalculate accuracy
          newPerformance.average_accuracy = 
            newPerformance.total_questions > 0 ? 
            (newPerformance.correct_answers / newPerformance.total_questions * 100) : 0;
          
          const { error: updatePerfError } = await supabase
            .from('user_performance')
            .update(newPerformance)
            .eq('id', performanceData.id);
          
          if (updatePerfError) {
            console.error('Error updating performance:', updatePerfError);
          } else {
            console.log('Updated user performance for:', sanitizedData.exam_type);
          }
        } else {
          // Insert new record
          newPerformance.total_questions = 1;
          newPerformance.correct_answers = sanitizedData.is_correct ? 1 : 0;
          newPerformance.total_time_spent = sanitizedData.time_spent;
          newPerformance.average_accuracy = sanitizedData.is_correct ? 100 : 0;
          
          const { error: insertPerfError } = await supabase
            .from('user_performance')
            .insert([newPerformance]);
          
          if (insertPerfError) {
            console.error('Error inserting performance:', insertPerfError);
      } else {
            console.log('Created new user performance for:', sanitizedData.exam_type);
          }
        }
      } catch (perfExcept) {
        console.error('Exception updating performance:', perfExcept);
      }
      
    } catch (analyticsExcept) {
      console.error('Exception updating analytics:', analyticsExcept);
    }
    
    // Handle progress insert errors
    if (progressError) {
      console.error('Error in initial progress recording:', progressError);
      
      if (progressError.code === '23503' && progressError.message.includes('user_progress_user_id_fkey')) {
        throw new Error('User ID not found in Supabase. The foreign key constraint is preventing updates.');
      }
      
      return null;
    }
    
    console.log('Progress recorded successfully');
    return progressData1;
  } catch (error) {
    console.error('Error recording progress:', error);
    // Return a user-friendly error for the UI
    throw new Error('Unable to save your progress. Please try again later.');
  }
};

/**
 * Get user progress for a specific exam type, subject, and chapter
 * @param {string} userId - The user ID (Supabase ID)
 * @param {string} examType - The exam type
 * @param {string} subject - The subject
 * @param {string} chapter - The chapter (optional)
 * @returns {Promise} - The result of the query
 */
export const getUserProgress = async (userId, examType, subject, chapter = null) => {
  try {
    // Validate inputs
    if (!userId) {
      console.error('Missing userId in getUserProgress');
      throw new Error('Missing required parameters');
    }
    
    if (!examType || !subject) {
      console.error('Missing examType or subject in getUserProgress');
      throw new Error('Missing required parameters');
    }
    
    console.log('Getting user progress for:', { userId, examType, subject, chapter });
    
    // Build query with proper sanitization
    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', String(userId).trim())
      .eq('exam_type', String(examType).trim())
      .eq('subject', String(subject).trim());
    
    if (chapter) {
      query = query.eq('chapter', String(chapter).trim());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error in getUserProgress query:', error);
      
      // If error is about missing table, try to create it
      if (error.code === '42P01' || error.message?.includes('relation "public.user_progress" does not exist')) {
        console.log('Table might not exist, initializing...');
        await initializeDatabase();
        // Retry the operation
        return await getUserProgress(userId, examType, subject, chapter);
      } else if (error.code === '42501') {
        console.error('RLS policy violation in getUserProgress');
        return []; // Return empty array on RLS errors
      } else {
        throw error;
      }
    }
    
    console.log(`Got ${data?.length || 0} progress records`);
    return data || [];
  } catch (error) {
    console.error('Error getting user progress:', error);
    return []; // Return empty array instead of throwing to prevent UI breaks
  }
};

/**
 * Get user progress summary by exam type
 * @param {string} userId - The user ID (Supabase ID)
 * @returns {Promise} - The result of the query
 */
export const getUserProgressSummary = async (userId) => {
  try {
    if (!userId) {
      console.error('Missing userId in getUserProgressSummary');
      throw new Error('User ID is required');
    }
    
    console.log('Getting progress summary for user:', userId);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        exam_type,
        subject,
        chapter,
        is_correct,
        score
      `)
      .eq('user_id', String(userId).trim());
    
    if (error) {
      console.error('Error in getUserProgressSummary query:', error);
      
      // If error is about missing table, try to create it
      if (error.code === '42P01' || error.message?.includes('relation "public.user_progress" does not exist')) {
        console.log('Table might not exist, initializing...');
        await initializeDatabase();
        // Retry the operation
        return await getUserProgressSummary(userId);
      } else if (error.code === '42501') {
        console.error('RLS policy violation in getUserProgressSummary');
        return {}; // Return empty object on RLS errors
      } else {
        throw error;
      }
    }
    
    // Process data to create a summary with additional validation
    const summary = {};
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (!item.exam_type || !item.subject || !item.chapter) return;
        
        if (!summary[item.exam_type]) {
          summary[item.exam_type] = {
            total: 0,
            correct: 0,
            subjects: {}
          };
        }
        
        if (!summary[item.exam_type].subjects[item.subject]) {
          summary[item.exam_type].subjects[item.subject] = {
            total: 0,
            correct: 0,
            chapters: {}
          };
        }
        
        if (!summary[item.exam_type].subjects[item.subject].chapters[item.chapter]) {
          summary[item.exam_type].subjects[item.subject].chapters[item.chapter] = {
            total: 0,
            correct: 0
          };
        }
        
        // Update counts
        summary[item.exam_type].total++;
        summary[item.exam_type].subjects[item.subject].total++;
        summary[item.exam_type].subjects[item.subject].chapters[item.chapter].total++;
        
        if (item.is_correct) {
          summary[item.exam_type].correct++;
          summary[item.exam_type].subjects[item.subject].correct++;
          summary[item.exam_type].subjects[item.subject].chapters[item.chapter].correct++;
        }
      });
    }
    
    console.log(`Processed ${data?.length || 0} records for progress summary`);
    return summary;
  } catch (error) {
    console.error('Error getting user progress summary:', error);
    return {}; // Return empty object to prevent UI breaks
  }
};

/**
 * Get user recent activity
 * @param {string} userId - The user ID (Supabase ID)
 * @param {number} limit - The number of records to return
 * @returns {Promise} - The result of the query
 */
export const getUserRecentActivity = async (userId, limit = 10) => {
  try {
    if (!userId) {
      console.error('Missing userId in getUserRecentActivity');
      throw new Error('User ID is required');
    }
    
    console.log('Getting recent activity for user:', userId);
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', String(userId).trim())
      .order('last_attempted_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error in getUserRecentActivity query:', error);
      
      // If error is about missing table, try to create it
      if (error.code === '42P01' || error.message?.includes('relation "public.user_progress" does not exist')) {
        console.log('Table might not exist, initializing...');
        await initializeDatabase();
        // Retry the operation
        return await getUserRecentActivity(userId, limit);
      } else if (error.code === '42501') {
        console.error('RLS policy violation in getUserRecentActivity');
        return []; // Return empty array on RLS errors
      } else {
        throw error;
      }
    }
    
    console.log(`Got ${data?.length || 0} recent activity records`);
    return data || [];
  } catch (error) {
    console.error('Error getting user recent activity:', error);
    return []; // Return empty array to prevent UI breaks
  }
};
