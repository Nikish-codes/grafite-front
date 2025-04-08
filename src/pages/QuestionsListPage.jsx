import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { getExamQuestions } from '../services/grafiteApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import MathJaxComponent, { MathJaxBatch } from '../components/common/MathJax';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';

// Map exam types to display titles
const examTypeToTitle = {
  'jee-adv-booster': 'JEE Advanced Rank Booster',
  'bitsat-prep': 'BITSAT Prep Guide',
  'jee-mains-500': 'JEE Mains Top 500 QnA',
  'jee-mains-250': 'JEE Mains Top 250 Single Correct Questions',
  'wbjee': 'WBJEE Chapterwise',
  'mains-2025': '2025 Mains Questions'
};

// Map subject IDs to display names
const subjectToTitle = {
  'PHY': 'Physics',
  'CHEM': 'Chemistry',
  'MATH': 'Mathematics',
  'BIO': 'Biology',
  'ENG': 'English',
  'LR': 'Logical Reasoning'
};

// Map question types to display labels
const questionTypeLabels = {
  'singleCorrect': 'Single Correct',
  'multipleCorrect': 'Multiple Correct',
  'integer': 'Integer',
  'numerical': 'Numerical'
};

// Define getQuestionTypeColor function before it's used
const getQuestionTypeColor = (type) => {
  switch (type) {
    case 'singleCorrect':
      return 'bg-green-700/20 text-green-400';
    case 'multipleCorrect':
      return 'bg-blue-700/20 text-blue-400';
    case 'integer':
      return 'bg-yellow-700/20 text-yellow-400';
    case 'numerical':
      return 'bg-purple-700/20 text-purple-400';
    default:
      return 'bg-gray-700/20 text-gray-400';
  }
};

// Simple QuestionCard component without virtualization
const QuestionCard = React.memo(({ question, index, getQuestionStatus, handleQuestionClick }) => {
  return (
    <Card
      className={`flex flex-col justify-between p-6 rounded-lg bg-neutral-900 shadow hover:shadow-lg transition hover:-translate-y-1 cursor-pointer border ${
        getQuestionStatus(question.question_ID) === 'correct'
          ? 'border-green-500 hover:border-green-400 opacity-70'
          : getQuestionStatus(question.question_ID) === 'incorrect'
            ? 'border-red-500 hover:border-red-400 opacity-70'
            : 'border-neutral-800 hover:border-primary opacity-100'
      }`}
      onClick={() => handleQuestionClick(question.question_ID)}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={`${
            getQuestionStatus(question.question_ID) === 'correct'
              ? 'bg-green-500/20 text-green-400'
              : getQuestionStatus(question.question_ID) === 'incorrect'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-primary/10 text-primary'
          }`}>
            Q{index + 1}
            {getQuestionStatus(question.question_ID) && (
              <span className="ml-1">
                {getQuestionStatus(question.question_ID) === 'correct' ? '✓' : '✗'}
              </span>
            )}
          </Badge>
          <Badge variant="outline" className={getQuestionTypeColor(question.type)}>
            {questionTypeLabels[question.type] || question.type}
          </Badge>
        </div>
        <div 
          className="text-sm text-gray-300 overflow-hidden max-h-24"
          dangerouslySetInnerHTML={{ __html: question.question }}
        />
      </div>
    </Card>
  );
});

const QuestionsListPage = () => {
  const { examType, subject, chapterName } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getProgress, getCompletionPercentage, refreshProgressData } = useProgress();
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionsPerPage] = useState(60); // Show 48 questions per page
  const [examTitle, setExamTitle] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [filters, setFilters] = useState({
    type: null,
    level: null,
    minLevel: null,
    maxLevel: null,
    search: '',
  });
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [availableTypes] = useState(['singleCorrect', 'multipleCorrect', 'integer', 'numerical']);
  const [availableLevels] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [questionProgress, setQuestionProgress] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [mathJaxLoading, setMathJaxLoading] = useState(false);

  // Create a memoized array of expressions for batch rendering
  const mathExpressions = useMemo(() => {
    return questions.map(question => ({
      id: `question-${question.question_ID}`,
      content: question.question,
      displayMode: false
    }));
  }, [questions]);

  // Add loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-2">
      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  // Use the isQuestionCorrect function from ProgressContext to check question status
  const getQuestionStatus = useCallback((questionId) => {
    if (!isAuthenticated) {
      // For non-authenticated users, check localStorage
      const existingAnswers = JSON.parse(localStorage.getItem('question_answers') || '[]');
      const answer = existingAnswers.find(a => a.questionId === questionId);
      return answer ? (answer.isCorrect ? 'correct' : 'incorrect') : null;
    }
    
    // For authenticated users, use the cached data from ProgressContext
    if (questionProgress[questionId]) {
      return questionProgress[questionId].is_correct ? 'correct' : 'incorrect';
    }
    
    return null;
  }, [isAuthenticated, questionProgress]);

  // Improved useEffect to properly calculate chapter progress
  useEffect(() => {
    // Set titles based on exam type and subject
    setExamTitle(examTypeToTitle[examType] || examType);
    setSubjectTitle(subjectToTitle[subject] || subject);
    
    // If authenticated, fetch progress data only once
    if (isAuthenticated && user) {
      const fetchProgressData = async () => {
        try {
          // First refresh the progress data to ensure we have the latest
          await refreshProgressData();
          
          // Then get the progress for this specific exam/subject/chapter
          const progress = await getProgress(examType, subject, chapterName);
          
          // Create a map of question IDs to progress data
          const progressMap = {};
          progress.forEach(item => {
            progressMap[item.question_id] = item;
          });
          
          setQuestionProgress(progressMap);
          
          // Calculate completion percentage based on total questions in this chapter
          // This will be updated when we know the total number of questions
          const attemptedQuestions = Object.keys(progressMap).length;
          if (totalQuestions > 0) {
            const percentage = (attemptedQuestions / totalQuestions) * 100;
            setCompletionPercentage(Math.min(percentage, 100)); // Cap at 100%
          } else {
            // If we don't know total yet, use API response
            const percentage = getCompletionPercentage(examType, subject, chapterName);
            setCompletionPercentage(percentage);
          }
        } catch (error) {
          console.error('Error fetching progress data:', error);
        }
      };
      
      fetchProgressData();
    } else {
      // If not authenticated, check localStorage for progress
      const existingAnswers = JSON.parse(localStorage.getItem('question_answers') || '[]');
      const progressMap = {};
      
      existingAnswers.forEach(answer => {
        if (answer.examType === examType && 
            answer.subject === subject && 
            answer.chapter === chapterName) {
          progressMap[answer.questionId] = {
            is_correct: answer.isCorrect,
            score: answer.score
          };
        }
      });
      
      setQuestionProgress(progressMap);
      
      // Calculate completion percentage from localStorage
      if (existingAnswers.length > 0 && totalQuestions > 0) {
        const relevantAnswers = existingAnswers.filter(
          a => a.examType === examType && a.subject === subject && a.chapter === chapterName
        );
        
        const attemptedQuestions = relevantAnswers.length;
        const percentage = (attemptedQuestions / totalQuestions) * 100;
        setCompletionPercentage(Math.min(percentage, 100)); // Cap at 100%
      }
    }
  }, [examType, subject, chapterName, isAuthenticated, user?.id, refreshProgressData, getProgress, getCompletionPercentage, totalQuestions]);

  // Memoize the fetchQuestions function to prevent recreating it on every render
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepare filter parameters - only include filters that are explicitly set
      // Start with only the mandatory parameters
      const params = {
        chapterName: chapterName,
        page: currentPage,
        perPage: questionsPerPage // Show 48 questions per page
      };
      
      // Only add type/level filters if they've been explicitly set by the user
      if (filters.type) params.type = filters.type;
      if (filters.level) params.level = filters.level;
      if (filters.minLevel) params.minLevel = filters.minLevel;
      if (filters.maxLevel) params.maxLevel = filters.maxLevel;
      if (filters.search) params.search = filters.search;
      
      // Add subject to the API call
      if (subject) {
        // Special case for WBJEE math which already has the subject in its module name
        if (examType === 'wbjee') {
          params.moduleName = 'WBJEE_MATH';
        } else {
          // For other exam types, construct the module name with the subject
          const modulePrefix = examType === 'jee-adv-booster' ? 'JEE_ADV' : 
                               examType === 'bitsat-prep' ? 'BITSAT' : null;
          
          if (modulePrefix) {
            params.moduleName = `${modulePrefix}_${subject}`;
          }
        }
      }
      
      // Remove null/undefined/empty string values
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      const response = await getExamQuestions(examType, params);

      if (response && response.data) {
        setQuestions(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalQuestions(response.total || 0);
      } else {
        setQuestions([]);
        setTotalPages(1);
        setTotalQuestions(0);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load questions:', err);
      
      if (err.message && err.message.includes('too broad')) {
        setError('Please add more filters to narrow down your search.');
      } else {
        setError(`Failed to load questions: ${err.message || 'Unknown error'}`);
      }
      
      setLoading(false);
    }
  }, [examType, subject, chapterName, currentPage, questionsPerPage, filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Add effect to typeset MathJax when questions load
  useEffect(() => {
    if (questions.length > 0 && window.MathJax) {
      setTimeout(() => {
        try {
          window.MathJax.typeset && window.MathJax.typeset();
        } catch (e) {
          console.error('Error typesetting MathJax:', e);
        }
      }, 100);
    }
  }, [questions]);

  // Handle question click
  const handleQuestionClick = (questionIdentifier) => {
    navigate(`/question/${examType}/${subject}/${chapterName}/${questionIdentifier}`);
  };


  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-green-700/20 text-green-400';
    if (level <= 7) return 'bg-yellow-700/20 text-yellow-400';
    return 'bg-red-700/20 text-red-400';
  };

  // Add effect for document title
  useEffect(() => {
    if (examType) {
      const examTitle = examTypeToTitle[examType] || examType;
      const subjectText = subjectToTitle[subject] || subject;
      // Clean, simple title
      document.title = `${examTitle} ${subjectText} - Questions`;
      
      // Update URL to be cleaner if needed
      if (window.history.replaceState) {
        const cleanUrl = `/questions/${examType}/${subject}/${chapterName}`;
        window.history.replaceState(
          { filters }, 
          document.title, 
          cleanUrl
        );
      }
    }
  }, [examType, subject, chapterName, filters]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading questions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-lg">
            <p className="font-semibold">{error}</p>
            <button 
              onClick={() => navigate(`/chapters/${examType}/${subject}`)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
            >
              Go Back to Chapters
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">{chapterName}</h1>
              <p className="text-muted-foreground">
                {examTitle} • {subjectTitle}
              </p>
            </div>
            <Button onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </div>
          
          {/* Progress bar section */}
          <div className="mt-4 bg-black rounded-lg p-6 border border-neutral-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Your Progress</h2>
              <div className="text-sm text-gray-300">
                {Object.keys(questionProgress).length} of {totalQuestions} questions attempted
              </div>
            </div>
            
            <div className="h-4 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${completionPercentage}%`,
                  backgroundColor: '#F59E0B' // Amber color for progress bar
                }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-3">
              <div className="text-sm font-medium">
                {completionPercentage.toFixed(0)}% complete
              </div>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>{Object.values(questionProgress).filter(p => p.is_correct).length} correct</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>{Object.values(questionProgress).filter(p => !p.is_correct).length} incorrect</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
          <div 
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-800/50 transition-colors"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <h3 className="text-white font-medium">Filters</h3>
            <span className="text-gray-400">
              {filtersExpanded ? '▲' : '▼'}
            </span>
          </div>
          
          {filtersExpanded && (
            <div className="p-4 pt-0 border-t border-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {/* Question Type Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Question Type</label>
              <select 
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || null)}
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
              >
                <option value="">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>{questionTypeLabels[type] || type}</option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Level Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Difficulty Level</label>
              <select 
                value={filters.level || ''}
                onChange={(e) => handleFilterChange('level', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
              >
                <option value="">All Levels</option>
                {availableLevels.map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>
            
            {/* Search Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search</label>
              <input 
                type="text" 
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search questions..."
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
              />
            </div>
              </div>
              
              {/* Reset Filters Button */}
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      type: null,
                      level: null,
                      minLevel: null,
                      maxLevel: null,
                      search: '',
                    });
                    setCurrentPage(1);
                  }}
                  className="bg-neutral-800 border-neutral-700 text-gray-400 hover:text-white hover:bg-neutral-700"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="text-center p-8 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-gray-400">No questions available for this selection.</p>
            <Button 
              onClick={() => navigate(`/chapters/${examType}/${subject}`)}
              className="mt-4"
            >
              Go Back to Chapters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.question_ID}
                question={question}
                index={index}
                getQuestionStatus={getQuestionStatus}
                handleQuestionClick={handleQuestionClick}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-neutral-900 border-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-800"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages} ({totalQuestions} questions)
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-neutral-900 border-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-800"
            >
              Next
            </Button>
          </div>
        )}
        
        {/* For single page of results */}
        {totalPages <= 1 && questions.length > 0 && (
          <div className="flex justify-center items-center mt-8">
            <span className="text-sm text-gray-400">
              Showing {questions.length} questions
            </span>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuestionsListPage;