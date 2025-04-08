import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useMediaQuery } from 'react-responsive';

const QuestionAnalysis = ({ data }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const { rawData } = data;
  const [selectedMetric, setSelectedMetric] = useState('timeSpent');

  // Function to categorize questions by time spent
  const categorizeByTimeSpent = () => {
    if (!rawData || rawData.length === 0) return [];
    
    const categories = {
      'Quick (<30 sec)': 0,
      'Short (30-60 sec)': 0,
      'Medium (1-2 min)': 0,
      'Long (2-5 min)': 0,
      'Very Long (>5 min)': 0
    };
    
    rawData.forEach(item => {
      const timeInSeconds = item.time_spent;
      
      if (timeInSeconds < 30) {
        categories['Quick (<30 sec)'] += 1;
      } else if (timeInSeconds < 60) {
        categories['Short (30-60 sec)'] += 1;
      } else if (timeInSeconds < 120) {
        categories['Medium (1-2 min)'] += 1;
      } else if (timeInSeconds < 300) {
        categories['Long (2-5 min)'] += 1;
      } else {
        categories['Very Long (>5 min)'] += 1;
      }
    });
    
    // Convert to array for charts
    return Object.keys(categories).map(category => ({
      name: category,
      value: categories[category]
    }));
  };

  // Function to categorize questions by attempts
  const categorizeByAttempts = () => {
    if (!rawData || rawData.length === 0) return [];
    
    const attemptsCount = {
      '1 Attempt': 0,
      '2 Attempts': 0,
      '3 Attempts': 0,
      '4+ Attempts': 0
    };
    
    rawData.forEach(item => {
      const attempts = item.attempt_count || 1;
      
      if (attempts === 1) {
        attemptsCount['1 Attempt'] += 1;
      } else if (attempts === 2) {
        attemptsCount['2 Attempts'] += 1;
      } else if (attempts === 3) {
        attemptsCount['3 Attempts'] += 1;
      } else {
        attemptsCount['4+ Attempts'] += 1;
      }
    });
    
    return Object.keys(attemptsCount).map(category => ({
      name: category,
      value: attemptsCount[category]
    }));
  };

  // Function to analyze question scores
  const analyzeScores = () => {
    if (!rawData || rawData.length === 0) return [];
    
    const scoreRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };
    
    rawData.forEach(item => {
      const score = item.score;
      
      if (score <= 20) {
        scoreRanges['0-20'] += 1;
      } else if (score <= 40) {
        scoreRanges['21-40'] += 1;
      } else if (score <= 60) {
        scoreRanges['41-60'] += 1;
      } else if (score <= 80) {
        scoreRanges['61-80'] += 1;
      } else {
        scoreRanges['81-100'] += 1;
      }
    });
    
    return Object.keys(scoreRanges).map(range => ({
      name: range,
      value: scoreRanges[range]
    }));
  };

  // Get accuracy by attempt count
  const getAccuracyByAttempts = () => {
    if (!rawData || rawData.length === 0) return [];
    
    const attemptData = {
      '1': { total: 0, correct: 0 },
      '2': { total: 0, correct: 0 },
      '3': { total: 0, correct: 0 },
      '4+': { total: 0, correct: 0 }
    };
    
    rawData.forEach(item => {
      const attempts = item.attempt_count || 1;
      const attemptKey = attempts >= 4 ? '4+' : attempts.toString();
      
      attemptData[attemptKey].total += 1;
      if (item.is_correct) {
        attemptData[attemptKey].correct += 1;
      }
    });
    
    return Object.keys(attemptData).map(attempt => ({
      name: `${attempt} ${parseInt(attempt) === 1 ? 'Attempt' : 'Attempts'}`,
      accuracy: attemptData[attempt].total > 0 
        ? (attemptData[attempt].correct / attemptData[attempt].total * 100).toFixed(1)
        : 0,
      total: attemptData[attempt].total
    }));
  };

  // Calculate time spent vs accuracy
  const getTimeVsAccuracy = () => {
    if (!rawData || rawData.length === 0) return [];
    
    const timeCategories = {
      'Quick (<30 sec)': { total: 0, correct: 0 },
      'Short (30-60 sec)': { total: 0, correct: 0 },
      'Medium (1-2 min)': { total: 0, correct: 0 },
      'Long (2-5 min)': { total: 0, correct: 0 },
      'Very Long (>5 min)': { total: 0, correct: 0 }
    };
    
    rawData.forEach(item => {
      const timeInSeconds = item.time_spent;
      let category;
      
      if (timeInSeconds < 30) {
        category = 'Quick (<30 sec)';
      } else if (timeInSeconds < 60) {
        category = 'Short (30-60 sec)';
      } else if (timeInSeconds < 120) {
        category = 'Medium (1-2 min)';
      } else if (timeInSeconds < 300) {
        category = 'Long (2-5 min)';
      } else {
        category = 'Very Long (>5 min)';
      }
      
      timeCategories[category].total += 1;
      if (item.is_correct) {
        timeCategories[category].correct += 1;
      }
    });
    
    return Object.keys(timeCategories).map(category => ({
      name: category,
      accuracy: timeCategories[category].total > 0 
        ? (timeCategories[category].correct / timeCategories[category].total * 100).toFixed(1)
        : 0,
      total: timeCategories[category].total,
      correct: timeCategories[category].correct
    }));
  };

  // Get data for selected metric
  const getChartData = () => {
    switch (selectedMetric) {
      case 'timeSpent':
        return categorizeByTimeSpent();
      case 'attempts':
        return categorizeByAttempts();
      case 'scores':
        return analyzeScores();
      default:
        return categorizeByTimeSpent();
    }
  };

  const timeAccuracyData = getTimeVsAccuracy();
  const attemptAccuracyData = getAccuracyByAttempts();
  const chartData = getChartData();

  // COLORS
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Question Analysis</h2>

      {/* Question Distribution */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Question Distribution</h3>
        
        {/* Metric Selector */}
        <div className="mb-4">
          <div className="inline-flex rounded-md shadow-sm bg-neutral-800" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                selectedMetric === 'timeSpent' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
              onClick={() => setSelectedMetric('timeSpent')}
            >
              Time Spent
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                selectedMetric === 'attempts' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
              onClick={() => setSelectedMetric('attempts')}
            >
              Attempts
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                selectedMetric === 'scores' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
              onClick={() => setSelectedMetric('scores')}
            >
              Scores
            </button>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
                <XAxis dataKey="name" />
                <YAxis />
               
                <Legend />
                <Bar dataKey="value" name="Questions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
            
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <PieChart margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No question data available</div>
        )}
      </div>

      {/* Time Spent Analysis */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Time Spent vs. Accuracy</h3>
        {timeAccuracyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
            <BarChart
              data={timeAccuracyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              
              <Legend />
              <Bar yAxisId="left" dataKey="total" name="Questions" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="accuracy" name="Accuracy %" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-500">No time accuracy data available</div>
        )}
      </div>

      {/* Attempts Analysis */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Attempts vs. Accuracy</h3>
        {attemptAccuracyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
            <BarChart
              data={attemptAccuracyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              
              <Legend />
              <Bar yAxisId="left" dataKey="total" name="Questions" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="accuracy" name="Accuracy %" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-500">No attempt accuracy data available</div>
        )}
      </div>

      {/* Question Insights */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Question Insights</h3>
        
        <div className="space-y-4">
          {/* Time Insight */}
          {(() => {
            if (timeAccuracyData.length === 0) return null;
            
            // Find time category with highest accuracy (with at least 5 questions)
            const bestTimeCategory = [...timeAccuracyData]
              .filter(item => item.total >= 5)
              .sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy))[0];
            
            return bestTimeCategory ? (
              <div className="flex items-start space-x-3 p-3 bg-green-900/30 border border-green-800 rounded-md">
                <span className="text-green-400 text-xl">⌛</span>
                <div>
                  <p className="font-medium text-green-400">Optimal Time Usage</p>
                  <p className="text-sm text-green-500">
                    You perform best on <strong>{bestTimeCategory.name}</strong> questions with {bestTimeCategory.accuracy}% accuracy.
                    {parseFloat(bestTimeCategory.accuracy) > 70 ? ' This is excellent!' : ''}
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Attempt Insight */}
          {(() => {
            if (attemptAccuracyData.length === 0) return null;
            
            // Check if multiple attempts improve accuracy
            const firstAttempt = attemptAccuracyData.find(item => item.name === '1 Attempt');
            const multipleAttempts = attemptAccuracyData.filter(item => item.name !== '1 Attempt' && item.total >= 3);
            
            if (firstAttempt && multipleAttempts.length > 0) {
              const avgMultipleAccuracy = multipleAttempts.reduce((acc, item) => acc + parseFloat(item.accuracy), 0) / multipleAttempts.length;
              const improvement = avgMultipleAccuracy - parseFloat(firstAttempt.accuracy);
              
              return (
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-blue-900/30 border border-blue-800 rounded-md">
                  <span className="text-blue-400 text-xl">🔄</span>
                  <div>
                    <p className="font-medium text-blue-400">Attempt Strategy</p>
                    <p className="text-sm text-blue-500">
                      {improvement > 0 
                        ? `Multiple attempts improve your accuracy by approximately ${improvement.toFixed(1)}%. Keep trying when you're not sure!` 
                        : `Your first attempt accuracy (${firstAttempt.accuracy}%) is actually better than subsequent attempts. Focus on getting it right the first time.`}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Question Type Insight */}
          {(() => {
            const timeData = categorizeByTimeSpent();
            if (timeData.length === 0) return null;
            
            // Check which type of questions the user attempts most
            const mostFrequentType = [...timeData].sort((a, b) => b.value - a.value)[0];
            
            // Check if there's a significant skew towards one type
            const totalQuestions = timeData.reduce((sum, item) => sum + item.value, 0);
            const typePercentage = (mostFrequentType.value / totalQuestions * 100).toFixed(0);
            
            if (parseInt(typePercentage) > 40) {
              return (
                <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-purple-900/30 border border-purple-800 rounded-md">
                  <span className="text-purple-400 text-xl">📊</span>
                  <div>
                    <p className="font-medium text-purple-400">Question Type Pattern</p>
                    <p className="text-sm text-purple-500">
                      {`${typePercentage}% of your questions are ${mostFrequentType.name}. ${
                        parseInt(typePercentage) > 60 
                          ? "Consider balancing your practice with different question types for a more well-rounded preparation." 
                          : "This distribution seems good, but try mixing in other question types as well."
                      }`}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Score Distribution Insight */}
          {(() => {
            const scoreData = analyzeScores();
            if (scoreData.length === 0) return null;
            
            // Calculate percentage of high scores (>60)
            const highScores = scoreData.filter(item => ['61-80', '81-100'].includes(item.name));
            const totalQuestions = scoreData.reduce((sum, item) => sum + item.value, 0);
            const highScorePercentage = totalQuestions > 0 
              ? highScores.reduce((sum, item) => sum + item.value, 0) / totalQuestions * 100 
              : 0;
            
            return (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
                <span className="text-yellow-400 text-xl">🎯</span>
                <div>
                  <p className="font-medium text-yellow-400">Score Distribution</p>
                  <p className="text-sm text-yellow-500">
                    {highScorePercentage >= 70 
                      ? `Excellent! ${highScorePercentage.toFixed(0)}% of your questions have scores above 60%. You're doing very well!` 
                      : highScorePercentage >= 50 
                        ? `Good job! ${highScorePercentage.toFixed(0)}% of your questions have scores above 60%. Keep improving!` 
                        : `Only ${highScorePercentage.toFixed(0)}% of your questions have scores above 60%. Focus on understanding core concepts to improve your scores.`}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalysis;
