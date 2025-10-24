import React, { useState, useEffect } from 'react';

const GV_NotificationBanner: React.FC = () => {
  // Local state management (temporary until backend integration)
  const [systemMessage, setSystemMessage] = useState({
    visible: false,
    message: '',
    type: 'info' as 'info' | 'warning' | 'error',
  });

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (systemMessage.visible) {
      const timeout = setTimeout(() => {
        setSystemMessage({...systemMessage, visible: false });
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [systemMessage.visible]);

  // Dismiss function
  const dismissBanner = () => {
    setSystemMessage({...systemMessage, visible: false });
  };

  // For demonstration purposes (will be replaced with actual API calls)
  const triggerTestMessage = () => {
    setSystemMessage({
      visible: true,
      message: 'This is a test system message.',
      type: 'info',
    });
  };

  if (!systemMessage.visible ||!systemMessage.message) {
    return null;
  }

  // Dynamic styling based on message type
  const classes = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  }[systemMessage.type];

  return (
    <>
      {/* Demo trigger (remove in production) */}
      <button
        onClick={triggerTestMessage}
        className="fixed bottom-0 right-0 m-4 z-50 bg-gray-200 px-4 py-2 rounded-md shadow-md transition-colors duration-200"
      >
        Trigger Test Message
      </button>

      {/* Notification Banner */}
      <div
        className={`fixed top-0 left-0 w-full z-50 p-4 mx-auto max-w-7xl 
          transition-all duration-300 ease-in-out transform 
          ${classes} 
          rounded-lg shadow-lg 
          ${systemMessage.visible? 'translate-y-0' : '-translate-y-full'}`}
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <span className="flex-grow text-center">{systemMessage.message}</span>
          
          <button
            onClick={dismissBanner}
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Dismiss notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default GV_NotificationBanner;