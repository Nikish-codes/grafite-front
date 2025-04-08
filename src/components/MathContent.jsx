import React, { useEffect, useRef, useState } from 'react';
import '../styles/MathJax.css';

/**
 * Optimized MathContent component with lazy loading and loading states
 */
const MathContent = ({ content }) => {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mathJaxLoaded, setMathJaxLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load MathJax asynchronously if not already loaded
    let script;
    if (!window.MathJax) {
      script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS_HTML';
      script.async = true;
      script.onload = () => {
        window.MathJax.Hub.Config({
          messageStyle: 'none',
          showMathMenu: false,
          tex2jax: { 
            preview: 'none',
            inlineMath: [['$','$']],
            displayMath: [['$$','$$']],
            processEscapes: true
          },
          'HTML-CSS': {
            availableFonts: ['TeX'],
            scale: 100,
            linebreaks: { automatic: false }
          },
          skipStartupTypeset: true
        });
        setMathJaxLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load MathJax library');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setMathJaxLoaded(true);
    }

    return () => {
      if (script) document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!content || !containerRef.current || !mathJaxLoaded) return;

    setIsLoading(true);
    setError(null);
    
    const timer = setTimeout(() => {
      try {
        // Pre-process content to prevent unwanted line breaks
        const processedContent = content.replace(/\n\s*\n/g, ' ');
        containerRef.current.innerHTML = processedContent;
        
        window.MathJax.Hub.Queue([
          'Typeset',
          window.MathJax.Hub,
          containerRef.current,
          () => {
            setIsLoading(false);
            containerRef.current.classList.add('rendered');
          }
        ]);
      } catch (error) {
        console.error('MathJax rendering error:', error);
        setError('Error rendering math content');
        setIsLoading(false);
      }
    }, 50); // Reduced delay for faster rendering

    return () => clearTimeout(timer);
  }, [content, mathJaxLoaded]);

  if (!content) return null;

  return (
    <div className="math-content-container">
      {isLoading && (
        <div className="math-loading">
          Loading math content...
        </div>
      )}
      <div 
        ref={containerRef} 
        className={`math-content ${isLoading ? 'hidden' : ''}`}
        dangerouslySetInnerHTML={{ __html: content || '' }} 
      />
    </div>
  );
};

export default MathContent;