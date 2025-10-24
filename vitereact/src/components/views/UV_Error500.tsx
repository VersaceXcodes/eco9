import React from 'react';
import { useAppStore } from '@/store/main';

const UV_Error500: React.FC = () => {
  // Retrieve error message from global store with fallback
  const error_message = useAppStore(
    state => state.authentication_state.error_message
  ) || 'Internal Server Error';

  // Refresh handler
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto p-6 lg:p-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center space-y-8">
            {/* Error Code Display */}
            <h1 className="text-4xl font-bold text-gray-900">
              500
            </h1>
            
            {/* Error Message */}
            <p className="text-xl text-gray-700 max-w-lg mx-auto">
              {error_message}
            </p>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
              aria-label="Try again to refresh the page"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Error500;