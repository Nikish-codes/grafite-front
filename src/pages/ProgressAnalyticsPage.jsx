import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import DashboardOverview from '../components/analytics/DashboardOverview';
import SubjectAnalysis from '../components/analytics/SubjectAnalysis';
import TimeAnalysis from '../components/analytics/TimeAnalysis';
import QuestionAnalysis from '../components/analytics/QuestionAnalysis';
import ProgressTracking from '../components/analytics/ProgressTracking';
import Layout from '../components/layout/Layout';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';

// Map exam types to display titles - only showing the 5 options from homepage
const examTypeToTitle = {
  'all': 'All Exams',
  'jee-mains-pyq': 'JEE Mains Top 500 PYQs',
  'jee-adv-pyq': 'JEE Advanced PYQs',
  'jee-adv-booster': 'JEE Advanced Rank Booster',
  'bitsat-prep': 'BITSAT Prep Guide',
  'wbjee': 'WBJEE Chapterwise'
};

const ProgressAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedExamType, setSelectedExamType] = useState('all');
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, selectedExamType]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get the Supabase user ID from the Firebase user
      const supabaseUserId = user.supabaseUserId;
      
      if (!supabaseUserId) {
        console.error('No Supabase user ID found for current user');
        setLoading(false);
        return;
      }
      
      console.log('Fetching analytics data for Supabase user ID:', supabaseUserId);
      
      // Build queries with explicit conditionals
      let analyticsQuery = supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', supabaseUserId);
        
      let performanceQuery = supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', supabaseUserId);
        
      let progressQuery = supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', supabaseUserId);
      
      // Apply exam type filter if not set to 'all'
      if (selectedExamType !== 'all') {
        analyticsQuery = analyticsQuery.eq('exam_type', selectedExamType);
        performanceQuery = performanceQuery.eq('exam_type', selectedExamType);
        progressQuery = progressQuery.eq('exam_type', selectedExamType);
      }
      
      // Add sorting for performance
      performanceQuery = performanceQuery.order('timestamp', { ascending: false });
      
      // Execute all queries in parallel
      const [analyticsResult, performanceResult, progressResult] = await Promise.all([
        analyticsQuery,
        performanceQuery,
        progressQuery
      ]);
      
      // Log any errors but continue with available data
      if (analyticsResult.error) console.error('Error fetching analytics:', analyticsResult.error);
      if (performanceResult.error) console.error('Error fetching performance:', performanceResult.error);
      if (progressResult.error) console.error('Error fetching progress:', progressResult.error);
      
      // Process the data for analytics
      const analyticsData = analyticsResult.data || [];
      const performanceData = performanceResult.data || [];
      const progressData = progressResult.data || [];
      
      console.log(`Fetched ${analyticsData.length} analytics records, ${performanceData.length} performance records, and ${progressData.length} progress records`);
      
      // Use the new data format for analytics or fall back to processed progress data
      const processedData = processEnhancedAnalyticsData(analyticsData, performanceData, progressData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  // New function to process data from the enhanced analytics tables
  const processEnhancedAnalyticsData = (analyticsData, performanceData, progressData) => {
    // If we have no data at all, return null
    if ((!analyticsData || analyticsData.length === 0) && 
        (!performanceData || performanceData.length === 0) && 
        (!progressData || progressData.length === 0)) {
      setAnalyticsData(null);
      return;
    }
    
    // Use performance data for summary if available
    const performanceSummary = performanceData.length > 0 ? performanceData[0] : null;
    
    // Initialize summary stats
    let summaryStats = {
      totalAttempts: 0,
      correctAnswers: 0,
      accuracyPercentage: 0,
      totalTimeSpent: 0,
      totalTimeInHours: 0
    };
    
    // Use performance table for summary if available
    if (performanceSummary) {
      summaryStats = {
        totalAttempts: performanceSummary.total_questions || 0,
        correctAnswers: performanceSummary.correct_answers || 0,
        accuracyPercentage: performanceSummary.average_accuracy || 0,
        totalTimeSpent: performanceSummary.total_time_spent || 0,
        totalTimeInHours: ((performanceSummary.total_time_spent || 0) / 3600).toFixed(2)
      };
    } 
    // Otherwise aggregate from analytics data
    else if (analyticsData.length > 0) {
      summaryStats = {
        totalAttempts: analyticsData.reduce((sum, item) => sum + (item.question_count || 0), 0),
        correctAnswers: analyticsData.reduce((sum, item) => sum + (item.correct_count || 0), 0),
        totalTimeSpent: analyticsData.reduce((sum, item) => sum + (item.time_spent || 0), 0)
      };
      
      summaryStats.accuracyPercentage = summaryStats.totalAttempts > 0 ? 
        (summaryStats.correctAnswers / summaryStats.totalAttempts * 100).toFixed(2) : 0;
      summaryStats.totalTimeInHours = (summaryStats.totalTimeSpent / 3600).toFixed(2);
    }
    // Last resort: use progress data if available
    else if (progressData.length > 0) {
      return processAnalyticsData(progressData);
    }
    
    // Group by subject
    const subjectGroups = {};
    analyticsData.forEach(item => {
      if (!item.subject) return;
      
      if (!subjectGroups[item.subject]) {
        subjectGroups[item.subject] = {
          total: 0,
          correct: 0,
          timeSpent: 0,
          chapters: {}
        };
      }
      
      subjectGroups[item.subject].total += (item.question_count || 0);
      subjectGroups[item.subject].correct += (item.correct_count || 0);
      subjectGroups[item.subject].timeSpent += (item.time_spent || 0);

      // Group by chapter within each subject
      if (item.chapter && !subjectGroups[item.subject].chapters[item.chapter]) {
        subjectGroups[item.subject].chapters[item.chapter] = {
          total: item.question_count || 0,
          correct: item.correct_count || 0,
          timeSpent: item.time_spent || 0
        };
      }
    });

    // Group by exam type
    const examGroups = {};
    analyticsData.forEach(item => {
      if (!item.exam_type) return;
      
      if (!examGroups[item.exam_type]) {
        examGroups[item.exam_type] = {
          total: 0,
          correct: 0,
          timeSpent: 0
        };
      }
      
      examGroups[item.exam_type].total += (item.question_count || 0);
      examGroups[item.exam_type].correct += (item.correct_count || 0);
      examGroups[item.exam_type].timeSpent += (item.time_spent || 0);
    });

    // For time-based data, we need to use progress data or fall back to a simpler approach
    const timeData = {};
    const timeSeriesData = [];
    
    // If we have detailed progress data, use it for time analysis
    if (progressData.length > 0) {
      progressData.forEach(item => {
        if (!item.created_at) return;
        
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!timeData[date]) {
          timeData[date] = {
            total: 0,
            correct: 0,
            timeSpent: 0
          };
        }
        
        timeData[date].total++;
        if (item.is_correct) timeData[date].correct++;
        timeData[date].timeSpent += (item.time_spent || 0);
      });
      
      // Create time series data
      Object.keys(timeData).forEach(date => {
        timeSeriesData.push({
          date,
          total: timeData[date].total,
          correct: timeData[date].correct,
          accuracy: timeData[date].total > 0 ? 
            (timeData[date].correct / timeData[date].total * 100).toFixed(2) : 0,
          timeSpent: timeData[date].timeSpent / 60 // Convert to minutes
        });
      });
      
      timeSeriesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    // Otherwise use analytics created_at dates for a simpler view
    else {
      analyticsData.forEach(item => {
        if (!item.created_at) return;
        
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!timeData[date]) {
          timeData[date] = {
            total: 0,
            correct: 0,
            timeSpent: 0
          };
        }
        
        timeData[date].total += (item.question_count || 0);
        timeData[date].correct += (item.correct_count || 0);
        timeData[date].timeSpent += (item.time_spent || 0);
      });
      
      // Create time series data from analytics timestamps
      Object.keys(timeData).forEach(date => {
        timeSeriesData.push({
          date,
          total: timeData[date].total,
          correct: timeData[date].correct,
          accuracy: timeData[date].total > 0 ? 
            (timeData[date].correct / timeData[date].total * 100).toFixed(2) : 0,
          timeSpent: timeData[date].timeSpent / 60 // Convert to minutes
        });
      });
      
      timeSeriesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // For backward compatibility: create a single rawData array that components can forEach on
    // Prioritize progress data if available as it has the most detailed records
    const combinedRawData = progressData.length > 0 ? 
      progressData : 
      (analyticsData.length > 0 ? 
        analyticsData.map(item => ({
          ...item,
          is_correct: item.correct_count > 0 // Map to expected format
        })) : 
        []);

    // Set the processed analytics data
    const enhancedData = {
      summary: summaryStats,
      subjectData: subjectGroups,
      examData: examGroups,
      timeData: timeData,
      timeSeriesData: timeSeriesData,
      // Keep raw data as an array for backward compatibility with components
      rawData: combinedRawData,
      // Store detailed data in a separate property
      detailedData: {
        analytics: analyticsData,
        performance: performanceData,
        progress: progressData
      }
    };
    
    setAnalyticsData(enhancedData);
  };

  // Original function as fallback for progress data
  const processAnalyticsData = (data) => {
    if (!data || data.length === 0) {
      setAnalyticsData(null);
      return;
    }

    // Calculate summary statistics
    const totalAttempts = data.length;
    const correctAnswers = data.filter(item => item.is_correct).length;
    const accuracyPercentage = totalAttempts > 0 ? (correctAnswers / totalAttempts * 100).toFixed(2) : 0;
    const totalTimeSpent = data.reduce((sum, item) => sum + (item.time_spent || 0), 0);
    const totalTimeInHours = (totalTimeSpent / 3600).toFixed(2);

    // Group by subject
    const subjectGroups = {};
    data.forEach(item => {
      if (!item.subject) return;
      
      if (!subjectGroups[item.subject]) {
        subjectGroups[item.subject] = {
          total: 0,
          correct: 0,
          timeSpent: 0,
          chapters: {}
        };
      }
      
      subjectGroups[item.subject].total++;
      if (item.is_correct) subjectGroups[item.subject].correct++;
      subjectGroups[item.subject].timeSpent += (item.time_spent || 0);

      // Group by chapter within each subject
      if (item.chapter && !subjectGroups[item.subject].chapters[item.chapter]) {
        subjectGroups[item.subject].chapters[item.chapter] = {
          total: 0,
          correct: 0,
          timeSpent: 0
        };
      }

      if (item.chapter) {
        subjectGroups[item.subject].chapters[item.chapter].total++;
        if (item.is_correct) {
          subjectGroups[item.subject].chapters[item.chapter].correct++;
        }
        subjectGroups[item.subject].chapters[item.chapter].timeSpent += (item.time_spent || 0);
      }
    });

    // Group by exam type
    const examGroups = {};
    data.forEach(item => {
      if (!item.exam_type) return;
      
      if (!examGroups[item.exam_type]) {
        examGroups[item.exam_type] = {
          total: 0,
          correct: 0,
          timeSpent: 0
        };
      }
      
      examGroups[item.exam_type].total++;
      if (item.is_correct) examGroups[item.exam_type].correct++;
      examGroups[item.exam_type].timeSpent += (item.time_spent || 0);
    });

    // Process time-based data (group by day)
    const timeData = {};
    data.forEach(item => {
      if (!item.created_at) return;
      
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!timeData[date]) {
        timeData[date] = {
          total: 0,
          correct: 0,
          timeSpent: 0
        };
      }
      
      timeData[date].total++;
      if (item.is_correct) timeData[date].correct++;
      timeData[date].timeSpent += (item.time_spent || 0);
    });

    // Create time series data for charts
    const timeSeriesData = Object.keys(timeData).map(date => ({
      date,
      total: timeData[date].total,
      correct: timeData[date].correct,
      accuracy: timeData[date].total > 0 ? (timeData[date].correct / timeData[date].total * 100).toFixed(2) : 0,
      timeSpent: timeData[date].timeSpent / 60 // Convert to minutes
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Set processed analytics data
    setAnalyticsData({
      summary: {
        totalAttempts,
        correctAnswers,
        accuracyPercentage,
        totalTimeSpent,
        totalTimeInHours
      },
      subjectData: subjectGroups,
      examData: examGroups,
      timeData: timeData,
      timeSeriesData: timeSeriesData,
      rawData: data
    });
    
    return {
      summary: {
        totalAttempts,
        correctAnswers,
        accuracyPercentage,
        totalTimeSpent,
        totalTimeInHours
      },
      subjectData: subjectGroups,
      examData: examGroups,
      timeData: timeData,
      timeSeriesData: timeSeriesData,
      rawData: data
    };
  };

  const renderTabContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Authentication Required</h3>
          <p className="text-gray-400">Please log in to view your analytics.</p>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!analyticsData) {
      return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">No Data Available</h3>
          <p className="text-gray-400">Start answering questions to see your analytics!</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <DashboardOverview data={analyticsData} />;
      case 'subjects':
        return <SubjectAnalysis data={analyticsData} />;
      case 'time':
        return <TimeAnalysis data={analyticsData} />;
      case 'questions':
        return <QuestionAnalysis data={analyticsData} />;
      case 'progress':
        return <ProgressTracking data={analyticsData} />;
      default:
        return <DashboardOverview data={analyticsData} />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">Progress Analytics</h1>
          <p className="text-gray-400 mb-4">
            Track your learning journey and identify areas for improvement.
          </p>
          
          {/* Exam Type Selector */}
          <div className="mb-6">
            <label htmlFor="examType" className="block text-sm font-medium text-gray-400 mb-2">
              Filter by Exam Type:
            </label>
            <select
              id="examType"
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {Object.entries(examTypeToTitle).map(([value, label]) => (
                <option key={value} value={value} className="bg-neutral-800 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-neutral-800 mb-6 overflow-x-auto">
            <nav className="flex flex-nowrap -mb-px space-x-4 md:space-x-8 pb-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap pb-4 px-1 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                Dashboard Overview
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`whitespace-nowrap pb-4 px-1 font-medium text-sm ${
                  activeTab === 'subjects'
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                Subject Analysis
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={`whitespace-nowrap pb-4 px-1 font-medium text-sm ${
                  activeTab === 'time'
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                Time Analysis
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`whitespace-nowrap pb-4 px-1 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                Question Analysis
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`whitespace-nowrap pb-4 px-1 font-medium text-sm ${
                  activeTab === 'progress'
                    ? 'border-b-2 border-primary text-primary'
                    : 'border-b-2 border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                }`}
              >
                Progress Tracking
              </button>
            </nav>
          </div>

          {/* Content */}
          <div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProgressAnalyticsPage;
