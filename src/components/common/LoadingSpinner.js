// src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'normal', center = false }) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    normal: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4'
  };
  
  return (
    <div className={center ? 'flex justify-center items-center' : ''}>
      <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent`}></div>
    </div>
  );
};

export default LoadingSpinner;