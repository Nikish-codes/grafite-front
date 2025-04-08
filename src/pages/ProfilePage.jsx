import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { progressSummary, recentActivity, loading: progressLoading } = useProgress();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Please Login</h1>
            <p className="text-gray-400 mb-6">You need to be logged in to view your profile</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/80 text-white"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate overall stats
  const calculateOverallStats = () => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let examTypes = 0;
    
    if (progressSummary) {
      examTypes = Object.keys(progressSummary).length;
      
      Object.values(progressSummary).forEach(exam => {
        totalQuestions += exam.total || 0;
        totalCorrect += exam.correct || 0;
      });
    }
    
    return {
      totalQuestions,
      totalCorrect,
      accuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      examTypes
    };
  };
  
  const stats = calculateOverallStats();
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-3xl text-primary font-bold">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{user.email}</h1>
              <p className="text-gray-400 mb-4">Member since {user.created_at ? formatDate(user.created_at) : 'recently'}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-neutral-800 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{stats.totalQuestions}</p>
                  <p className="text-sm text-gray-400">Questions Attempted</p>
                </div>
                <div className="bg-neutral-800 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.totalCorrect}</p>
                  <p className="text-sm text-gray-400">Correct Answers</p>
                </div>
                <div className="bg-neutral-800 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">{stats.accuracy.toFixed(1)}%</p>
                  <p className="text-sm text-gray-400">Accuracy</p>
                </div>
                <div className="bg-neutral-800 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.examTypes}</p>
                  <p className="text-sm text-gray-400">Exam Types</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="bg-neutral-800 border-neutral-700 text-gray-300 hover:bg-neutral-700"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={logout}
                  variant="outline"
                  className="bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Tabs */}
        <div className="flex border-b border-neutral-800 mb-6">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'progress' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'activity' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('activity')}
          >
            Recent Activity
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your Learning Overview</h2>
            
            {progressLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading your data...</p>
              </div>
            ) : Object.keys(progressSummary).length === 0 ? (
              <Card className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg text-center">
                <p className="text-gray-400 mb-4">You haven't attempted any questions yet.</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  Start Learning
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(progressSummary).map(([examType, data]) => (
                  <Card key={examType} className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">{examType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm text-gray-400">
                          {data.correct}/{data.total} ({data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${data.total > 0 ? (data.correct / data.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(data.subjects).map(([subject, subjectData]) => (
                        <div key={subject} className="bg-neutral-800 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-white">{subject}</span>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              {subjectData.correct}/{subjectData.total}
                            </Badge>
                          </div>
                          <div className="w-full bg-neutral-700 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ width: `${subjectData.total > 0 ? (subjectData.correct / subjectData.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => navigate(`/subjects/${examType}`)}
                      variant="outline"
                      className="mt-4 w-full bg-neutral-800 border-neutral-700 text-gray-300 hover:bg-neutral-700"
                    >
                      Continue Learning
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'progress' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Detailed Progress</h2>
            
            {progressLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading your data...</p>
              </div>
            ) : Object.keys(progressSummary).length === 0 ? (
              <Card className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg text-center">
                <p className="text-gray-400 mb-4">You haven't attempted any questions yet.</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  Start Learning
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(progressSummary).map(([examType, data]) => (
                  <Card key={examType} className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">{examType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    
                    <div className="space-y-6">
                      {Object.entries(data.subjects).map(([subject, subjectData]) => (
                        <div key={subject}>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-white">{subject}</h4>
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              {subjectData.correct}/{subjectData.total} ({subjectData.total > 0 ? ((subjectData.correct / subjectData.total) * 100).toFixed(1) : 0}%)
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 sm:pl-4 border-l border-neutral-800">
                            {Object.entries(subjectData.chapters).map(([chapter, chapterData]) => (
                              <div key={chapter} className="bg-neutral-800 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-gray-300">{chapter}</span>
                                  <Badge variant="outline" className="bg-neutral-700 text-gray-300 text-xs">
                                    {chapterData.correct}/{chapterData.total}
                                  </Badge>
                                </div>
                                <div className="w-full bg-neutral-700 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full" 
                                    style={{ width: `${chapterData.total > 0 ? (chapterData.correct / chapterData.total) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <Button 
                                  onClick={() => navigate(`/questions/${examType}/${subject}/${chapter}`)}
                                  variant="ghost"
                                  className="mt-2 w-full text-xs text-gray-400 hover:text-white hover:bg-neutral-700"
                                >
                                  Continue
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            
            {progressLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading your data...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <Card className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg text-center">
                <p className="text-gray-400 mb-4">You don't have any recent activity.</p>
                <Button 
                  onClick={() => navigate('/')}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  Start Learning
                </Button>
              </Card>
            ) : (
              <Card className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div className="grid gap-4 grid-cols-1">
                  {recentActivity.map((activity, index) => (
                    <div 
                      key={index} 
                      className={`p-4 border-l-4 ${activity.is_correct ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'} rounded-r-lg overflow-hidden`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0">
                        <div>
                          <h4 className="font-medium text-white">
                            Question {activity.question_id}
                          </h4>
                          <p className="text-sm text-gray-400 break-words">
                            {activity.exam_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {activity.subject} • {activity.chapter}
                          </p>
                        </div>
                        <Badge variant={activity.is_correct ? 'success' : 'destructive'} className={`${activity.is_correct ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'} whitespace-nowrap`}>
                          {activity.is_correct ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-400 gap-1 sm:gap-0">
                        <span>Time spent: {Math.floor(activity.time_spent / 60)}:{(activity.time_spent % 60).toString().padStart(2, '0')}</span>
                        <span className="break-words">{formatDate(activity.last_attempted_at)}</span>
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 mt-2">
                        <Button 
                          onClick={() => navigate(`/question/${activity.exam_type}/${activity.subject}/${activity.chapter}/${activity.question_id}`)}
                          variant="ghost"
                          className="text-xs text-gray-400 hover:text-white hover:bg-neutral-700 flex-1"
                        >
                          View Question
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
