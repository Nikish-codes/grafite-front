import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const DashboardOverview = ({ data }) => {
  const { summary, subjectData, timeSeriesData } = data;
  
  // Create data for subject accuracy pie chart
  const subjectAccuracyData = Object.keys(subjectData).map(subject => {
    const subjectInfo = subjectData[subject];
    const accuracy = subjectInfo.total > 0 
      ? (subjectInfo.correct / subjectInfo.total * 100).toFixed(2) 
      : 0;
    
    return {
      name: subject,
      value: parseFloat(accuracy),
      total: subjectInfo.total,
      correct: subjectInfo.correct
    };
  });

  // Create data for last 7 days trend
  const last7DaysData = timeSeriesData.slice(-7);

  // COLORS
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-400 mb-1">Total Questions</h3>
          <p className="text-2xl font-bold text-blue-400">{summary.totalAttempts}</p>
        </div>
        
        <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-400 mb-1">Correct Answers</h3>
          <p className="text-2xl font-bold text-green-400">{summary.correctAnswers}</p>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-400 mb-1">Accuracy</h3>
          <p className="text-2xl font-bold text-purple-400">{summary.accuracyPercentage}%</p>
        </div>
        
        <div className="bg-orange-900/20 border border-orange-800 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-400 mb-1">Study Time</h3>
          <p className="text-2xl font-bold text-orange-400">{summary.totalTimeInHours} hrs</p>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accuracy Circle */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Overall Accuracy</h3>
          <div className="flex justify-center">
            <div style={{ width: '100%', maxWidth: 200, height: 200, margin: '0 auto' }}>
              <CircularProgressbar
                value={parseFloat(summary.accuracyPercentage)}
                text={`${summary.accuracyPercentage}%`}
                styles={buildStyles({
                  pathColor: `rgba(62, 152, 199, ${parseFloat(summary.accuracyPercentage) / 100})`,
                  textColor: '#3e98c7',
                  trailColor: '#333333',
                  backgroundColor: '#121212'
                })}
              />
            </div>
          </div>
          <div className="mt-4 text-center text-gray-400">
            <p>You've answered {summary.correctAnswers} questions correctly out of {summary.totalAttempts}.</p>
          </div>
        </div>

        {/* Subject Accuracy */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Performance by Subject</h3>
          {subjectAccuracyData.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <ResponsiveContainer width="100%" height={350}>
              <PieChart cx="50%" cy="50%">
                <Pie
                  data={subjectAccuracyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {subjectAccuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                {/* Tooltip disabled as per user request */}
                <Legend wrapperStyle={{ color: '#ffffff' }} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">No subject data available</div>
          )}
        </div>
      </div>

      {/* Recent Performance Trend */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Performance Trend</h3>
        {last7DaysData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart 
              data={last7DaysData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="date" tick={{ fill: '#ffffff' }} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              {/* Tooltip disabled as per user request */}
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy %" />
              <Line yAxisId="right" type="monotone" dataKey="total" stroke="#82ca9d" name="Questions Attempted" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No recent data available</div>
        )}
      </div>

      {/* Quick Insights */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Quick Insights</h3>
        
        <div className="space-y-4">
          {summary.accuracyPercentage > 70 && (
            <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-green-900/30 border border-green-800 rounded-md">
              <span className="text-green-400 text-xl">💪</span>
              <div>
                <p className="font-medium text-green-400">Strong Performance</p>
                <p className="text-sm text-green-500">Your overall accuracy of {summary.accuracyPercentage}% is excellent!</p>
              </div>
            </div>
          )}

          {summary.accuracyPercentage < 50 && (
            <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
              <span className="text-yellow-400 text-xl">💡</span>
              <div>
                <p className="font-medium text-yellow-400">Room for Improvement</p>
                <p className="text-sm text-yellow-500">Your overall accuracy is {summary.accuracyPercentage}%. Try reviewing difficult topics.</p>
              </div>
            </div>
          )}

          {subjectAccuracyData.length > 0 && (
            <>
              {/* Best Subject */}
              {(() => {
                const bestSubject = [...subjectAccuracyData].sort((a, b) => b.value - a.value)[0];
                return bestSubject && bestSubject.total >= 5 ? (
                  <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-blue-900/30 border border-blue-800 rounded-md">
                    <span className="text-blue-400 text-xl">🏆</span>
                    <div>
                      <p className="font-medium text-blue-400">Strongest Subject</p>
                      <p className="text-sm text-blue-500">
                        {bestSubject.name} with {bestSubject.value}% accuracy ({bestSubject.correct}/{bestSubject.total})
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Weakest Subject */}
              {(() => {
                const weakestSubject = [...subjectAccuracyData]
                  .filter(item => item.total >= 5)
                  .sort((a, b) => a.value - b.value)[0];
                return weakestSubject ? (
                  <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-red-900/30 border border-red-800 rounded-md">
                    <span className="text-red-400 text-xl">📚</span>
                    <div>
                      <p className="font-medium text-red-400">Focus Area</p>
                      <p className="text-sm text-red-500">
                        {weakestSubject.name} with {weakestSubject.value}% accuracy needs improvement
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}
            </>
          )}

          {/* Time Insight */}
          {summary.totalTimeInHours > 0 && (
            <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-purple-900/30 border border-purple-800 rounded-md">
              <span className="text-purple-400 text-xl">⏱️</span>
              <div>
                <p className="font-medium text-purple-400">Study Time</p>
                <p className="text-sm text-purple-500">
                  You've dedicated {summary.totalTimeInHours} hours to learning. 
                  {summary.totalAttempts > 0 ? 
                    ` That's about ${(summary.totalTimeSpent / summary.totalAttempts / 60).toFixed(1)} minutes per question.` : 
                    ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
