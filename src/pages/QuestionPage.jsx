import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import MathJaxComponent, { MathJaxBatch } from '../components/common/MathJax';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getQuestionById, getExamQuestions } from '../services/grafiteApi';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import FeedbackAnimations from '../components/common/FeedbackAnimations';
import '../styles/QuestionPage.css';

// Map exam types to display titles
const examTypeToTitle = {
  'jee-main': 'JEE Mains',
  'jee-advanced': 'JEE Advanced',
  'neet': 'NEET',
  'bitsat': 'BITSAT',
  'wbjee': 'WBJEE',
  'kcet': 'KCET',
  'mhtcet': 'MHT CET',
  'viteee': 'VITEEE',
  'srmjeee': 'SRMJEEE',
  'comedk': 'COMEDK',
  'ap-eamcet': 'AP EAMCET',
  'ts-eamcet': 'TS EAMCET',
  'gate': 'GATE',
  'cat': 'CAT',
  'upsc': 'UPSC',
  'gre': 'GRE',
  'gmat': 'GMAT',
  'ielts': 'IELTS',
  'toefl': 'TOEFL',
  'sat': 'SAT',
  'act': 'ACT'
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

const QuestionPage = () => {
  const { examType, subject, chapterName, questionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { recordUserProgress, getProgress, refreshProgressData } = useProgress();
  const reduxUser = useSelector(state => state.auth.user);
  const supabaseUserId = reduxUser?.supabaseUserId;

  // Question and answer state
  const [question, setQuestion] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [numericalAnswer, setNumericalAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  
  // UI state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Navigation state
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Page state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  
  // Timer ref
  const timerRef = useRef(null);
  
  // Add MathJax loading state
  const [mathJaxLoading, setMathJaxLoading] = useState(true);

  // Add streak tracking
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  // Create a memoized array of expressions for batch rendering
  const mathExpressions = useMemo(() => {
    if (!question) return [];
    
    const expressions = [
      { id: 'question', content: question.text, displayMode: true }
    ];
    
    // Add options if they exist
    if (question.options) {
      question.options.forEach((opt, index) => {
        expressions.push({
          id: `option-${index}`,
          content: opt.text,
          displayMode: false
        });
      });
    }
    
    // Add solution if showing
    if (showSolution && question.solution) {
      expressions.push({
        id: 'solution',
        content: question.solution,
        displayMode: true
      });
    }
    
    return expressions;
  }, [question, showSolution]);

  // Add loading spinner component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  // Helper function to get background color based on question level
  const getQuestionCardBgColor = (level) => {
    if (!level) return 'bg-neutral-900 border border-neutral-800';
    
    if (level <= 3) return 'bg-emerald-900/20 border border-emerald-800/50';
    if (level <= 7) return 'bg-amber-900/20 border border-amber-800/50';
    return 'bg-rose-900/20 border border-rose-800/50';
  };
  
  // Helper function to get color scheme based on question level
  const getLevelColor = (level) => {
    if (!level) return 'text-gray-400 border-neutral-800 bg-neutral-900';
    
    if (level <= 3) return 'text-emerald-500 border-emerald-800 bg-emerald-900/20';
    if (level <= 7) return 'text-amber-500 border-amber-800 bg-amber-900/20';
    return 'text-rose-500 border-rose-800 bg-rose-900/20';
  };
  
  // Helper function to determine level badge text
  const getLevelText = (level) => {
    if (!level) return 'Unknown';
    
    if (level <= 3) return 'Easy';
    if (level <= 7) return 'Medium';
    return 'Hard';
  };

  // Format time in mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch all questions for the current chapter for navigation
  const fetchAllQuestions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepare filter parameters
      const params = {
        chapterName: chapterName
      };
      
      // Add subject to the API call
      if (subject) {
        const modulePrefix = examType === 'jee-adv-booster' ? 'JEE_ADV' : 
                            examType === 'bitsat-prep' ? 'BITSAT' : null;
        
        if (modulePrefix) {
          params.moduleName = `${modulePrefix}_${subject}`;
        }
      }
      
      const response = await getExamQuestions(examType, params);
      
      if (response && response.data && response.data.length > 0) {
        setAllQuestions(response.data);
        setTotalQuestions(response.data.length);
        
        // Find the index of the current question
        const index = response.data.findIndex(q => q.question_ID.toString() === questionId);
        
        if (index !== -1) {
          setCurrentIndex(index);
        } else {
          // If question not found in the list, default to the first one
          const firstQuestionId = response.data[0].question_ID;
          navigate(`/question/${examType}/${subject}/${chapterName}/${firstQuestionId}`, { replace: true });
        }
      } else {
        setError('No questions available for this chapter.');
      }
    } catch (err) {
      console.error('Error fetching questions list:', err);
      setError(`Failed to load questions: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [examType, subject, chapterName, questionId, navigate]);

  // Set titles and fetch questions list
  useEffect(() => {
    // Set titles based on exam type and subject
    setExamTitle(examTypeToTitle[examType] || examType);
    setSubjectTitle(subjectToTitle[subject] || subject);
    
    // Fetch all questions for navigation
    fetchAllQuestions();
    
    // Set up keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        navigateQuestion(-1);
      } else if (e.key === 'ArrowRight') {
        navigateQuestion(1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examType, subject, chapterName, fetchAllQuestions]);

  // Set document title
  useEffect(() => {
    if (examType && question) {
      // Create a cleaner title without IDs or technical details
      const examTitle = examTypeToTitle[examType] || examType;
      const subjectText = subjectToTitle[subject] || subject;
      const chapterTitle = chapterName || '';
      const questionNumber = currentIndex + 1;
      
      // Clean and simple title format
      document.title = `${examTitle} ${subjectText} - Question ${questionNumber}`;
      
      // Clean URL without question ID
      if (window.history.replaceState) {
        const cleanUrl = `/question/${examType}/${subject}/${chapterName}/`;
        window.history.replaceState(
          { questionId: question.id }, 
          document.title, 
          cleanUrl
        );
      }
    }
  }, [examType, subject, chapterName, question, currentIndex]);

  // Fetch the current question details
  const fetchQuestionDetails = useCallback(async (qId) => {
    try {
      setLoading(true);
      
      if (!qId) {
        setError('Question ID is required');
        setLoading(false);
        return;
      }
      
      const data = await getQuestionById(qId);
      
      if (!data) {
        setError('Question not found');
        setLoading(false);
        return;
      }
      
      // Format options for display
      const formattedOptions = data.options 
        ? data.options.map((opt, idx) => ({
            id: String(idx + 1),
            text: opt
          }))
        : [];
      
      const formattedQuestion = {
        id: data.question_ID,
        text: data.question,
        options: formattedOptions,
        correctOptions: data.correct_options
          ? Array.isArray(data.correct_options)
            ? data.correct_options.map(index => String(index + 1)) // Convert to 1-based IDs
            : [String(Number(data.correct_options) + 1)]
          : [],
        type: data.type || 'singleCorrect',
        level: data.level,
        module: data.module_name,
        chapter: data.chapter_name,
        tags: data.tags || [],
        image: data.image,
        solution: data.solution || data.explanation || '',
        correctValue: data.correct_value
      };
      
      setQuestion(formattedQuestion);
      
      // Check if this question has been answered before
      const savedAnswer = localStorage.getItem(`answer_${qId}`);
      if (savedAnswer && false) { // Disable loading previous answers to allow multiple attempts
        try {
          const answerData = JSON.parse(savedAnswer);
          
          if (formattedQuestion.type === 'numerical') {
            setNumericalAnswer(answerData.answer || '');
          } else {
            setSelectedOptions(Array.isArray(answerData.answer) ? answerData.answer : []);
          }
          
          if (answerData.isCorrect !== undefined) {
            setIsCorrect(answerData.isCorrect);
            setIsAnswered(true);
            setShowSolution(true);
          }
          
          if (answerData.score !== undefined) {
            setScore(answerData.score);
          }
        } catch (e) {
          console.error('Error parsing saved answer:', e);
        }
      } else {
        // Reset answer state for new question
        setSelectedOptions([]);
        setNumericalAnswer('');
        setIsAnswered(false);
        setIsCorrect(false);
        setScore(0);
        setShowSolution(false);
      }
      
      // Check if bookmarked
      setIsBookmarked(localStorage.getItem(`bookmark_${qId}`) === 'true');
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      
      if (error.message && error.message.includes('not found')) {
        setError('Question not found. It may have been removed or the ID is invalid.');
      } else {
        setError(`Failed to load question: ${error.message || 'Unknown error'}`);
      }
    }
  }, []);

  // Fetch user progress for the current question
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (isAuthenticated && user && question) {
        try {
          // Use the cached progress data
          const progress = await getProgress(examType, subject, chapterName);
          const questionProgress = progress.find(p => p.question_id === question.id);
          
          // Disabled to allow multiple attempts
          // if (questionProgress) {
          //   setIsAnswered(true);
          //   setIsCorrect(questionProgress.is_correct);
          //   setScore(questionProgress.score);
          //   setShowSolution(true);
          // }
        } catch (error) {
          console.error('Error fetching user progress:', error);
        }
      }
    };
    
    // Only fetch progress if we have a question and user is authenticated
    if (question && isAuthenticated && user) {
      fetchUserProgress();
    }
    
    // Only run this effect when the question ID changes
  }, [question?.id, isAuthenticated, user?.id]);

  // Load question details when questionId changes
  useEffect(() => {
    if (questionId) {
      fetchQuestionDetails(questionId);
      
      // Reset state for new question
      setSelectedOptions([]);
      setNumericalAnswer('');
      setIsAnswered(false);
      setIsCorrect(false);
      setScore(0);
      setShowSolution(false);
      setTimeElapsed(0);
      
      // Start timer for the new question
      startTimer();
    }
    
    return () => {
      // Clear timer when component unmounts or question changes
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [questionId, fetchQuestionDetails]);

  // Start timer for tracking time spent on question
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };
  
  // Start timer when question loads
  useEffect(() => {
    if (question && !isAnswered) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [question, isAnswered]);

  // Handle option selection for multiple choice questions
  const handleOptionSelect = (optionId) => {
    if (isAnswered) return;
    
    if (question.type === 'singleCorrect') {
      setSelectedOptions([optionId]);
    } else if (question.type === 'multipleCorrect') {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    }
  };

  // Handle numerical answer input
  const handleNumericalInput = (e) => {
    if (isAnswered) return;
    
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === '') {
      setNumericalAnswer(value);
    }
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!question) return;
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    let correct = false;
    let partialScore = 0;
    
    if (question.type === 'numerical' || question.type === 'integer') {
      // Skip if no answer or already answered
      if (!numericalAnswer) return;
      
      const userAnswer = parseFloat(numericalAnswer);
      const correctAnswer = parseFloat(question.correctValue);
      
      // Use more precise tolerance calculation based on the magnitude of the correct answer
      const tolerance = Math.max(0.001, Math.abs(correctAnswer * 0.001)); // 0.1% tolerance or minimum 0.001
      
      correct = Math.abs(userAnswer - correctAnswer) <= tolerance;
      partialScore = correct ? 4 : 0;
    } else {
      // Skip if no options selected
      if (selectedOptions.length === 0) return;
      
      if (question.type === 'singleCorrect') {
        // For single correct questions
        correct = question.correctOptions.includes(selectedOptions[0]);
        partialScore = correct ? 4 : -1;
      } else if (question.type === 'multipleCorrect') {
        // For multiple correct questions
        const correctAnswers = question.correctOptions;
        
        // Calculate how many options user got correct
        const correctlySelected = selectedOptions.filter(opt => correctAnswers.includes(opt));
        const wronglySelected = selectedOptions.filter(opt => !correctAnswers.includes(opt));
        
        // Check various scenarios
        const allCorrect = correctlySelected.length === correctAnswers.length && wronglySelected.length === 0;
        const someCorrect = correctlySelected.length > 0;
        const anyWrong = wronglySelected.length > 0;
        
        correct = allCorrect;
        
        // Enhanced scoring logic for multiple correct questions
        if (allCorrect) {
          partialScore = 4; // Full marks for all correct
        } else if (anyWrong) {
          partialScore = -2; // Penalty for any wrong selection
        } else if (someCorrect) {
          // Partial marking based on fraction of correct options selected
          const fraction = correctlySelected.length / correctAnswers.length;
          
          if (fraction > 0.75) {
            partialScore = 3;
          } else if (fraction > 0.5) {
            partialScore = 2;
          } else {
            partialScore = 1;
          }
        } else {
          partialScore = 0;
        }
      }
    }
    
    setIsCorrect(correct);
    setScore(partialScore); // Still track score internally for database, but don't display
    setIsAnswered(true);
    setShowSolution(true);
    
    // Update streaks
    if (correct) {
      setCorrectStreak(prev => prev + 1);
      setWrongStreak(0); // Reset wrong streak on correct answer
    } else {
      setWrongStreak(prev => prev + 1);
      setCorrectStreak(0); // Reset correct streak on wrong answer
    }
    
    // Save answer to local storage with enhanced metadata
    const answerData = {
      questionId: question.id,
      examType,
      subject,
      chapter: chapterName,
      answer: question.type === 'numerical' ? numericalAnswer : selectedOptions,
      isCorrect: correct,
      score: partialScore,
      timeSpent: timeElapsed,
      questionType: question.type,
      timestamp: new Date().toISOString(),
      questionLevel: question.level || 1,
      correctAnswer: question.type === 'numerical' ? question.correctValue : question.correctOptions
    };
    
    // Save to localStorage for offline access
    localStorage.setItem(`answer_${questionId}`, JSON.stringify(answerData));
    
    // Get existing answers or initialize empty array for analytics
    const existingAnswers = JSON.parse(localStorage.getItem('question_answers') || '[]');
    
    // Limit the size of stored answers to prevent localStorage overflow
    // Keep most recent 1000 answers
    if (existingAnswers.length >= 1000) {
      existingAnswers.shift(); // Remove oldest answer
    }
    
    existingAnswers.push(answerData);
    localStorage.setItem('question_answers', JSON.stringify(existingAnswers));
    
    // If user is authenticated, record progress in Supabase
    if (isAuthenticated && user) {
      try {
        // Get the Supabase user ID
        const supabaseUserId = user.supabaseUserId || 
          localStorage.getItem(`supabase_uid_${user.uid}`);
        
        if (!supabaseUserId) {
          console.error('No Supabase user ID found for recording question progress');
          throw new Error('User ID not found. Please log out and log in again.');
        }
        
        console.log('Recording question progress with Supabase ID:', supabaseUserId);
        
        await recordUserProgress({
          questionId: question.id,
          examType,
          subject,
          chapter: chapterName,
          isCorrect: correct,
          score: partialScore,
          timeSpent: timeElapsed,
          attemptCount: 1
        });
        
        // Force refresh progress data after recording new progress
        await refreshProgressData();
        
        // Re-fetch progress for this specific question to update the UI
        const updatedProgress = await getProgress(examType, subject, chapterName);
        const updatedQuestionProgress = updatedProgress.find(p => p.question_id === question.id);
        
        if (updatedQuestionProgress) {
          setIsCorrect(updatedQuestionProgress.is_correct);
          setScore(updatedQuestionProgress.score); // Still update internal score, but don't display
        }
      } catch (error) {
        console.error('Error recording progress to Supabase:', error);
        // Add fallback for error cases - the answer is already saved locally
      }
    }
  };

  // Function to reset streaks
  const resetStreaks = useCallback(() => {
    setCorrectStreak(0);
    setWrongStreak(0);
  }, []);

  // Handle showing solution without submitting
  const handleShowSolution = () => {
    setShowSolution(true);
  };

  // Check if question is bookmarked
  useEffect(() => {
    if (question && question.id) {
      // Get bookmarks from localStorage
      const bookmarkedQuestions = JSON.parse(localStorage.getItem('grafite_bookmarked_questions') || '{}');
      const userBookmarks = bookmarkedQuestions[supabaseUserId] || [];
      const isMarked = userBookmarks.some(bookmark => bookmark.id === question.id);
      setIsBookmarked(isMarked);
    }
  }, [question, supabaseUserId]);

  // Toggle bookmark status
  const handleBookmarkToggle = () => {
    if (!question || !supabaseUserId) return;
    
    // Get current bookmarks
    const bookmarkedQuestions = JSON.parse(localStorage.getItem('grafite_bookmarked_questions') || '{}');
    const userBookmarks = bookmarkedQuestions[supabaseUserId] || [];
    
    if (isBookmarked) {
      // Remove bookmark
      const updatedUserBookmarks = userBookmarks.filter(bookmark => bookmark.id !== question.id);
      bookmarkedQuestions[supabaseUserId] = updatedUserBookmarks;
      localStorage.setItem('grafite_bookmarked_questions', JSON.stringify(bookmarkedQuestions));
      setIsBookmarked(false);
    } else {
      // Add bookmark with metadata
      const newBookmark = {
        id: question.id,
        question_text: question.text.substring(0, 100) + (question.text.length > 100 ? '...' : ''),
        moduleName: subject,
        chapterName: chapterName,
        timestamp: new Date().toISOString(),
        difficulty: question.level || 1,
        type: question.type,
        hasImage: !!question.image
      };
      
      bookmarkedQuestions[supabaseUserId] = [...userBookmarks, newBookmark];
      localStorage.setItem('grafite_bookmarked_questions', JSON.stringify(bookmarkedQuestions));
      setIsBookmarked(true);
    }
  };

  // Navigate to next or previous question
  const navigateQuestion = (direction) => {
    if (allQuestions.length === 0) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < allQuestions.length) {
      const targetQuestion = allQuestions[newIndex];
      navigate(`/question/${examType}/${subject}/${chapterName}/${targetQuestion.question_ID}`);
    }
  };

  // Get color class for question type badge
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

  // State for image zoom functionality
  const [zoomImage, setZoomImage] = useState(null);

  // Add ImageZoom component for better image viewing
  const ImageZoom = ({ src, alt, onClose }) => {
    useEffect(() => {
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, []);

    return (
      <div 
        className="zoom-overlay" 
        onClick={onClose}
      >
        <div className="zoom-close" onClick={onClose}>✕</div>
        <img 
          src={src} 
          alt={alt} 
          className="zoom-image" 
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  // Enhanced image component with error handling and zoom
  const EnhancedImage = ({ src, alt, className, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    return (
      <div className={`image-wrapper ${!imageLoaded ? 'loading' : ''}`}>
        {!imageLoaded && !imageError && <div className="image-loading-placeholder"></div>}
        <img 
          src={src} 
          alt={alt} 
          className={`${className} ${imageError ? 'error' : ''}`}
          onClick={onClick}
          onError={(e) => {
            console.error(`Failed to load image: ${src}`);
            e.target.src = "/images/placeholder.png";
            setImageError(true);
            setImageLoaded(true);
          }}
          onLoad={() => setImageLoaded(true)}
          style={{ display: imageLoaded ? 'inline-block' : 'none' }}
        />
      </div>
    );
  };

  // Update VirtualizedOptions for direct rendering
  const VirtualizedOptions = React.memo(({ options, handleOptionSelect, selectedOptions, showSolution, question }) => {
    // Add useEffect for MathJax typesetting
    useEffect(() => {
      if (window.MathJax) {
        setTimeout(() => {
          try {
            window.MathJax.typeset();
            console.log('Options MathJax typeset completed');
          } catch (e) {
            console.error('Error in options MathJax typesetting:', e);
          }
        }, 100);
      }
    }, [options]); // Re-run when options change

    return (
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOptions.includes(opt.id);
          const isCorrect = showSolution && question.correctOptions.includes(opt.id);
          const isWrong = showSolution && isSelected && !question.correctOptions.includes(opt.id);
          
          return (
            <div
              key={opt.id}
              className={`option-container flex items-start p-4 rounded-lg border cursor-pointer transition-all w-full
                ${isCorrect ? 'border-green-500 bg-green-900/20' : 
                  isWrong ? 'border-red-500 bg-red-900/20' : 
                  isSelected ? 'border-primary bg-primary/10' : 
                  'border-neutral-700 hover:border-primary/50 hover:bg-neutral-800/50'}`}
              onClick={() => !showSolution && handleOptionSelect(opt.id)}
              data-testid={`option-${opt.id}`}
            >
              <div className={`h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full border mr-3
                ${isCorrect ? 'border-green-500 bg-green-500 text-black' :
                  isWrong ? 'border-red-500 bg-red-500 text-black' :
                  isSelected ? 'border-primary bg-primary text-black' :
                  'border-gray-600 text-gray-400'}`}
              >
                {isCorrect && showSolution ? '✓' : isWrong && showSolution ? '✗' : String.fromCharCode(65 + Number(opt.id))}
              </div>
              <div
                className={`text-gray-300 option-text flex-1 break-words whitespace-normal ${isCorrect ? 'border-2 border-green-500 rounded p-1' : isWrong ? 'border-2 border-red-500 rounded p-1' : ''}`}
                data-testid={`option-text-${opt.id}`}
                dangerouslySetInnerHTML={{ __html: opt.text }}
              />
            </div>
          );
        })}
      </div>
    );
  });

  // Force MathJax typesetting after component renders
  useEffect(() => {
    if (window.MathJax) {
      const timer = setTimeout(() => {
        try {
          window.MathJax.typeset();
          console.log('Question page MathJax typeset completed');
          
          // Fix inline math styling issues
          const fixInlineMath = () => {
            // Find all MathJax elements
            const mathElements = document.querySelectorAll('.MathJax, .mjx-chtml');
            mathElements.forEach(element => {
              // Check if this is inline math (not display math)
              if (!element.parentElement.className.includes('Display') && 
                  !element.className.includes('Display')) {
                // Fix inline rendering
                element.style.display = 'inline';
                
                // If the element is followed by text, ensure no line break
                const next = element.nextSibling;
                if (next && next.nodeType === Node.TEXT_NODE) {
                  const parent = element.parentElement;
                  if (parent && !parent.style.display) {
                    parent.style.display = 'inline';
                  }
                }
              }
            });
          };
          
          // Run the fix after MathJax typesetting
          fixInlineMath();
          
          // Apply again after a short delay to catch any delayed rendering
          setTimeout(fixInlineMath, 100);
        } catch (e) {
          console.error('Error typesetting MathJax:', e);
        }
      }, 200); // Increased delay to ensure content is ready
      
      return () => clearTimeout(timer);
    }
  }, [question, showSolution, selectedOptions]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading question...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-lg">
            <p className="font-semibold">{error}</p>
            <button 
              onClick={() => navigate(`/questions/${examType}/${subject}/${chapterName}`)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
            >
              Go Back to Questions
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // No question found state
  if (!question) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-lg">
            <p className="font-semibold">Question not found</p>
            <button 
              onClick={() => navigate(`/questions/${examType}/${subject}/${chapterName}`)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
            >
              Go Back to Questions
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/questions/${examType}/${subject}/${chapterName}`)}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getLevelColor(question.level)}>
              {getLevelText(question.level)}
            </Badge>
            <Badge variant="outline" className={getQuestionTypeColor(question.type)}>
              {questionTypeLabels[question.type] || question.type}
            </Badge>
            <Badge variant="outline" className="bg-neutral-800 text-gray-400">
              {formatTime(timeElapsed)}
            </Badge>
          </div>
        </div>

        {/* Subject and Exam Info */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-semibold text-white">{subjectTitle}</h2>
          <p className="text-sm text-gray-400">{examTitle}</p>
          <p className="text-sm text-gray-500 mt-1">
            Question {currentIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Question Card */}
        <Card className={`mb-6 p-6 ${getQuestionCardBgColor(question.level)} rounded-lg shadow-lg`}>
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-lg text-white flex items-center">
              Question {currentIndex + 1}
              {question.isFlagged && 
                <span className="ml-2 text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.109-.732a.75.75 0 01.917.81 47.784 47.784 0 00.005 10.337.75.75 0 01-.574.812l-3.114.733a9.75 9.75 0 01-6.594-.77l-.108-.054a8.25 8.25 0 00-5.69-.625l-2.202.55V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" />
                  </svg>
                </span>
              }
            </h2>
            <div className="flex space-x-2 items-center">
              <button 
                onClick={handleBookmarkToggle}
                className="text-gray-400 hover:text-amber-500 transition-colors"
                title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
              >
                {isBookmarked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-500">
                    <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                )}
              </button>
              {question.tags && question.tags.length > 0 && question.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="bg-neutral-800 text-gray-400">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-gray-300">
            {/* Question Text - render directly without MathContent component */}
            <div 
              className="text-white mb-4" 
              data-testid="question-text"
              dangerouslySetInnerHTML={{ __html: question.text }}
            />
            {question.image && (
              <div className="image-container">
                <EnhancedImage 
                  src={question.image} 
                  alt="Question"
                  className="question-image"
                  onClick={() => setZoomImage(question.image)}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Answer Options */}
        {(question.type === 'singleCorrect' || question.type === 'multipleCorrect') && (
          <Card className="mb-6 p-6 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg">
            <h3 className="font-semibold text-md text-white mb-4">
              {question.type === 'singleCorrect' ? 'Select the correct option:' : 'Select all correct options:'}
            </h3>
            <VirtualizedOptions
              options={question.options}
              handleOptionSelect={handleOptionSelect}
              selectedOptions={selectedOptions}
              showSolution={showSolution}
              question={question}
            />
            
            {showSolution && question.type === 'multipleCorrect' && (
              <div className="mt-4 p-3 rounded-lg bg-neutral-800/50">
                <p className={`font-medium ${isCorrect 
                  ? 'text-emerald-500' 
                  : 'text-rose-500'}`}>
                  {isCorrect 
                    ? '✓ Fully Correct: All correct options selected' 
                    : '✗ Incorrect: Your selection was not fully correct'}
                </p>
                
                <div className="mt-2 text-xs text-gray-400">
                  <p>Multiple correct questions require all correct options to be selected and no incorrect options.</p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Numerical Input */}
        {question.type === 'numerical' && (
          <Card className="mb-6 p-6 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Enter your answer:</h3>
              <div className={`p-4 rounded-lg border ${
                showSolution 
                  ? isCorrect 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-red-500 bg-red-900/20'
                  : 'border-neutral-700'
              }`}>
                <input
                  type="text"
                  value={numericalAnswer}
                  onChange={handleNumericalInput}
                  disabled={isAnswered}
                  placeholder="Enter numerical value..."
                  className="w-full bg-transparent border-none focus:outline-none text-white"
                  onKeyDown={(e) => {
                    // Submit on Enter key
                    if (e.key === 'Enter' && !isAnswered && numericalAnswer) {
                      handleSubmit();
                    }
                  }}
                />
              </div>
              
              {showSolution && (
                <div className="p-3 rounded-lg bg-neutral-800/50">
                  <p className="text-gray-300">
                    Correct answer: <span className="text-green-400 font-semibold">{question.correctValue}</span>
                  </p>
                  {!isCorrect && (
                    <p className="text-gray-400 text-sm mt-1">
                      Your answer <span className="text-rose-400">{numericalAnswer}</span> was incorrect. (Tolerance: ±{Math.max(0.001, Math.abs(parseFloat(question.correctValue) * 0.001)).toFixed(5)})
                    </p>
                  )}
                  <p className={`mt-2 font-medium ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Solution Section */}
        {showSolution && (
          <Card className="mb-6 p-6 bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg transition-all animate-fade-in">
            <div className="flex items-center mb-4">
              <h3 className="font-bold text-xl text-white">Solution</h3>
              <div className={`ml-2 px-3 py-1 rounded text-xs font-medium ${
                isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {isCorrect ? 'CORRECT' : 'INCORRECT'}
              </div>
            </div>
            <div className="text-gray-300 solution-container">
              {/* Solution content with improved styling */}
              <div className="solution-content">
                <div 
                  className="solution-text"
                  dangerouslySetInnerHTML={{ __html: question.solution }}
                />
              </div>
              
              {/* Enhanced MathJax styling for better solution display */}
              <style>
                {`
                  .solution-content img {
                    max-width: 100%;
                    height: auto !important;
                    margin: 1.5rem auto;
                    display: block;
                    object-fit: contain;
                  }
                  .solution-text {
                    font-size: 1.15rem;
                    line-height: 1.8;
                    color: white;
                  }
                  .solution-content .MathJax {
                    max-width: 100%;
                    overflow-x: auto;
                    display: inline-block !important;
                    margin: 0.25rem 0 !important;
                  }
                  .solution-content .MathJax_Display {
                    margin: 1.25rem 0 !important;
                    max-width: 100% !important;
                    overflow-x: auto !important;
                    padding: 0.5rem 0 !important;
                    background-color: rgba(30, 30, 35, 0.3) !important;
                    border-radius: 0.375rem !important;
                  }
                `}
              </style>
              
              {/* Additional solution hints or links */}
              {question.relatedLinks && question.relatedLinks.length > 0 && (
                <div className="mt-6 border-t border-neutral-800 pt-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Related Resources:</h4>
                  <ul className="space-y-1">
                    {question.relatedLinks.map((link, index) => (
                      <li key={index}>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {link.title || 'Resource ' + (index + 1)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Feedback Animations */}
        <FeedbackAnimations 
          correctStreak={correctStreak}
          wrongStreak={wrongStreak}
          resetStreaks={resetStreaks}
          animationDuration={3000}
        />

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 border-t p-4" 
          style={{
            background: 'rgba(23, 23, 26, 0.9)',
            backdropFilter: 'blur(8px)',
            borderColor: question && getLevelColor(question.level).split(' ')[2] || 'border-neutral-800'
          }}>
          <div className="container mx-auto flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigateQuestion(-1)}
              disabled={currentIndex === 0}
              className="bg-neutral-900/80 border-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </Button>
            
            <div className="flex gap-2">
              {!isAnswered ? (
                <Button
                  onClick={handleSubmit}
                  className={`text-white hover:opacity-90 ${question ? 
                    question.level <= 3 ? 'bg-emerald-600 hover:bg-emerald-700' : 
                    question.level <= 7 ? 'bg-amber-600 hover:bg-amber-700' : 
                    'bg-rose-600 hover:bg-rose-700'
                    : 'bg-primary hover:bg-primary/80'}`}
                  disabled={
                    (question.type === 'numerical' && !numericalAnswer) ||
                    ((question.type === 'singleCorrect' || question.type === 'multipleCorrect') && selectedOptions.length === 0)
                  }
                >
                  Submit Answer
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded font-medium ${
                    isCorrect 
                      ? "bg-emerald-600 text-white" 
                      : "bg-rose-600 text-white" 
                  }`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigateQuestion(1)}
              disabled={currentIndex === totalQuestions - 1}
              className="bg-neutral-900/80 border-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-800"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      {/* Image Zoom Modal */}
      {zoomImage && (
        <ImageZoom 
          src={zoomImage}
          alt="Zoomed Image"
          onClose={() => setZoomImage(null)}
        />
      )}
    </Layout>
  );
};

export default QuestionPage;


