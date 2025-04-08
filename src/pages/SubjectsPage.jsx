import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getModules } from '../services/grafiteApi';

// Map exam types to display titles
const examTypeToTitle = {
  'jee-mains-500': 'JEE Mains Top 500 QnA',
  'jee-mains-250': 'JEE Mains Top 250 Single Correct Questions',
  'jee-adv-booster': 'JEE Advanced Rank Booster Questions',
  'bitsat-prep': 'BITSAT Prep Guide',
  'wbjee': 'WBJEE Chapterwise',
  'mains-2025': '2025 Mains Questions',
  'jee-mains-pyq': 'JEE Mains Top 500 PYQs',
  'jee-adv-pyq': 'JEE Advanced PYQs'
};

// Map exam types to API module prefixes
const examTypeToModulePrefix = {
  'jee-adv-booster': 'JEE_ADV',
  'bitsat-prep': 'BITSAT',
  'wbjee': 'WBJEE_MATH',
  'jee-mains-pyq': 'JEEM',
  'jee-adv-pyq': 'ADV',
  // Add other mappings as needed
};

// Default subjects if API fails or for exam types without API data
const defaultSubjects = {
  'jee-adv-booster': [
    { id: 'PHY', title: 'Physics', questions: 200 },
    { id: 'CHEM', title: 'Chemistry', questions: 180 },
    { id: 'MATH', title: 'Mathematics', questions: 220 }
  ],
  'bitsat-prep': [
    { id: 'PHY', title: 'Physics', questions: 150 },
    { id: 'CHEM', title: 'Chemistry', questions: 140 },
    { id: 'MATH', title: 'Mathematics', questions: 160 },
    { id: 'ENG', title: 'English', questions: 75 },
    { id: 'LR', title: 'Logical Reasoning', questions: 60 }
  ],
  'jee-mains-500': [
    { id: 'PHY', title: 'Physics', questions: 170 },
    { id: 'CHEM', title: 'Chemistry', questions: 160 },
    { id: 'MATH', title: 'Mathematics', questions: 170 }
  ],
  'jee-mains-250': [
    { id: 'PHY', title: 'Physics', questions: 85 },
    { id: 'CHEM', title: 'Chemistry', questions: 80 },
    { id: 'MATH', title: 'Mathematics', questions: 85 }
  ],
  'wbjee': [
    { id: 'PHY', title: 'Physics', questions: 120 },
    { id: 'CHEM', title: 'Chemistry', questions: 110 },
    { id: 'MATH', title: 'Mathematics', questions: 130 }
  ],
  'mains-2025': [
    { id: 'PHY', title: 'Physics', questions: 100 },
    { id: 'CHEM', title: 'Chemistry', questions: 100 },
    { id: 'MATH', title: 'Mathematics', questions: 100 }
  ],
  'jee-mains-pyq': [
    { id: 'PHY', title: 'Physics', moduleId: 'JEEM_PHY', questions: 200 },
    { id: 'CHEM', title: 'Chemistry', moduleId: 'JEEM_CHEM', questions: 200 },
    { id: 'MATH', title: 'Mathematics', moduleId: 'JEEM_MATH', questions: 200 }
  ],
  'jee-adv-pyq': [
    { id: 'PHY', title: 'Physics', moduleId: 'ADV_PHY_PYQ', questions: 150 },
    { id: 'CHEM', title: 'Chemistry', moduleId: 'ADV_CHEM_PYQ', questions: 150 },
    { id: 'MATH', title: 'Mathematics', moduleId: 'ADV_MATH_PYQ', questions: 150 }
  ]
};

// Map subject codes to full titles
const subjectCodeToTitle = {
  'PHY': 'Physics',
  'CHEM': 'Chemistry',
  'MATH': 'Mathematics',
  'BIO': 'Biology',
  'ENG': 'English',
  'LR': 'Logical Reasoning'
};

const SubjectsPage = () => {
  const { examType } = useParams();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examTitle, setExamTitle] = useState('');

  useEffect(() => {
    // Set exam title based on exam type
    setExamTitle(examTypeToTitle[examType] || examType);
    
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        
        // Check if we have a module prefix for this exam type
        const modulePrefix = examTypeToModulePrefix[examType];
        
        if (modulePrefix) {
          // Try to fetch from API
          const moduleData = await getModules();
          
          if (moduleData && Array.isArray(moduleData)) {
            // Special handling for JEE Mains PYQ and JEE Advanced PYQ
            let relevantModules = [];
            
            if (examType === 'jee-mains-pyq') {
              // Look for exact module matches for JEE Mains PYQ
              relevantModules = moduleData.filter(module => 
                ['JEEM_PHY', 'JEEM_CHEM', 'JEEM_MATH'].includes(module)
              );
            } else if (examType === 'jee-adv-pyq') {
              // Look for exact module matches for JEE Advanced PYQ
              relevantModules = moduleData.filter(module => 
                ['ADV_PHY_PYQ', 'ADV_CHEM_PYQ', 'ADV_MATH_PYQ'].includes(module)
              );
            } else {
              // For other exam types, filter by prefix as before
              relevantModules = moduleData.filter(module => 
                module.startsWith(modulePrefix)
              );
            }
            
            if (relevantModules.length > 0) {
              // Process modules into subjects
              let processedSubjects = [];
              
              if (examType === 'jee-mains-pyq') {
                // For JEE Mains PYQ, map modules to specific subjects
                processedSubjects = relevantModules.map(module => {
                  let subjectCode = '';
                  let title = '';
                  
                  if (module === 'JEEM_PHY') {
                    subjectCode = 'PHY';
                    title = 'Physics';
                  } else if (module === 'JEEM_CHEM') {
                    subjectCode = 'CHEM';
                    title = 'Chemistry';
                  } else if (module === 'JEEM_MATH') {
                    subjectCode = 'MATH';
                    title = 'Mathematics';
                  }
                  
                  return {
                    id: subjectCode,
                    title: title,
                    module: module,
                    questions: 200 // Estimated number of questions
                  };
                });
              } else if (examType === 'jee-adv-pyq') {
                // For JEE Advanced PYQ, map modules to specific subjects
                processedSubjects = relevantModules.map(module => {
                  let subjectCode = '';
                  let title = '';
                  
                  if (module === 'ADV_PHY_PYQ') {
                    subjectCode = 'PHY';
                    title = 'Physics';
                  } else if (module === 'ADV_CHEM_PYQ') {
                    subjectCode = 'CHEM';
                    title = 'Chemistry';
                  } else if (module === 'ADV_MATH_PYQ') {
                    subjectCode = 'MATH';
                    title = 'Mathematics';
                  }
                  
                  return {
                    id: subjectCode,
                    title: title,
                    module: module,
                    questions: 150 // Estimated number of questions
                  };
                });
              } else {
                // For other exam types, process as before
                processedSubjects = relevantModules.map(module => {
                  const parts = module.split('_');
                  const subjectCode = parts.length > 1 ? parts[parts.length - 1] : '';
                  
                  return {
                    id: subjectCode,
                    title: getSubjectTitle(subjectCode),
                    module: module
                  };
                });
              }
              
              setSubjects(processedSubjects);
              setLoading(false);
              return;
            } else {
              console.log(`No modules found starting with ${modulePrefix}`);
            }
          }
        }
        
        // Fallback to default subjects if API fails or no module prefix
        if (defaultSubjects[examType]) {
          setSubjects(defaultSubjects[examType]);
        } else {
          setError('No subjects available for this exam type');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        
        // Fallback to default subjects
        if (defaultSubjects[examType]) {
          setSubjects(defaultSubjects[examType]);
          setLoading(false);
        } else {
          setError('Failed to load subjects');
          setLoading(false);
        }
      }
    };

    fetchSubjects();
  }, [examType]);

  const getSubjectTitle = (code) => {
    return subjectCodeToTitle[code] || code;
  };
  
  const handleSubjectClick = (subject) => {
    navigate(`/chapters/${examType}/${subject.id}`);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading subjects...</p>
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
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
            >
              Go Back Home
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
            onClick={() => navigate('/')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            ← Back to Home
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">{examTitle}</h1>
            {(examType === 'jee-mains-pyq' || examType === 'jee-adv-pyq') && subjects.length === 0 && (
              <div className="mt-4 p-4 bg-amber-900/20 text-amber-400 rounded-lg inline-block">
                <p className="font-medium">Coming Soon!</p>
                <p className="text-sm mt-1">This module is currently under development. Check back later!</p>
              </div>
            )}
            <p className="text-lg text-gray-400">
              Select a subject to start practicing
            </p>
          </div>
        </div>
        
        {subjects.length === 0 ? (
          <div className="bg-neutral-900 border border-amber-800 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-amber-400 mb-4">Coming Soon</h2>
            <p className="text-gray-300 mb-6">
              We're currently working on adding content for {examTitle}. Check back soon for new practice questions and study materials!
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-white hover:bg-primary/80"
            >
              Explore Other Exams
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="p-6 rounded-lg bg-neutral-900 shadow hover:shadow-lg transition hover:-translate-y-1 cursor-pointer border border-neutral-800 hover:border-primary"
              onClick={() => handleSubjectClick(subject)}
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-primary hover:text-purple-300 transition-colors">
                  {subject.title}
                </h2>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  Practice Now
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Practice {subject.title} questions for {examTitle}
              </p>
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

export default SubjectsPage;