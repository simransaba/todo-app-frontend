import React from 'react';

export const Alert = ({ className, children }) => {
  return (
    <div className={`rounded-lg border p-4 ${className}`} role="alert">
      {children}
    </div>
  );
};

export const AlertDescription = ({ children }) => {
  return <div className="text-sm">{children}</div>;
};