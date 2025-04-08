import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { useMediaQuery } from 'react-responsive';

const ProgressTracking = ({ data }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const { timeSeriesData, subjectData } = data;
  const [goalType, setGoalType] = useState('accuracy');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Filter time series data for selected subject
  const getFilteredTimeData = () => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];
    
    // Process raw data to get time series data for selected subject
    const subjectTimeData = {};
    
    if (selectedSubject === 'all' || !data.rawData) {
      return timeSeriesData;
    }
    
    // Group by date for the selected subject
    data.rawData.forEach(item => {
      if (item.subject === selectedSubject) {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        
        if (!subjectTimeData[date]) {
          subjectTimeData[date] = {
            date,
            total: 0,
            correct: 0,
            timeSpent: 0
          };
        }
        
        subjectTimeData[date].total++;
        if (item.is_correct) {
          subjectTimeData[date].correct++;
        }
        subjectTimeData[date].timeSpent += item.time_spent;
      }
    });
    
    // Calculate accuracy and convert to array
    return Object.values(subjectTimeData).map(item => ({
      ...item,
      accuracy: item.total > 0 ? (item.correct / item.total * 100).toFixed(2) : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const filteredTimeData = getFilteredTimeData();

  // Set goals based on current performance
  const getGoals = () => {
    if (!data.summary) return { accuracy: 0, questions: 0, time: 0 };
    
    const { accuracyPercentage, totalAttempts, totalTimeInHours } = data.summary;
    
    return {
      accuracy: Math.min(100, Math.ceil(parseFloat(accuracyPercentage) * 1.1)),
      questions: Math.ceil(totalAttempts * 1.2),
      time: Math.ceil(parseFloat(totalTimeInHours) * 1.2)
    };
  };

  const goals = getGoals();

  // Calculate progress towards goals
  const calculateProgress = () => {
    if (!data.summary) return { accuracy: 0, questions: 0, time: 0 };
    
    const { accuracyPercentage, totalAttempts, totalTimeInHours } = data.summary;
    
    return {
      accuracy: goals.accuracy > 0 ? (parseFloat(accuracyPercentage) / goals.accuracy * 100).toFixed(0) : 0,
      questions: goals.questions > 0 ? (totalAttempts / goals.questions * 100).toFixed(0) : 0,
      time: goals.time > 0 ? (parseFloat(totalTimeInHours) / goals.time * 100).toFixed(0) : 0
    };
  };

  const progress = calculateProgress();

  // Prepare radar data for improvement areas
  const prepareImprovementRadarData = () => {
    if (!subjectData || Object.keys(subjectData).length === 0) return [];
    
    return Object.keys(subjectData).map(subject => {
      const subjectInfo = subjectData[subject];
      const accuracy = subjectInfo.total > 0 
        ? (subjectInfo.correct / subjectInfo.total * 100).toFixed(2) 
        : 0;
      
      // Inverted accuracy (lower accuracy = more room for improvement)
      const improvementNeeded = 100 - parseFloat(accuracy);
      
      return {
        subject,
        improvement: improvementNeeded
      };
    });
  };

  const improvementData = prepareImprovementRadarData();

  // Get milestone data
  const getMilestones = () => {
    const milestones = [
      { name: 'First Question', threshold: 1, achieved: data.summary?.totalAttempts >= 1 },
      { name: '10 Questions', threshold: 10, achieved: data.summary?.totalAttempts >= 10 },
      { name: '50 Questions', threshold: 50, achieved: data.summary?.totalAttempts >= 50 },
      { name: '100 Questions', threshold: 100, achieved: data.summary?.totalAttempts >= 100 },
      { name: '50% Accuracy', threshold: 50, achieved: parseFloat(data.summary?.accuracyPercentage) >= 50 },
      { name: '70% Accuracy', threshold: 70, achieved: parseFloat(data.summary?.accuracyPercentage) >= 70 },
      { name: '90% Accuracy', threshold: 90, achieved: parseFloat(data.summary?.accuracyPercentage) >= 90 },
      { name: '1 Hour Study', threshold: 1, achieved: parseFloat(data.summary?.totalTimeInHours) >= 1 },
      { name: '5 Hours Study', threshold: 5, achieved: parseFloat(data.summary?.totalTimeInHours) >= 5 },
      { name: '10 Hours Study', threshold: 10, achieved: parseFloat(data.summary?.totalTimeInHours) >= 10 }
    ];

    // If we have subject data, add subject-specific milestones
    if (subjectData) {
      Object.keys(subjectData).forEach(subject => {
        const questionsCount = subjectData[subject].total;
        if (questionsCount >= 10) {
          milestones.push({ 
            name: `10 ${subject} Questions`, 
            threshold: 10, 
            achieved: true,
            category: 'Subject'
          });
        }
        
        const accuracy = subjectData[subject].total > 0 
          ? (subjectData[subject].correct / subjectData[subject].total * 100) 
          : 0;
        
        if (accuracy >= 80 && subjectData[subject].total >= 5) {
          milestones.push({ 
            name: `80% in ${subject}`, 
            threshold: 80, 
            achieved: true,
            category: 'Subject'
          });
        }
      });
    }

    return milestones;
  };

  const milestones = getMilestones();
  const achievedMilestones = milestones.filter(m => m.achieved).length;
  const milestonesPercentage = (achievedMilestones / milestones.length * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Progress Tracking</h2>
      
      {/* Subject Selector */}
      <div className="mb-4">
        <label htmlFor="subject-select" className="block text-sm font-medium text-gray-300 mb-1">
          Filter by Subject
        </label>
        <select
          id="subject-select"
          className="block w-64 p-2 bg-neutral-800 border border-neutral-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="all">All Subjects</option>
          {subjectData && Object.keys(subjectData).map((subject) => (
            <option key={subject} value={subject} className="bg-neutral-800 text-white">
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Progress Over Time */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Progress Over Time</h3>
        {filteredTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
            <AreaChart
              data={filteredTimeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', color: '#ffffff', border: '1px solid #333333' }} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="accuracy" 
                name="Accuracy %" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No time progress data available</div>
        )}
      </div>

      {/* Goal Tracking */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Goal Achievement</h3>
        
        {/* Goal Type Selector */}
        <div className="mb-4">
          <div className="inline-flex rounded-md shadow-sm bg-neutral-800" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                goalType === 'accuracy' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
              onClick={() => setGoalType('accuracy')}
            >
              Accuracy
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                goalType === 'questions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
              onClick={() => setGoalType('questions')}
            >
              Questions
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                goalType === 'time' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
              onClick={() => setGoalType('time')}
            >
              Study Time
            </button>
          </div>
        </div>
        
        {data.summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accuracy Goal */}
            <div className={`p-4 rounded-md ${goalType === 'accuracy' ? 'bg-blue-900/30 ring-2 ring-blue-800' : 'bg-neutral-800'}`}>
              <h4 className="font-medium text-white mb-2">Accuracy Goal</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">
                  Current: {data.summary.accuracyPercentage}%
                </span>
                <span className="text-sm text-gray-300">
                  Goal: {goals.accuracy}%
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, progress.accuracy)}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-400 text-right">
                {progress.accuracy}% Complete
              </div>
            </div>
            
            {/* Questions Goal */}
            <div className={`p-4 rounded-md ${goalType === 'questions' ? 'bg-green-900/30 ring-2 ring-green-800' : 'bg-neutral-800'}`}>
              <h4 className="font-medium text-white mb-2">Questions Goal</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">
                  Current: {data.summary.totalAttempts}
                </span>
                <span className="text-sm text-gray-300">
                  Goal: {goals.questions}
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, progress.questions)}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-400 text-right">
                {progress.questions}% Complete
              </div>
            </div>
            
            {/* Time Goal */}
            <div className={`p-4 rounded-md ${goalType === 'time' ? 'bg-purple-900/30 ring-2 ring-purple-800' : 'bg-neutral-800'}`}>
              <h4 className="font-medium text-white mb-2">Study Time Goal</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">
                  Current: {data.summary.totalTimeInHours} hrs
                </span>
                <span className="text-sm text-gray-300">
                  Goal: {goals.time} hrs
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, progress.time)}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-400 text-right">
                {progress.time}% Complete
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No progress data available</div>
        )}
      </div>

      {/* Improvement Areas */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Improvement Areas</h3>
        {improvementData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
            <RadarChart outerRadius={90} data={improvementData}>
              <PolarGrid stroke="#444444" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar 
                name="Improvement Needed" 
                dataKey="improvement" 
                stroke="#FF8042" 
                fill="#FF8042" 
                fillOpacity={0.6} 
              />
              {/* <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', color: '#fff' }} formatter={(value) => [`${value}%`, 'Improvement Needed']} /> */}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No improvement data available</div>
        )}

        {/* Improvement Recommendations */}
        {improvementData.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-800">Recommended Focus Areas:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {improvementData
                .sort((a, b) => b.improvement - a.improvement)
                .slice(0, 3)
                .map((area, index) => (
                  <li key={index}>
                    <span className="font-medium">{area.subject}</span>: 
                    {area.improvement > 50 
                      ? ' Needs significant improvement' 
                      : area.improvement > 30 
                        ? ' Needs moderate improvement'
                        : ' Could use some fine-tuning'}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Milestone Tracking</h3>
        
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">
              Milestones Achieved: {achievedMilestones}/{milestones.length}
            </span>
            <span className="text-sm text-gray-300">
              {milestonesPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2.5">
            <div 
              className="bg-amber-500 h-2.5 rounded-full" 
              style={{ width: `${milestonesPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Milestone List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone, index) => (
            <div 
              key={index}
              className={`flex items-center p-3 rounded-md ${
                milestone.achieved 
                  ? 'bg-green-900/30 border border-green-800' 
                  : 'bg-neutral-800 border border-neutral-700'
              }`}
            >
              <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                milestone.achieved 
                  ? 'bg-green-800 text-green-200' 
                  : 'bg-neutral-700 text-gray-400'
              }`}>
                {milestone.achieved ? '✓' : '○'}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  milestone.achieved ? 'text-green-400' : 'text-gray-300'
                }`}>
                  {milestone.name}
                </p>
                {milestone.category && (
                  <p className="text-xs text-gray-400">{milestone.category}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Path */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Suggested Learning Path</h3>
        
        {data.summary ? (
          <div className="space-y-4">
            {/* Accuracy Recommendation */}
            {parseFloat(data.summary.accuracyPercentage) < 70 && (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-blue-900/30 border border-blue-800 rounded-md">
                <span className="text-blue-400 text-xl">📚</span>
                <div>
                  <p className="font-medium text-blue-400">Focus on Fundamentals</p>
                  <p className="text-sm text-blue-500">
                    Your current accuracy is {data.summary.accuracyPercentage}%. Try reviewing core concepts and spending more time on each question to improve understanding.
                  </p>
                </div>
              </div>
            )}

            {/* Volume Recommendation */}
            {data.summary.totalAttempts < 50 && (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-green-900/30 border border-green-800 rounded-md">
                <span className="text-green-400 text-xl">🔢</span>
                <div>
                  <p className="font-medium text-green-400">Increase Practice Volume</p>
                  <p className="text-sm text-green-500">
                    You've completed {data.summary.totalAttempts} questions so far. Try to reach at least 50 questions to build a stronger foundation.
                  </p>
                </div>
              </div>
            )}

            {/* Subject Balance Recommendation */}
            {improvementData.length > 0 && (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-purple-900/30 border border-purple-800 rounded-md">
                <span className="text-purple-400 text-xl">⚖️</span>
                <div>
                  <p className="font-medium text-purple-400">Balance Your Subjects</p>
                  <p className="text-sm text-purple-500">
                    {Object.keys(subjectData).length > 1 
                      ? `You're studying ${Object.keys(subjectData).length} subjects. Make sure to balance your time across all subjects, with extra focus on your weaker areas.`
                      : `You're currently focusing on only ${Object.keys(subjectData)[0]}. Consider expanding to other subjects for a well-rounded preparation.`}
                  </p>
                </div>
              </div>
            )}

            {/* Time Management Recommendation */}
            {parseFloat(data.summary.totalTimeInHours) < 5 && (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
                <span className="text-yellow-400 text-xl">⏱️</span>
                <div>
                  <p className="font-medium text-yellow-400">Consistency is Key</p>
                  <p className="text-sm text-yellow-500">
                    You've spent {data.summary.totalTimeInHours} hours studying. Try to establish a consistent daily study routine to build momentum.
                  </p>
                </div>
              </div>
            )}

            {/* Advanced Recommendation */}
            {parseFloat(data.summary.accuracyPercentage) >= 80 && data.summary.totalAttempts >= 100 && (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-indigo-900/30 border border-indigo-800 rounded-md">
                <span className="text-indigo-400 text-xl">🚀</span>
                <div>
                  <p className="font-medium text-indigo-400">Ready for Advanced Challenges</p>
                  <p className="text-sm text-indigo-500">
                    Your performance is excellent! Consider tackling more difficult questions and timed mock exams to prepare for the real test environment.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No data available for learning path recommendations</div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracking;
