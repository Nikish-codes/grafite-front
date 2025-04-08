import { useState, useEffect } from 'react';
import { renderMathExpression, renderMathExpressions } from '../services/mathJaxService';

export const useMathJax = (expressions, options = {}) => {
  const [renderedExpressions, setRenderedExpressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const renderExpressions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle single expression case
        if (typeof expressions === 'string') {
          const rendered = await renderMathExpression(
            expressions, 
            options.displayMode
          );
          if (mounted) {
            setRenderedExpressions([rendered]);
          }
        } 
        // Handle multiple expressions
        else if (Array.isArray(expressions)) {
          const rendered = await renderMathExpressions(
            expressions.map(expr => ({
              expression: typeof expr === 'string' ? expr : expr.expression,
              displayMode: typeof expr === 'string' ? options.displayMode : expr.displayMode
            }))
          );
          if (mounted) {
            setRenderedExpressions(rendered);
          }
        }
      } catch (err) {
        console.error('Error in useMathJax:', err);
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    renderExpressions();

    return () => {
      mounted = false;
    };
  }, [expressions, options.displayMode]);

  return {
    renderedExpressions: Array.isArray(expressions) ? renderedExpressions : renderedExpressions[0],
    loading,
    error
  };
}; 