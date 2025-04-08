import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  fetchUserProgress,
  fetchOverallPerformance,
  fetchModuleAnalytics,
} from '../../store/slices/analyticsSlice';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { moduleId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { 
    userProgress, 
    overallPerformance, 
    moduleAnalytics,
    loading, 
    error 
  } = useSelector((state) => state.analytics);

  useEffect(() => {
    if (user?.uid) {
      // Fetch user progress and overall performance
      dispatch(fetchUserProgress(user.uid));
      dispatch(fetchOverallPerformance(user.uid));
      
      // If moduleId is provided, fetch module-specific analytics
      if (moduleId) {
        dispatch(fetchModuleAnalytics({ userId: user.uid, moduleId }));
      }
    }
  }, [dispatch, user, moduleId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Sign in to view your analytics</h2>
        <p className="text-gray-600">Track your progress and performance by signing in to your account.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Analytics Dashboard</h1>
      
      {/* Overall Performance Card - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Questions Attempted</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold">
              {overallPerformance?.questions_attempted || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Correct Answers</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {overallPerformance?.correct_answers || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              {overallPerformance?.questions_attempted ? 
                `${Math.round((overallPerformance.correct_answers / overallPerformance.questions_attempted) * 100)}% accuracy` : 
                '0% accuracy'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4 sm:col-span-2 md:col-span-1">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Study Streak</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {userProgress?.current_streak || 0} days
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Best: {userProgress?.best_streak || 0} days
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress by Subject - Mobile Responsive */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Progress by Subject</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {moduleId && moduleAnalytics[moduleId] ? (
          moduleAnalytics[moduleId].map((analytics) => (
            <Card key={analytics.chapter_id} className="p-3 sm:p-4">
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-base sm:text-lg">{analytics.chapter_name}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs sm:text-sm font-medium">Progress</span>
                    <span className="text-xs sm:text-sm font-medium">{analytics.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${analytics.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <div>Attempted: {analytics.questions_attempted}</div>
                  <div>Correct: {analytics.correct_answers}</div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            {moduleId ? 'No analytics data available for this subject yet.' : 'Select a subject to view detailed analytics.'}
          </div>
        )}
      </div>
      
      {/* Recent Activity - Mobile Responsive */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Activity</h2>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {userProgress?.recent_activities && userProgress.recent_activities.length > 0 ? (
              userProgress.recent_activities.map((activity, index) => (
                <div key={index} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <div>
                      <h3 className="font-medium text-sm sm:text-base">{activity.event_type}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {activity.event_data.module_name && activity.event_data.chapter_name && 
                          `${activity.event_data.module_name} > ${activity.event_data.chapter_name}`}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No recent activity to display.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;