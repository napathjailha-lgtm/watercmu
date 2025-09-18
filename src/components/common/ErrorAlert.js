// src/components/common/ErrorAlert.js
import React from 'react';

const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;
  
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
      <div>{message}</div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-red-700 font-bold"
          aria-label="ปิด"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;