// Simplified MathJax service

// MathJax is initialized in index.html
export const initMathJax = () => Promise.resolve();

// Force MathJax to typeset the page
export const renderMathExpression = (expression) => {
  try {
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    }
  } catch (e) {
    console.error('MathJax error:', e);
  }
  return Promise.resolve(expression);
};

// Force typesetting for batches
export const renderMathExpressions = (expressions) => {
  try {
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    }
  } catch (e) {
    console.error('MathJax batch error:', e);
  }
  return Promise.resolve(expressions.map(expr => ({ id: expr.id, rendered: expr.content })));
};

// Empty preload
export const preloadCommonMath = () => Promise.resolve();

export default {
  initMathJax,
  renderMathExpression,
  renderMathExpressions,
  preloadCommonMath
}; 