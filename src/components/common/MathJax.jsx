import React from 'react';

// Super simple MathJax component - just outputs raw TeX
const MathJaxComponent = ({ expression, displayMode = false, className = '' }) => {
  if (!expression) return null;
  
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: displayMode 
          ? `$$${expression}$$`
          : `$${expression}$`
      }}
    />
  );
};

// Minimal batch renderer - just outputs raw TeX
export const MathJaxBatch = ({ expressions, className = '' }) => {
  if (!expressions || !expressions.length) return null;
  
  return (
    <div className={className}>
      {expressions.map(expr => (
        <div key={expr.id || Math.random()}>
          <MathJaxComponent
            expression={expr.content}
            displayMode={!!expr.displayMode}
          />
        </div>
      ))}
    </div>
  );
};

export default MathJaxComponent; 