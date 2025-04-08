import React from 'react';

const Input = React.forwardRef(({
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <input
      type={type}
      className={`w-full px-4 py-2 text-sm border border-neutral-800 rounded-md bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
