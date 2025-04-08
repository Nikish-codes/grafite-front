import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from 'recharts';

const SubjectAnalysis = ({ data }) => {
  const { subjectData } = data;
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Create data for subject comparison bar chart
  const subjectComparisonData = Object.keys(subjectData).map(subject => {
    const subjectInfo = subjectData[subject];
    const accuracy = subjectInfo.total > 0 
      ? (subjectInfo.correct / subjectInfo.total * 100).toFixed(2) 
      : 0;
    
    return {
      subject,
      total: subjectInfo.total,
      correct: subjectInfo.correct,
      accuracy: parseFloat(accuracy),
      timeSpent: Math.round(subjectInfo.timeSpent / 60) // Convert to minutes
    };
  });

  // Get chapters data for selected subject
  const getChapterData = () => {
    if (!selectedSubject || !subjectData[selectedSubject]) return [];
    
    const chapters = subjectData[selectedSubject].chapters;
    return Object.keys(chapters).map(chapter => {
      const chapterInfo = chapters[chapter];
      const accuracy = chapterInfo.total > 0 
        ? (chapterInfo.correct / chapterInfo.total * 100).toFixed(2) 
        : 0;
      
      return {
        chapter,
        total: chapterInfo.total,
        correct: chapterInfo.correct,
        accuracy: parseFloat(accuracy),
        timeSpent: Math.round(chapterInfo.timeSpent / 60) // Convert to minutes
      };
    });
  };

  // Data for radar chart
  const prepareRadarData = () => {
    return subjectComparisonData.map(item => ({
      subject: item.subject,
      accuracy: item.accuracy,
      questions: Math.min(100, (item.total / Math.max(...subjectComparisonData.map(d => d.total))) * 100),
      timeInvested: Math.min(100, (item.timeSpent / Math.max(...subjectComparisonData.map(d => d.timeSpent))) * 100)
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Subject Performance Analysis</h2>
      
      {/* Subject Comparison */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Subject Comparison</h3>
        {subjectComparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={subjectComparisonData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="subject" angle={-45} textAnchor="end" height={70} tick={{ fill: '#ffffff' }} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Questions', angle: -90, position: 'insideLeft', fill: '#ffffff' }} tick={{ fill: '#ffffff' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Accuracy %', angle: 90, position: 'insideRight', fill: '#ffffff' }} tick={{ fill: '#ffffff' }} />
              {/* Tooltip disabled as per user request */}
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Bar yAxisId="left" dataKey="total" name="Total Questions" fill="#8884d8" />
              <Bar yAxisId="left" dataKey="correct" name="Correct Answers" fill="#82ca9d" />
              <Bar yAxisId="right" dataKey="accuracy" name="Accuracy %" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No subject data available</div>
        )}
      </div>

      {/* Subject Strengths Radar */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Subject Strengths</h3>
        {subjectComparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart 
              outerRadius={90} 
              data={prepareRadarData()}
              cx="50%" 
              cy="50%"
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <PolarGrid stroke="#444444" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#ffffff' }} />
              <Radar name="Accuracy" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Questions Attempted" dataKey="questions" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Radar name="Time Invested" dataKey="timeInvested" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              {/* Tooltip disabled as per user request */}
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No subject data available</div>
        )}
      </div>

      {/* Chapter-level Analysis */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Topic-level Analysis</h3>
        <div className="mb-4">
          <label htmlFor="subject-select" className="block text-sm font-medium text-gray-300 mb-1">
            Select Subject
          </label>
          <select
            id="subject-select"
            className="block w-full p-2 bg-neutral-800 border border-neutral-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="" className="bg-neutral-800 text-white">Select a subject</option>
            {Object.keys(subjectData).map((subject) => (
              <option key={subject} value={subject} className="bg-neutral-800 text-white">
                {subject}
              </option>
            ))}
          </select>
        </div>

        {selectedSubject ? (
          getChapterData().length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={getChapterData()}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                <XAxis dataKey="chapter" angle={-45} textAnchor="end" height={70} tick={{ fill: '#ffffff' }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                {/* Tooltip disabled as per user request */}
                <Legend wrapperStyle={{ color: '#ffffff' }} />
                <Bar yAxisId="left" dataKey="total" name="Total Questions" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="correct" name="Correct Answers" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="accuracy" name="Accuracy %" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-400">No data available for this subject</div>
          )
        ) : (
          <div className="text-center py-10 text-gray-400">Please select a subject to view chapter analysis</div>
        )}
      </div>

      {/* Performance Insights */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Performance Insights</h3>
        
        {subjectComparisonData.length > 0 ? (
          <div className="space-y-4">
            {/* Best Subject */}
            {(() => {
              const bestSubject = [...subjectComparisonData]
                .filter(item => item.total >= 5)
                .sort((a, b) => b.accuracy - a.accuracy)[0];
              
              return bestSubject ? (
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-green-900/30 border border-green-800 rounded-md">
                  <span className="text-green-400 text-xl">🏆</span>
                  <div>
                    <p className="font-medium text-green-400">Strongest Subject</p>
                    <p className="text-sm text-green-500">
                      Your strongest subject is <strong>{bestSubject.subject}</strong> with {bestSubject.accuracy}% accuracy.
                      You've answered {bestSubject.correct} out of {bestSubject.total} questions correctly.
                    </p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Weakest Subject */}
            {(() => {
              const weakestSubject = [...subjectComparisonData]
                .filter(item => item.total >= 5)
                .sort((a, b) => a.accuracy - b.accuracy)[0];
              
              return weakestSubject ? (
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-red-900/30 border border-red-800 rounded-md">
                  <span className="text-red-400 text-xl">📚</span>
                  <div>
                    <p className="font-medium text-red-400">Focus Area</p>
                    <p className="text-sm text-red-500">
                      You may want to focus more on <strong>{weakestSubject.subject}</strong> where your accuracy is {weakestSubject.accuracy}%.
                      You've answered {weakestSubject.correct} out of {weakestSubject.total} questions correctly.
                    </p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Most Practiced */}
            {(() => {
              const mostPracticed = [...subjectComparisonData]
                .sort((a, b) => b.total - a.total)[0];
              
              return mostPracticed ? (
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-blue-900/30 border border-blue-800 rounded-md">
                  <span className="text-blue-400 text-xl">🔍</span>
                  <div>
                    <p className="font-medium text-blue-400">Most Practiced</p>
                    <p className="text-sm text-blue-500">
                      You've practiced <strong>{mostPracticed.subject}</strong> the most with {mostPracticed.total} questions attempted.
                      {mostPracticed.timeSpent > 0 ? ` You've spent about ${mostPracticed.timeSpent} minutes on this subject.` : ''}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Least Practiced */}
            {(() => {
              const leastPracticed = [...subjectComparisonData]
                .sort((a, b) => a.total - b.total)[0];
              
              return leastPracticed ? (
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                  <div>
                    <p className="font-medium text-yellow-400">Least Practiced</p>
                    <p className="text-sm text-yellow-500">
                      You've practiced <strong>{leastPracticed.subject}</strong> the least with only {leastPracticed.total} questions attempted.
                      Consider dedicating more time to this subject.
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No subject data available for insights</div>
        )}
      </div>
    </div>
  );
};

export default SubjectAnalysis;
