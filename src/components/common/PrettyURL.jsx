import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PrettyURL component that updates the document title and favicon based on the current route
 * This makes the browser URL bar and tab look prettier without changing the actual URL structure
 */
const PrettyURL = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Extract route segments
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // Set default title
    let pageTitle = 'Grafite';
    let favicon = '/logo.svg'; // Use logo.svg as the default favicon
    
    // Custom title based on route
    if (segments.length > 0) {
      if (segments[0] === 'chapters' && segments.length >= 3) {
        // For chapter routes: /chapters/bitsat-prep/CHEM
        const examType = segments[1].replace(/-/g, ' ').toUpperCase();
        const subject = segments[2];
        
        // Convert subject abbreviations to full names
        let subjectName = subject;
        if (subject === 'CHEM') {
          subjectName = 'Chemistry';
          favicon = '/icons/chemistry.png';
        } else if (subject === 'PHYSICS') {
          subjectName = 'Physics';
          favicon = '/icons/physics.png';
        } else if (subject === 'MATH') {
          subjectName = 'Mathematics';
          favicon = '/icons/math.png';
        }
        
        pageTitle = `${subjectName} | ${examType} | Grafite`;
      } else if (segments[0] === 'topics' && segments.length >= 4) {
        // For topic routes: /topics/examType/subject/chapterId
        const examType = segments[1].replace(/-/g, ' ').toUpperCase();
        const subject = segments[2];
        const chapterId = segments[3];
        
        // Convert subject abbreviations to full names
        let subjectName = subject;
        if (subject === 'CHEM') {
          subjectName = 'Chemistry';
        } else if (subject === 'PHYSICS') {
          subjectName = 'Physics';
        } else if (subject === 'MATH') {
          subjectName = 'Mathematics';
        }
        
        pageTitle = `${subjectName} - Chapter ${chapterId} | ${examType} | Grafite`;
      } else if (segments[0] === 'questions' && segments.length >= 4) {
        // For questions list: /questions/examType/subject/chapterName
        const examType = segments[1].replace(/-/g, ' ').toUpperCase();
        const subject = segments[2];
        const chapterName = segments[3].replace(/-/g, ' ');
        
        // Convert subject abbreviations to full names
        let subjectName = subject;
        if (subject === 'CHEM') {
          subjectName = 'Chemistry';
        } else if (subject === 'PHYSICS') {
          subjectName = 'Physics';
        } else if (subject === 'MATH') {
          subjectName = 'Mathematics';
        }
        
        pageTitle = `${chapterName} Questions | ${subjectName} | Grafite`;
      } else if (segments[0] === 'question' && segments.length >= 5) {
        // For individual question: /question/examType/subject/chapterName/questionId
        const subject = segments[2];
        const questionId = segments[4];
        
        // Convert subject abbreviations to full names
        let subjectName = subject;
        if (subject === 'CHEM') {
          subjectName = 'Chemistry';
        } else if (subject === 'PHYSICS') {
          subjectName = 'Physics';
        } else if (subject === 'MATH') {
          subjectName = 'Mathematics';
        }
        
        pageTitle = `Question ${questionId} | ${subjectName} | Grafite`;
      } else if (segments[0] === 'auth') {
        pageTitle = 'Login | Grafite';
      } else if (segments[0] === 'profile') {
        pageTitle = 'My Profile | Grafite';
      } else if (segments[0] === 'analytics') {
        pageTitle = 'Analytics | Grafite';
      } else if (segments[0] === 'subjects' && segments.length >= 2) {
        // For subjects route: /subjects/examType
        const examType = segments[1].replace(/-/g, ' ').toUpperCase();
        pageTitle = `${examType} Subjects | Grafite`;
      }
    }
    
    // Update document title
    document.title = pageTitle;
    
    // Update favicon if needed
    const faviconElement = document.querySelector('link[rel="icon"]');
    if (faviconElement) {
      faviconElement.href = favicon;
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = favicon;
      document.head.appendChild(newFavicon);
    }
    
    // Also update apple-touch-icon for iOS devices
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = '/logo.png'; // Use logo.png for apple-touch-icon
    
    // Optional: Update the URL in the address bar without navigation
    // This is experimental and might not work in all browsers
    try {
      if (window.history && window.history.replaceState) {
        // Create a prettier version of the URL for display only
        // Note: This doesn't actually change the route, just what appears in the address bar
        let prettyPath = path;
        
        // Get subject name for URL
        const getSubjectName = (abbr) => {
          switch(abbr.toUpperCase()) {
            case 'CHEM': return 'chemistry';
            case 'PHYSICS': return 'physics';
            case 'MATH': return 'mathematics';
            default: return abbr.toLowerCase();
          }
        };
        
        // Replace paths with prettier versions
        if (segments[0] === 'chapters' && segments.length >= 3) {
          const exam = segments[1];
          const subject = getSubjectName(segments[2]);
          prettyPath = `/study/${exam}/${subject}`;
        } else if (segments[0] === 'topics' && segments.length >= 4) {
          const exam = segments[1];
          const subject = getSubjectName(segments[2]);
          const chapter = segments[3];
          prettyPath = `/study/${exam}/${subject}/chapter/${chapter}`;
        } else if (segments[0] === 'questions' && segments.length >= 4) {
          const exam = segments[1];
          const subject = getSubjectName(segments[2]);
          const chapter = segments[3];
          prettyPath = `/study/${exam}/${subject}/${chapter}/questions`;
        } else if (segments[0] === 'question' && segments.length >= 5) {
          const exam = segments[1];
          const subject = getSubjectName(segments[2]);
          const chapter = segments[3];
          const question = segments[4];
          prettyPath = `/study/${exam}/${subject}/${chapter}/question/${question}`;
        }
        
        window.history.replaceState(
          { path: path },
          pageTitle,
          prettyPath
        );
      }
    } catch (e) {
      console.error('Error updating URL display:', e);
    }
  }, [location]);
  
  // This component doesn't render anything
  return null;
};

export default PrettyURL;
