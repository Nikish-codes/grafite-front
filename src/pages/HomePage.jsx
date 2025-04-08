import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { getModules } from '../services/grafiteApi';

// These are all the available exam options we have in our application
const allExamOptions = [
  {
    id: 1,
    title: 'JEE Mains Top 500 PYQs',
    path: '/subjects/jee-mains-pyq',
    description: 'Collection of previous years questions for JEE Mains (Physics, Chemistry & Mathematics)',
    modulePrefix: 'JEEM',
    subjectModules: {
      physics: 'JEEM_PHY',
      chemistry: 'JEEM_CHEM',
      mathematics: 'JEEM_MATH'
    },
    comingSoon: true, // Will show Coming Soon if modules not available
    priority: 1 // Higher priority items appear first
  },
  {
    id: 2,
    title: 'JEE Advanced PYQs',
    path: '/subjects/jee-adv-pyq',
    description: 'Previous years questions for JEE Advanced (Physics, Chemistry & Mathematics)',
    modulePrefix: 'ADV',
    subjectModules: {
      physics: 'ADV_PHY_PYQ',
      chemistry: 'ADV_CHEM_PYQ',
      mathematics: 'ADV_MATH_PYQ'
    },
    comingSoon: true, // Will show Coming Soon if modules not available
    priority: 2
  },
  {
    id: 3,
    title: 'JEE ADV Rank Booster Questions',
    path: '/subjects/jee-adv-booster',
    description: 'Advanced level questions to boost your JEE Advanced rank',
    modulePrefix: 'JEE_ADV',
    priority: 3
  },
  {
    id: 4,
    title: 'BITSAT',
    path: '/subjects/bitsat-prep',
    description: 'Comprehensive preparation guide for BITSAT examination',
    modulePrefix: 'BITSAT',
    priority: 4
  },
  {
    id: 5,
    title: 'WBJEE Chapterwise',
    path: '/subjects/wbjee',
    description: 'Chapter-by-chapter questions for WBJEE preparation',
    modulePrefix: 'WBJEE_MATH',
    priority: 5
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [availableExamOptions, setAvailableExamOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailableModules = async () => {
      try {
        setLoading(true);
        // Fetch all available modules from the API
        const modules = await getModules();
        
        if (modules && Array.isArray(modules)) {
          // Check each exam option to see if its modules are available
          const available = allExamOptions.map(option => {
            // For options with subject modules, check if any are available
            if (option.subjectModules) {
              const hasAvailableModules = Object.values(option.subjectModules).some(modulePrefix => 
                modules.some(module => module === modulePrefix)
              );
              
              return {
                ...option,
                comingSoon: !hasAvailableModules
              };
            } 
            // For options with modulePrefix, check if any module starts with it
            else if (option.modulePrefix) {
              const hasAvailableModules = modules.some(module => 
                module.startsWith(option.modulePrefix)
              );
              
              return {
                ...option,
                comingSoon: !hasAvailableModules
              };
            }
            
            // Default case
            return option;
          });
          
          // Sort by priority
          available.sort((a, b) => (a.priority || 999) - (b.priority || 999));
          
          setAvailableExamOptions(available);
        } else {
            // If we can't get modules, show all options as coming soon
          const fallbackOptions = allExamOptions.map(option => ({
            ...option,
            comingSoon: true
          }));
          
          // Sort by priority
          fallbackOptions.sort((a, b) => (a.priority || 999) - (b.priority || 999));
          setAvailableExamOptions(fallbackOptions);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
        // Show all options as coming soon if there's an error
        const fallbackOptions = allExamOptions.map(option => ({
          ...option,
          comingSoon: true
        }));
        
        // Sort by priority
        fallbackOptions.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        setAvailableExamOptions(fallbackOptions);
      } finally {
        setLoading(false);
      }
    };

    checkAvailableModules();
  }, []);

  const handleOptionClick = (path) => {
    navigate(path);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Grafite Exam Preparation Hub</h1>
          <p className="text-lg text-gray-400">Select your JEE preparation path</p>
        </div>

        {loading ? (
          <div className="text-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading available exam modules...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableExamOptions.length === 0 ? (
              <div className="col-span-3 text-center p-8 bg-neutral-900 rounded-lg border border-neutral-800">
                <h2 className="text-xl text-primary mb-2">No Exam Modules Available</h2>
                <p className="text-gray-400">Please check back later as we add more content.</p>
              </div>
            ) : (
              availableExamOptions.map((option) => (
            <Card
              key={option.id}
              className="p-6 rounded-lg bg-neutral-900 shadow hover:shadow-lg transition hover:-translate-y-1 cursor-pointer border border-neutral-800 hover:border-primary"
              onClick={() => handleOptionClick(option.path)}
            >
              <h2 className="text-xl font-semibold text-primary mb-2 hover:text-purple-300 transition-colors">
                {option.title}
                {option.comingSoon && (
                  <span className="ml-2 text-xs px-2 py-1 bg-amber-900/50 text-amber-400 rounded-md font-normal">
                    Coming Soon
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-400 mb-4">{option.description}</p>
              {option.comingSoon && (
                <div className="text-sm text-amber-400 mb-2 italic">
                  This module is coming soon. Check back later!
                </div>
              )}
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
            ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;