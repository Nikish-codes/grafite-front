import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProgress, fetchModuleAnalytics } from '../../store/slices/analyticsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const ProgressTracker = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { userProgress, moduleAnalytics, loading } = useSelector((state) => state.analytics);
  const { modules } = useSelector((state) => state.modules);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchUserProgress(user.uid));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user?.uid && selectedModule) {
      dispatch(fetchModuleAnalytics({ userId: user.uid, moduleId: selectedModule }));
    }
  }, [dispatch, user, selectedModule]);

  const handleModuleSelect = (moduleId) => {
    setSelectedModule(moduleId);
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">Sign in to track your progress</h2>
        <p className="text-gray-600">Monitor your learning journey by signing in to your account.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Learning Progress</h1>
      
      {/* Overall Progress Summary - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-3 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Total Progress</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold">
              {userProgress?.overall_completion || 0}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${userProgress?.overall_completion || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Questions Completed</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold">
              {userProgress?.total_questions_completed || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              out of {userProgress?.total_questions || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Study Time</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="text-2xl sm:text-3xl font-bold">
              {userProgress?.total_study_hours || 0}h
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Last 7 days: {userProgress?.weekly_study_hours || 0}h
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-base sm:text-lg">Weak Areas</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            {userProgress?.weak_areas && userProgress.weak_areas.length > 0 ? (
              <ul className="text-xs sm:text-sm space-y-1">
                {userProgress.weak_areas.slice(0, 3).map((area, index) => (
                  <li key={index} className="text-red-600">{area}</li>
                ))}
              </ul>
            ) : (
              <div className="text-xs sm:text-sm text-gray-500">No weak areas identified yet</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Subject Selection - Mobile Responsive */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Subject Progress</h2>
        <div className="flex flex-nowrap overflow-x-auto pb-2 sm:flex-wrap gap-2 mb-4 sm:mb-6">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleModuleSelect(module.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                selectedModule === module.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              {module.title}
            </button>
          ))}
        </div>
        
        {/* Chapter Progress - Mobile Responsive */}
        {loading ? (
          <div className="flex justify-center items-center h-40 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : selectedModule && moduleAnalytics[selectedModule] ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {moduleAnalytics[selectedModule].map((chapterAnalytics) => (
              <Card key={chapterAnalytics.chapter_id} className="p-3 sm:p-4">
                <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-base sm:text-lg">{chapterAnalytics.chapter_name}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs sm:text-sm font-medium">Completion</span>
                      <span className="text-xs sm:text-sm font-medium">{chapterAnalytics.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${chapterAnalytics.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <div className="text-gray-500">Attempted</div>
                      <div className="font-medium">{chapterAnalytics.questions_attempted}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Correct</div>
                      <div className="font-medium text-green-600">{chapterAnalytics.correct_answers}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Accuracy</div>
                      <div className="font-medium">
                        {chapterAnalytics.questions_attempted ? 
                          `${Math.round((chapterAnalytics.correct_answers / chapterAnalytics.questions_attempted) * 100)}%` : 
                          '0%'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Avg. Time</div>
                      <div className="font-medium">{chapterAnalytics.avg_time_per_question || 0}s</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            {selectedModule ? 'No progress data available for this subject yet.' : 'Select a subject to view detailed progress.'}
          </div>
        )}
      </div>
      
      {/* Recommendations - Mobile Responsive */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Personalized Recommendations</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            {userProgress?.recommendations && userProgress.recommendations.length > 0 ? (
              <ul className="space-y-2 sm:space-y-3">
                {userProgress.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm font-medium">{recommendation.title}</p>
                      <p className="text-xs text-gray-500">{recommendation.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm">
                Complete more questions to receive personalized recommendations.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressTracker;