import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchQuestion, submitAnswer, toggleBookmark, fetchBookmarkedQuestions } from '../store/questionSlice';
import Layout from '../components/Layout';
import QuestionContent from '../components/QuestionContent';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { isQuestionBookmarked } from '../utils/localStorage';
import { getPaperFullTitle } from '../utils/paperData';

const QuestionPage = () => {
  const { subjectName, chapterName, questionNumber } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { modules, chapters, dataSource } = useSelector((state) => state.modules);
  const { currentQuestion, loading, questions, bookmarkedQuestions } = useSelector((state) => state.questions);
  
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [numericalAnswer, setNumericalAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(null); // For partial marking in multiple correct
  const [time, setTime] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  
  // Find module and chapter based on slugs
  const currentModule = modules.find(module => 
    module.title.toLowerCase().replace(/\s+/g, '-') === subjectName
  );
  const currentChapters = chapters[currentModule?.id] || [];
  const currentChapter = currentChapters.find(chapter => 
    chapter.title.toLowerCase().replace(/\s+/g, '-') === chapterName
  );
  
  // Convert question number to index
  const currentIndex = parseInt(questionNumber) - 1;
  
  // Handle keyboard navigation
  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      navigateToQuestion(-1);
    } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
      navigateToQuestion(1);
    }
  };
  
  // Handle bookmark toggle
  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    
    // Prepare minimal question data to store with bookmark
    const questionData = {
      question_id: currentQuestion.question_id,
      question_text: getQuestionText(),
      moduleId: currentModule?.id,
      chapterId: currentChapter?.id,
      moduleName: currentModule?.title,
      chapterName: currentChapter?.title,
      type: getQuestionType()
    };
    
    dispatch(toggleBookmark({ 
      questionId: currentQuestion.question_id, 
      questionData, 
      dataSource 
    }));
  };
  
  useEffect(() => {
    if (currentModule?.id && currentChapter?.id) {
      const questionId = questions[currentIndex]?.question_id;
      if (questionId) {
        console.log('Redux State Debug:', {
          currentQuestion: questions[currentIndex],
          dataSource,
          paperId: questions[currentIndex]?.paper_id,
          questionId,
          fullQuestion: questions[currentIndex],
          questionKeys: questions[currentIndex] ? Object.keys(questions[currentIndex]) : [],
          isPYQ: dataSource === 'PYQ'
        });
        
      dispatch(fetchQuestion({ 
          moduleId: currentModule.id, 
          chapterId: currentChapter.id, 
        questionId 
      }));
        
        if (Object.keys(bookmarkedQuestions).length === 0) {
          dispatch(fetchBookmarkedQuestions());
        }
        
        // Check if the question is bookmarked
        setIsBookmarked(isQuestionBookmarked(questionId, dataSource));
      }
    }
    
    // Reset state when question changes
    setSelectedOptions([]);
    setNumericalAnswer('');
    setShowSolution(false);
    setIsCorrect(null);
    setScore(null);
    setTime(0);
    
    // Start timer
    startTimer();
    
    // Add keyboard event listeners
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      // Clean up
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [dispatch, currentModule?.id, currentChapter?.id, currentIndex, questions, dataSource]);
  
  // Update bookmark status when bookmarkedQuestions changes
  useEffect(() => {
    const questionId = questions[currentIndex]?.question_id;
    if (questionId) {
      setIsBookmarked(!!bookmarkedQuestions[questionId]);
    }
  }, [bookmarkedQuestions, currentIndex, questions]);
  
  // Prevent auto-scrolling issue
  useEffect(() => {
    // Store the current scroll position
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Start the timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTime(0);
    timerRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
      
      // Restore scroll position if it changed unexpectedly
      if (scrollRef.current !== undefined && window.scrollY !== scrollRef.current) {
        window.scrollTo(0, scrollRef.current);
      }
    }, 1000);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Helper function to get question text
  const getQuestionText = () => {
    if (!currentQuestion) return '';
    return currentQuestion.question_text || 
           (currentQuestion.question && currentQuestion.question.text) || 
           '';
  };
  
  // Helper function to get question options
  const getQuestionOptions = () => {
    if (!currentQuestion) return {};
    
    // Get the options array from the question
    const options = currentQuestion.options || [];
    
    // Convert array to object with letter keys (A, B, C, D)
      const optionsObj = {};
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      options.forEach((option, index) => {
      if (index < letters.length) {
        // Use the option text directly since it's a string in the JSON
        optionsObj[letters[index]] = option;
      }
    });
    
        return optionsObj;
  };
  
  // Helper function to get correct answer
  const getCorrectAnswer = () => {
    if (!currentQuestion) return '';
    
    if (currentQuestion.type === 'numerical') {
      return currentQuestion.correct_value || '';
    }
    
    // For multiple choice questions (single or multiple correct)
    const correctOptions = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    currentQuestion.options.forEach((option, index) => {
      if (option.isCorrect && index < letters.length) {
        correctOptions.push(letters[index]);
      }
    });
    
    return currentQuestion.type === 'multipleCorrect' ? correctOptions : correctOptions[0];
  };
  
  // Helper function to get explanation/solution
  const getExplanation = () => {
    if (!currentQuestion) return '';
    return currentQuestion.explanation || 
           currentQuestion.solution_text || 
           (currentQuestion.solution && currentQuestion.solution.text) || 
           '';
  };
  
  // Helper function to get question type
  const getQuestionType = () => {
    if (!currentQuestion) return 'mcq';
    return currentQuestion.type || 'mcq';
  };
  
  const handleOptionSelect = (option) => {
    if (isCorrect !== null) return; // Don't allow changing after submission
    
    const questionType = getQuestionType();
    
    if (questionType === 'multipleCorrect') {
      // For multiple correct questions, toggle the option
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter(opt => opt !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    } else {
      // For single correct questions, just set the option
      setSelectedOptions([option]);
    }
  };
  
  const handleNumericalInputChange = (e) => {
    if (isCorrect !== null) return; // Don't allow changing after submission
    
    // Only allow numbers, decimal point, and minus sign
    const value = e.target.value;
    if (/^-?\d*\.?\d*$/.test(value) || value === '') {
      setNumericalAnswer(value);
    }
  };
  
  const handleSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const questionType = getQuestionType();
    let correct = false;
    let score = 0;
    
    if (questionType === 'numerical') {
      if (!numericalAnswer || isCorrect !== null) return;
      
      const userAnswer = parseFloat(numericalAnswer);
      const correctAnswer = parseFloat(currentQuestion.correct_value);
      const tolerance = 0.001;
      
      correct = Math.abs(userAnswer - correctAnswer) < tolerance;
      score = correct ? 4 : 0;
    } else {
      if (selectedOptions.length === 0 || isCorrect !== null) return;
      
      if (questionType === 'singleCorrect') {
        const correctAnswer = getCorrectAnswer();
        correct = selectedOptions[0] === correctAnswer;
        score = correct ? 4 : -1;
      } else if (questionType === 'multipleCorrect') {
        const correctAnswers = getCorrectAnswer();
        const allCorrect = selectedOptions.length === correctAnswers.length && 
                          selectedOptions.every(opt => correctAnswers.includes(opt));
        const someCorrect = selectedOptions.some(opt => correctAnswers.includes(opt));
        const anyWrong = selectedOptions.some(opt => !correctAnswers.includes(opt));
        
        correct = allCorrect;
        if (allCorrect) score = 4;
        else if (anyWrong) score = -2;
        else if (someCorrect) score = 1;
      }
    }
    
      setIsCorrect(correct);
    setScore(score);
      setShowSolution(true);
      
      dispatch(submitAnswer({
      questionId: currentQuestion.question_id,
      answer: questionType === 'numerical' ? numericalAnswer : selectedOptions,
        isCorrect: correct,
      score
      }));
  };
  
  // Helper function to format option content
  const formatOptionContent = (content) => {
    if (!content) return '';
    
    // Since content is the option object from the JSON, get its text property
    return content.text || '';
  };
  
  // Navigate to the next or previous question
  const navigateToQuestion = (direction) => {
    if (!questions || questions.length === 0) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < questions.length) {
      const subjectSlug = currentModule?.title?.toLowerCase().replace(/\s+/g, '-');
      const chapterSlug = currentChapter?.title?.toLowerCase().replace(/\s+/g, '-');
      navigate(`/${subjectSlug}/${chapterSlug}/${newIndex + 1}`);
    }
  };
  
  // Add logging when currentQuestion changes
  useEffect(() => {
    if (currentQuestion) {
      console.log('Current Question State:', {
        hasQuestion: !!currentQuestion,
        paperId: currentQuestion.paper_id,
        dataSource,
        questionKeys: Object.keys(currentQuestion),
        questionData: currentQuestion,
        isPYQ: dataSource === 'PYQ',
        possiblePaperIdFields: {
          paper_id: currentQuestion.paper_id,
          paperId: currentQuestion.paperId,
          paperID: currentQuestion.paperID,
          paper: currentQuestion.paper
        }
      });
    }
  }, [currentQuestion, dataSource]);
  
  if (!currentModule || !currentChapter) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-2xl font-bold mb-4">Question not found</h1>
          <Button asChild variant="outline">
            <Link to={`/${subjectName}/${chapterName}`}>
              &larr; Back to {currentModule ? currentModule.title : 'Subject'}
            </Link>
          </Button>
      </div>
      </Layout>
    );
  }
  
  // Check if the question is multiple choice
  const isMultipleChoice = getQuestionType() === 'multipleCorrect';
  
  // Get correct answers for display
  const correctAnswers = Array.isArray(getCorrectAnswer()) ? getCorrectAnswer() : [getCorrectAnswer()];
  
  return (
    <Layout>
      <div className="pb-32">
      <div className="mb-8 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="group">
              <Link to={`/${subjectName}/${chapterName}`} className="flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              >
                <path d="m15 18-6-6 6-6"/>
              </svg>
                <span className="hidden sm:inline">Back to {currentChapter?.title || 'Chapter'}</span>
                <span className="sm:hidden">Back</span>
            </Link>
          </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleToggleBookmark()}
              className="ml-2"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isBookmarked ? "currentColor" : "none"}
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500' : ''}`}
              >
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
              </svg>
          </Button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Time:</span>
            <Badge variant="outline" className="bg-secondary/20 text-foreground">
              {formatTime(time)}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Question {currentIndex + 1}</h1>
          <div className="flex items-center space-x-2">
            {currentQuestion && currentQuestion.level && (
              <Badge variant={
                currentQuestion.level === 1 ? "success" : 
                currentQuestion.level === 2 ? "warning" : "error"
              }>
                Level {currentQuestion.level}
              </Badge>
            )}
            <Badge variant="outline">
              {getQuestionType() === 'numerical' ? 'Numerical' : 
               getQuestionType() === 'multipleCorrect' ? 'Multiple Correct' : 
               'Single Correct'}
            </Badge>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : currentQuestion ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Question</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <QuestionContent content={getQuestionText()} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {getQuestionType() === 'numerical' ? 'Enter your answer' : 
                   isMultipleChoice ? 'Select all correct options' : 'Select the correct option'}
                </CardTitle>
                {isMultipleChoice && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Note: Full marks for selecting all correct options only. Partial marks for selecting some correct options. 
                    Negative marks for selecting any incorrect option.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {getQuestionType() === 'numerical' ? (
                  // Numerical input
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={numericalAnswer}
                      onChange={handleNumericalInputChange}
                      disabled={isCorrect !== null}
                      placeholder="Enter your numerical answer"
                      className="input w-full"
                    />
                    {isCorrect !== null && (
                      <div className={`text-sm ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                        {isCorrect ? (
                          'Correct!'
                        ) : (
                          <div className="space-y-1">
                            <div>Incorrect.</div>
                            <div className="font-medium">
                              The correct answer is: <span className="bg-success/10 text-success px-2 py-1 rounded">{getCorrectAnswer()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  // Multiple choice options
                  <div className="space-y-3">
                    {Object.entries(getQuestionOptions()).map(([key, value]) => {
                      const isSelected = selectedOptions.includes(key);
                      const isCorrectAnswer = correctAnswers.includes(key);
                      const showResult = isCorrect !== null;
                      
                      let optionClass = "relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all";
                      
                      if (showResult) {
                        if (isCorrectAnswer) {
                          optionClass += " border-success bg-success/5";
                        } else if (isSelected && !isCorrectAnswer) {
                          optionClass += " border-destructive bg-destructive/5";
                        } else {
                          optionClass += " border-border";
                        }
                      } else if (isSelected) {
                        optionClass += " border-primary bg-primary/5";
                      } else {
                        optionClass += " border-border hover:border-primary hover:bg-primary/5";
                      }
                      
                      return (
                        <div 
                          key={key} 
                          className={optionClass}
                          onClick={() => handleOptionSelect(key)}
                        >
                          <div className="flex-shrink-0">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-${isMultipleChoice ? 'md' : 'full'} border ${
                              isSelected ? 'border-primary bg-primary text-primary-foreground' : 
                              (showResult && isCorrectAnswer) ? 'border-success bg-success text-success-foreground' : 'border-border'
                            }`}>
                              {isMultipleChoice ? (
                                isSelected ? (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                  >
                                    <path 
                                      fillRule="evenodd" 
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                      clipRule="evenodd" 
                                    />
                                  </svg>
                                ) : (showResult && isCorrectAnswer) ? (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor"
                                  >
                                    <path 
                                      fillRule="evenodd" 
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                      clipRule="evenodd" 
                                    />
                                  </svg>
                                ) : null
                              ) : (showResult && isCorrectAnswer) ? (
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4" 
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                >
                                  <path 
                                    fillRule="evenodd" 
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                    clipRule="evenodd" 
                                  />
                                </svg>
                              ) : key}
                            </div>
                          </div>
                          <div className="flex-grow option-content-wrapper overflow-x-auto">
                            <QuestionContent content={formatOptionContent(value)} />
                          </div>
                          {showResult && isCorrectAnswer && (
                            <div className="absolute right-4 top-4 text-success">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="h-5 w-5"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                            </div>
                          )}
                          {showResult && isSelected && !isCorrectAnswer && (
                            <div className="absolute right-4 top-4 text-destructive">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="h-5 w-5"
                              >
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={(getQuestionType() === 'numerical' && !numericalAnswer) || 
                           (getQuestionType() !== 'numerical' && selectedOptions.length === 0) || 
                           isCorrect !== null}
                    className="w-full cursor-pointer"
                >
                  {isCorrect !== null ? 'Submitted' : 'Submit Answer'}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Solution</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                  {isCorrect !== null ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-md ${isCorrect ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      <div className="flex items-center space-x-2">
                        {isCorrect ? (
                          <>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="h-5 w-5"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            <span className="font-medium">Correct Answer!</span>
                          </>
                        ) : (
                          <>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="24" 
                              height="24" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="h-5 w-5"
                            >
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/>
                              <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            <span className="font-medium">Incorrect Answer</span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 text-sm">
                        {isCorrect ? 
                          'Great job! You selected the correct answer.' : 
                          <>
                            <div>The correct answer is:</div>
                            {getQuestionType() === 'numerical' ? (
                              <div className="font-medium mt-1 text-base">{getCorrectAnswer()}</div>
                              ) : getQuestionType() === 'multipleCorrect' ? (
                              <div className="mt-1">
                                  {Array.isArray(getCorrectAnswer()) ? 
                                    getCorrectAnswer().map((option, index) => (
                                  <span key={option} className="inline-block bg-success/10 text-success px-2 py-1 rounded mr-2 mb-1 font-medium">
                                    {option}
                                  </span>
                                    )) : 
                                    <span className="inline-block bg-success/10 text-success px-2 py-1 rounded mr-2 mb-1 font-medium">
                                      {getCorrectAnswer()}
                                    </span>
                                  }
                              </div>
                            ) : (
                                <div className="font-medium mt-1 text-base">
                                  {getCorrectAnswer()}
                                </div>
                            )}
                          </>
                        }
                      </div>
                      {score !== null && (
                        <div className="mt-2 text-sm font-medium">
                          Score: {score > 0 ? `+${score}` : score}
                        </div>
                      )}
                    </div>
                    
                      {showSolution && (
                    <div>
                      <h4 className="font-medium mb-2">Explanation:</h4>
                      <QuestionContent content={getExplanation()} />
                    </div>
                      )}
                  </div>
                ) : (
                  <div className="bg-secondary/20 p-4 rounded-md text-center text-muted-foreground">
                    Submit your answer to see the solution.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
    </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Question not found.</p>
          </CardContent>
        </Card>
      )}

        {/* Fixed Navigation Panel */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-50">
          <div className="container max-w-4xl mx-auto">
            <div className="flex justify-between items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigateToQuestion(-1)}
                disabled={currentIndex <= 0}
                className="flex-1 sm:flex-none sm:w-[150px] h-[45px] text-base sm:text-lg flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-5 w-5 sm:h-6 sm:w-6"
                >
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <div className="text-center flex-shrink-0">
                <span className="text-xs sm:text-sm text-muted-foreground">Question</span>
                <h2 className="text-lg sm:text-xl font-bold">{currentIndex + 1} of {questions.length}</h2>
              </div>

              <Button 
                variant="outline" 
                onClick={() => navigateToQuestion(1)}
                disabled={currentIndex >= questions.length - 1}
                className="flex-1 sm:flex-none sm:w-[150px] h-[45px] text-base sm:text-lg flex items-center justify-center space-x-1 sm:space-x-2 cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-5 w-5 sm:h-6 sm:w-6"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuestionPage; 