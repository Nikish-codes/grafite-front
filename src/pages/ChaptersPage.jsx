import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { getChapters, checkApiHealth } from '../services/grafiteApi';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

// Map exam types to their corresponding module names in the API
const examTypeToModuleName = {
  'jee-adv-booster': 'JEE_ADV',
  'bitsat-prep': 'BITSAT',
  'wbjee': 'WBJEE',
  'mains-2025': 'Mains_2025'
  
};

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

const ChaptersPage = () => {
  const { examType, subject } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [apiStatus, setApiStatus] = useState(null);

  // Check API health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkApiHealth();
        setApiStatus(health.status === 'healthy' ? 'online' : 'issues');
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus('offline');
      }
    };

    checkHealth();
  }, []);

  useEffect(() => {
    // Set titles based on exam type and subject
    setExamTitle(examTypeToTitle[examType] || examType);
    setSubjectTitle(subjectToTitle[subject] || subject);
    
    const fetchChapters = async () => {
      try {
        setLoading(true);
        
        // Construct the full module name using exam type and subject
        const modulePrefix = examTypeToModuleName[examType];
        
        if (!modulePrefix) {
          setError(`Exam type "${examType}" not supported yet`);
          setLoading(false);
          return;
        }
        
        // Special case for WBJEE - we only support MATH subject currently
        let moduleName;
        if (examType === 'wbjee') {
          if (subject !== 'MATH') {
            setError(`WBJEE ${subjectTitle} content is coming soon. Currently only Mathematics is available.`);
            setLoading(false);
            return;
          }
          moduleName = 'WBJEE_MATH';
        } else {
          moduleName = `${modulePrefix}_${subject}`;
        }
        
        const data = await getChapters(moduleName);
        
        if (Array.isArray(data)) {
          const formattedChapters = data.map((chapter, index) => ({
            id: index + 1,
            name: chapter,
            hasTopics: false, // For now, we're not using topics
          }));
          setChapters(formattedChapters);
        } else {
          // If no chapters found, create some mock chapters
          const mockChapters = [
            { id: 1, name: 'Mechanics', hasTopics: false },
            { id: 2, name: 'Thermodynamics', hasTopics: false },
            { id: 3, name: 'Electromagnetism', hasTopics: false },
            { id: 4, name: 'Optics', hasTopics: false },
            { id: 5, name: 'Modern Physics', hasTopics: false },
          ];
          
          if (subject === 'CHEM') {
            mockChapters[0] = { id: 1, name: 'Atomic Structure', hasTopics: false };
            mockChapters[1] = { id: 2, name: 'Chemical Bonding', hasTopics: false };
            mockChapters[2] = { id: 3, name: 'Organic Chemistry', hasTopics: false };
            mockChapters[3] = { id: 4, name: 'Inorganic Chemistry', hasTopics: false };
            mockChapters[4] = { id: 5, name: 'Physical Chemistry', hasTopics: false };
          } else if (subject === 'MATH') {
            mockChapters[0] = { id: 1, name: 'Calculus', hasTopics: false };
            mockChapters[1] = { id: 2, name: 'Algebra', hasTopics: false };
            mockChapters[2] = { id: 3, name: 'Trigonometry', hasTopics: false };
            mockChapters[3] = { id: 4, name: 'Coordinate Geometry', hasTopics: false };
            mockChapters[4] = { id: 5, name: 'Statistics', hasTopics: false };
          }
          
          setChapters(mockChapters);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError(`Failed to load chapters: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    if (apiStatus === 'online' || apiStatus === 'issues') {
      fetchChapters();
    } else if (apiStatus === 'offline') {
      setError('API is currently offline. Please try again later.');
      setLoading(false);
    }
  }, [examType, subject, apiStatus]);

  const handleChapterClick = (chapter) => {
    if (chapter.hasTopics) {
      navigate(`/topics/${examType}/${subject}/${chapter.name}`);
    } else {
      navigate(`/questions/${examType}/${subject}/${chapter.name}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading chapters...</p>
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
              onClick={() => navigate(`/subjects/${examType}`)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
            >
              Go Back to Subjects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/subjects/${examType}`)}
            className="mb-4 text-gray-400 hover:text-white"
          >
            ← Back to Subjects
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">{subjectTitle}</h1>
            <p className="text-lg text-gray-400">{examTitle}</p>
            <p className="text-sm text-gray-500 mt-2">Choose a chapter to start practicing</p>
            {apiStatus === 'issues' && (
              <div className="mt-2 text-yellow-500 text-sm">
                Note: The API may be experiencing some issues. Some features might be limited.
              </div>
            )}
          </div>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center p-8 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-gray-400">No chapters available for this subject yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter) => (
              <Card
                key={chapter.id}
                className="p-6 rounded-lg bg-neutral-900 shadow hover:shadow-lg transition hover:-translate-y-1 cursor-pointer border border-neutral-800 hover:border-primary"
                onClick={() => handleChapterClick(chapter)}
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-primary mb-2 hover:text-purple-300 transition-colors">
                    {chapter.name}
                  </h2>
                </div>
                <div className="mt-4 flex justify-end">
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
                    className="h-6 w-6 text-primary/60"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChaptersPage;