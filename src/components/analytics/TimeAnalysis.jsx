import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, LineChart, Line
} from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-dark.css'; // Import our custom dark theme overrides

const TimeAnalysis = ({ data }) => {
  const { timeSeriesData, rawData } = data;
  const [timeRange, setTimeRange] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateSessions, setSelectedDateSessions] = useState([]);

  // This was moved to after studySessions is defined

  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === 'all' || !timeSeriesData || timeSeriesData.length === 0) {
      return timeSeriesData;
    }

    const today = new Date();
    const ranges = {
      '7days': 7,
      '30days': 30,
      '90days': 90
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - ranges[timeRange]);
    
    return timeSeriesData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  };

  const filteredTimeData = getFilteredData();

  // Calculate average time per question by day
  const avgTimeByDay = filteredTimeData?.map(day => ({
    date: day.date,
    avgTime: day.total > 0 ? day.timeSpent / day.total : 0
  })) || [];

  // Calculate time of day distribution data from raw data
  const getTimeOfDayData = () => {
    const timeDistribution = {
      'Morning (6AM-12PM)': 0,
      'Afternoon (12PM-5PM)': 0,
      'Evening (5PM-9PM)': 0,
      'Night (9PM-6AM)': 0
    };

    if (!rawData) return Object.keys(timeDistribution).map(time => ({ name: time, value: 0 }));

    rawData.forEach(item => {
      const date = new Date(item.created_at);
      const hour = date.getHours();

      if (hour >= 6 && hour < 12) {
        timeDistribution['Morning (6AM-12PM)'] += 1;
      } else if (hour >= 12 && hour < 17) {
        timeDistribution['Afternoon (12PM-5PM)'] += 1;
      } else if (hour >= 17 && hour < 21) {
        timeDistribution['Evening (5PM-9PM)'] += 1;
      } else {
        timeDistribution['Night (9PM-6AM)'] += 1;
      }
    });

    return Object.keys(timeDistribution).map(time => ({
      name: time,
      value: timeDistribution[time]
    }));
  };

  // Get day of week distribution
  const getDayOfWeekData = () => {
    const dayDistribution = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0
    };

    if (!rawData) return Object.keys(dayDistribution).map(day => ({ name: day, value: 0 }));

    rawData.forEach(item => {
      const date = new Date(item.created_at);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      dayDistribution[dayOfWeek] += 1;
    });

    // Convert to array format for chart
    return Object.keys(dayDistribution).map(day => ({
      name: day,
      value: dayDistribution[day]
    }));
  };

  const timeOfDayData = getTimeOfDayData();
  const dayOfWeekData = getDayOfWeekData();

  // Get study session data
  const getStudySessionsData = () => {
    if (!rawData || rawData.length === 0) return [];

    // Sort by creation date
    const sortedData = [...rawData].sort((a, b) => {
      return new Date(a.created_at) - new Date(b.created_at);
    });

    const sessions = [];
    let currentSession = {
      date: '',
      questions: 0,
      timeSpent: 0,
      correct: 0
    };

    const SESSION_BREAK_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

    sortedData.forEach((item, index) => {
      const currentDate = new Date(item.created_at);
      const currentDateString = currentDate.toLocaleDateString();
      
      if (index === 0) {
        // First item starts a new session
        currentSession = {
          date: currentDateString,
          questions: 1,
          timeSpent: item.time_spent,
          correct: item.is_correct ? 1 : 0,
          startTime: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        const prevDate = new Date(sortedData[index - 1].created_at);
        const timeDiff = currentDate - prevDate;
        
        if (timeDiff > SESSION_BREAK_TIME) {
          // More than 30 minutes gap, end current session and start a new one
          if (currentSession.questions > 0) {
            sessions.push({
              ...currentSession,
              endTime: prevDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              accuracy: (currentSession.correct / currentSession.questions * 100).toFixed(0)
            });
          }
          
          currentSession = {
            date: currentDateString,
            questions: 1,
            timeSpent: item.time_spent,
            correct: item.is_correct ? 1 : 0,
            startTime: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        } else {
          // Continue current session
          currentSession.questions += 1;
          currentSession.timeSpent += item.time_spent;
          if (item.is_correct) {
            currentSession.correct += 1;
          }
        }
      }
      
      // If last item, add the current session
      if (index === sortedData.length - 1) {
        sessions.push({
          ...currentSession,
          endTime: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          accuracy: (currentSession.correct / currentSession.questions * 100).toFixed(0)
        });
      }
    });

    return sessions;
  };

  // Process study sessions data
  const studySessions = getStudySessionsData();
  
  // Initialize selected date sessions when study sessions are available
  useEffect(() => {
    if (studySessions.length > 0) {
      const dateString = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear()}`;
      
      // Filter sessions for the selected date
      const sessionsForDate = studySessions.filter(session => {
        return session.date === dateString || 
               new Date(session.date).toLocaleDateString() === new Date(dateString).toLocaleDateString();
      });
      
      setSelectedDateSessions(sessionsForDate);
    }
  }, [studySessions, selectedDate]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Time-based Analytics</h2>
      
      {/* Time Range Filter */}
      <div className="flex justify-end overflow-x-auto pb-2">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              timeRange === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === '7days' 
                ? 'bg-blue-600 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
            onClick={() => setTimeRange('7days')}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              timeRange === '30days' 
                ? 'bg-blue-600 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
            onClick={() => setTimeRange('30days')}
          >
            Last 30 Days
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              timeRange === '90days' 
                ? 'bg-blue-600 text-white' 
                : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
            }`}
            onClick={() => setTimeRange('90days')}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Study Time Trend */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Study Time Tracking</h3>
        {filteredTimeData && filteredTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={filteredTimeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="date" tick={{ fill: '#ffffff' }} />
              <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#ffffff' }} tick={{ fill: '#ffffff' }} />
              {/* Tooltip disabled as per user request */}
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Area 
                type="monotone" 
                dataKey="timeSpent" 
                name="Time Spent (min)" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No time data available</div>
        )}
      </div>

      {/* Time Efficiency */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Time Efficiency</h3>
        {avgTimeByDay && avgTimeByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={avgTimeByDay}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" /> 
              <XAxis dataKey="date" tick={{ fill: '#ffffff' }} /> 
              <YAxis label={{ value: 'Average Time (min)', angle: -90, position: 'insideLeft', fill: '#ffffff' }} tick={{ fill: '#ffffff' }} /> 
              {/* <Tooltip 
                wrapperStyle={{ 
                  zIndex: 1000, 
                  position: 'fixed', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -100%)', 
                  pointerEvents: 'none' 
                }} 
                formatter={(value) => [`${value.toFixed(2)} min`, 'Avg. Time per Question']} 
                contentStyle={{ 
                  backgroundColor: '#1f1f1f', 
                  color: '#ffffff', 
                  border: '1px solid #333333',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }} 
              /> */}
              <Legend wrapperStyle={{ color: '#ffffff' }} /> 
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                name="Avg. Time per Question" 
                stroke="#82ca9d" 
                activeDot={{ r: 8 }} 
              /> 
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-10 text-gray-400">No time efficiency data available</div>
        )}
      </div>

      {/* Study Time Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Time of Day */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Optimal Study Times</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={timeOfDayData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="name" tick={{ fill: '#ffffff' }} />
              <YAxis label={{ value: 'Questions', angle: -90, position: 'insideLeft', fill: '#ffffff' }} tick={{ fill: '#ffffff' }} />
              {/* Tooltip disabled as per user request */}
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Bar dataKey="value" name="Questions" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day of Week */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Day of Week Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={dayOfWeekData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444444" />
              <XAxis dataKey="name" tick={{ fill: '#ffffff' }} />
              <YAxis label={{ value: 'Questions', angle: -90, position: 'insideLeft', fill: '#ffffff' }} tick={{ fill: '#ffffff' }} />
              {/* Tooltip disabled as per user request */}
              <Legend wrapperStyle={{ color: '#ffffff' }} />
              <Bar dataKey="value" name="Questions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Study Sessions */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Study Session Analysis</h3>
        
        {studySessions.length > 0 ? (
          <div>
            {/* Calendar View */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-300 mb-2">Calendar View</h4>
              <div className="calendar-container">
                <Calendar 
                  className="study-calendar"
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    
                    // Format date for comparison with study sessions
                    const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                    
                    // Filter sessions for the selected date
                    const sessionsForDate = studySessions.filter(session => {
                      // Try to match in multiple formats for robustness
                      return session.date === dateString || 
                             new Date(session.date).toLocaleDateString() === new Date(dateString).toLocaleDateString();
                    });
                    
                    // Update selected date sessions
                    setSelectedDateSessions(sessionsForDate);
                  }}
                  tileClassName={({ date }) => {
                    // Format date as string in the same format as your data
                    const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                    const sessionForDate = studySessions.find(session => {
                      // Try to match in multiple formats for robustness
                      return session.date === dateString || 
                             new Date(session.date).toLocaleDateString() === new Date(dateString).toLocaleDateString();
                    });
                    return sessionForDate ? 'has-study-session' : null;
                  }}
                  tileContent={({ date }) => {
                    // Format date as string in the same format as your data
                    const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                    const sessionForDate = studySessions.find(session => {
                      // Try to match in multiple formats for robustness
                      return session.date === dateString || 
                             new Date(session.date).toLocaleDateString() === new Date(dateString).toLocaleDateString();
                    });
                    if (sessionForDate) {
                      return (
                        <div className="study-session-indicator">
                          <span className="text-xs">{sessionForDate.questions}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </div>
              <style jsx global>{`
                /* Full dark theme styling for calendar */
                .react-calendar {
                  background-color: #171717;
                  border: 1px solid #333;
                  color: #fff;
                  border-radius: 0.5rem;
                  width: 100%;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  font-family: inherit;
                  line-height: 1.125em;
                }
                
                /* Navigation area styling */
                .react-calendar__navigation {
                  display: flex;
                  height: 44px;
                  margin-bottom: 1em;
                  background-color: #1f1f1f;
                  border-bottom: 1px solid #333;
                  border-radius: 0.5rem 0.5rem 0 0;
                }
                
                .react-calendar__navigation button {
                  min-width: 44px;
                  background: none;
                  color: #fff;
                  border: none;
                  border-radius: 0.25rem;
                }
                
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                  background-color: #2c2c2c;
                }
                
                .react-calendar__navigation button[disabled] {
                  background-color: transparent;
                  color: #666;
                }
                
                /* Month/Year labels */
                .react-calendar__month-view__weekdays {
                  text-align: center;
                  text-transform: uppercase;
                  font-weight: bold;
                  font-size: 0.75em;
                  color: #999;
                  border-bottom: 1px solid #333;
                  padding: 0.5em 0;
                }
                
                /* Calendar tiles */
                .react-calendar__tile {
                  max-width: 100%;
                  padding: 10px 6.6667px;
                  background: none;
                  text-align: center;
                  color: #ddd;
                  border: none;
                }
                
                .react-calendar__tile:enabled:hover,
                .react-calendar__tile:enabled:focus {
                  background-color: #2c2c2c;
                  border-radius: 4px;
                }
                
                .react-calendar__tile--now {
                  background: rgba(59, 130, 246, 0.15);
                  border-radius: 4px;
                  color: #3b82f6;
                  font-weight: bold;
                }
                
                .react-calendar__tile--now:enabled:hover,
                .react-calendar__tile--now:enabled:focus {
                  background: rgba(59, 130, 246, 0.25);
                }
                
                .react-calendar__tile--active {
                  background: #3b82f6;
                  border-radius: 4px;
                  color: white;
                  font-weight: bold;
                }
                
                .react-calendar__tile--active:enabled:hover,
                .react-calendar__tile--active:enabled:focus {
                  background: #2563eb;
                }
                
                /* Style for days from other months */
                .react-calendar__month-view__days__day--neighboringMonth {
                  color: #555;
                }
                
                /* Day with study session styling */
                .has-study-session {
                  background-color: rgba(59, 130, 246, 0.3) !important;
                  position: relative;
                  color: white !important;
                  font-weight: bold;
                }
                
                .study-session-indicator {
                  position: absolute;
                  bottom: 2px;
                  right: 2px;
                  background-color: #3b82f6;
                  color: white;
                  width: 16px;
                  height: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 50%;
                  font-size: 0.7em;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                }
                
                /* Fix current day highlight */
                .react-calendar__tile--hasActive:not(.react-calendar__tile--active) {
                  background-color: rgba(59, 130, 246, 0.2);
                }
              `}</style>
            </div>
            
            {/* Selected Date Sessions */}
            <div className="mt-6 mb-4">
              <h4 className="text-md font-medium text-gray-300 mb-2">
                Sessions for {selectedDate.toLocaleDateString()} 
                {selectedDateSessions.length === 0 && ' (No sessions on this date)'}
              </h4>
              
              {selectedDateSessions.length > 0 && (
                <div className="bg-neutral-800 p-4 rounded-lg mb-4">
                  {selectedDateSessions.map((session, index) => (
                    <div key={index} className="mb-3 last:mb-0 p-3 bg-neutral-700/30 rounded-lg">
                      <div className="flex flex-wrap justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-blue-400">
                            Time: <span className="text-white">{session.startTime} - {session.endTime}</span>
                          </p>
                          <p className="text-sm font-medium text-blue-400">
                            Duration: <span className="text-white">{Math.round(session.timeSpent / 60)} minutes</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            Questions: <span className="text-white">{session.questions} ({session.correct} correct)</span>
                          </p>
                          <p className="text-sm font-medium text-purple-400">
                            Accuracy: <span className={`px-2 py-1 ml-1 text-xs font-semibold rounded-full ${
                              parseInt(session.accuracy) >= 70 
                                ? 'bg-green-900/50 text-green-400 border border-green-800' 
                                : parseInt(session.accuracy) >= 40 
                                  ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' 
                                  : 'bg-red-900/50 text-red-400 border border-red-800'
                            }`}>
                              {session.accuracy}%
                            </span>
                          </p>
                        </div>
                        {session.subjects && (
                          <div className="w-full mt-3">
                            <p className="text-sm font-medium text-orange-400">Subjects:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {session.subjects.map((subject, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-neutral-800 text-gray-300 rounded-md">
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* All Sessions Table - Hidden as requested */}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No study sessions data available</div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Time Insights</h3>
        
        <div className="space-y-4">
          {/* Best Time of Day */}
          {(() => {
            if (timeOfDayData.length === 0) return null;
            
            const mostProductiveTime = [...timeOfDayData].sort((a, b) => b.value - a.value)[0];
            return mostProductiveTime.value > 0 ? (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-blue-900/30 border border-blue-800 rounded-md">
                <span className="text-blue-400 text-xl">⏰</span>
                <div>
                  <p className="font-medium text-blue-400">Your Most Active Time</p>
                  <p className="text-sm text-blue-500">
                    You study most frequently during <strong>{mostProductiveTime.name}</strong> with {mostProductiveTime.value} questions attempted.
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Best Day of Week */}
          {(() => {
            if (dayOfWeekData.length === 0) return null;
            
            const mostProductiveDay = [...dayOfWeekData].sort((a, b) => b.value - a.value)[0];
            return mostProductiveDay.value > 0 ? (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-green-900/30 border border-green-800 rounded-md">
                <span className="text-green-400 text-xl">📅</span>
                <div>
                  <p className="font-medium text-green-400">Your Most Productive Day</p>
                  <p className="text-sm text-green-500">
                    <strong>{mostProductiveDay.name}</strong> is your most active day with {mostProductiveDay.value} questions attempted.
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {/* Study Session Insight */}
          {(() => {
            if (studySessions.length === 0) return null;
            
            const avgSessionLength = studySessions.reduce((acc, session) => acc + session.timeSpent, 0) / studySessions.length / 60;
            const avgQuestionsPerSession = studySessions.reduce((acc, session) => acc + session.questions, 0) / studySessions.length;
            
            return (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-purple-900/30 border border-purple-800 rounded-md">
                <span className="text-purple-400 text-xl">📊</span>
                <div>
                  <p className="font-medium text-purple-400">Study Session Patterns</p>
                  <p className="text-sm text-purple-500">
                    On average, your study sessions last <strong>{avgSessionLength.toFixed(1)} minutes</strong> and you complete <strong>{avgQuestionsPerSession.toFixed(1)} questions</strong> per session.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Time Improvement Suggestion */}
          {(() => {
            if (!filteredTimeData || filteredTimeData.length === 0) return null;
            
            // Check if the user has been studying consistently
            const consistencyThreshold = 3; // Number of days in a row to consider consistent
            let maxConsecutiveDays = 0;
            let currentConsecutiveDays = 0;
            
            // Sort dates
            const sortedDates = [...filteredTimeData].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Count max consecutive days
            for (let i = 0; i < sortedDates.length; i++) {
              if (i === 0) {
                currentConsecutiveDays = 1;
              } else {
                const currentDate = new Date(sortedDates[i].date);
                const prevDate = new Date(sortedDates[i-1].date);
                const diffTime = Math.abs(currentDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                  currentConsecutiveDays++;
                } else {
                  if (currentConsecutiveDays > maxConsecutiveDays) {
                    maxConsecutiveDays = currentConsecutiveDays;
                  }
                  currentConsecutiveDays = 1;
                }
              }
            }
            
            // Update max if the last sequence is the longest
            if (currentConsecutiveDays > maxConsecutiveDays) {
              maxConsecutiveDays = currentConsecutiveDays;
            }
            
            return (
              <div className="flex flex-col md:flex-row items-start space-y-2 md:space-y-0 md:space-x-3 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
                <span className="text-yellow-400 text-xl">💡</span>
                <div>
                  <p className="font-medium text-yellow-400">Time Management Insight</p>
                  <p className="text-sm text-yellow-500">
                    {maxConsecutiveDays >= consistencyThreshold 
                      ? `Great job! You've maintained a ${maxConsecutiveDays}-day study streak. Consistent daily practice is key to success.` 
                      : `Try to establish a more consistent study routine. Your longest study streak so far is ${maxConsecutiveDays} day(s).`}
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

export default TimeAnalysis;
