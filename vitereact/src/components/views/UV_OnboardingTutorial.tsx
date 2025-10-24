import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Welcome to eco9',
    content: 'This interactive tutorial will guide you through the core features of the app to help you get started.',
  },
  {
    title: 'Activity Logging',
    content: 'Use the Floating Action Button (FAB) to quickly log your sustainable activities like biking, recycling, or energy savings.',
  },
  {
    title: 'Impact Dashboard',
    content: 'Track your environmental impact metrics in real-time and see how your actions contribute to a greener planet.',
  },
];

const UV_OnboardingTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  
  // Get current user from global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const update_user_profile = useAppStore(state => state.update_user_profile);

  // Mutation to complete tutorial
  const { mutate: completeTutorial, isLoading: isCompleting } = useMutation(
    async (userId: string) => {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}`,
        { tutorial_completed: true }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        // Update local state
        setIsCompleted(true);
        // Update global state
        if (currentUser) {
          update_user_profile({ tutorial_completed: true });
        }
      },
      onSettled: () => {
        setIsSkipping(false);
      }
    }
  );

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsSkipping(true);
    handleComplete();
  };

  const handleComplete = () => {
    if (currentUser) {
      completeTutorial(currentUser.id);
    }
  };

  // Check if tutorial is already completed
  if (currentUser?.tutorial_completed || isCompleted) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-200">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{STEPS[currentStep].title}</h2>
          <button 
            onClick={handleSkip}
            className="text-blue-600 hover:text-blue-500 font-medium"
            aria-label="Skip tutorial"
          >
            Skip
          </button>
        </div>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {STEPS[currentStep].content}
        </p>
        
        <div className="flex justify-end space-x-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-900 transition-colors"
              aria-label="Previous step"
            >
              Back
            </button>
          )}
          
          <button
            onClick={currentStep === STEPS.length - 1? handleComplete : handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCompleting || isSkipping}
            aria-label={currentStep === STEPS.length - 1? "Complete tutorial" : "Next step"}
          >
            {currentStep === STEPS.length - 1? 
              isCompleting? 'Completing...' : 'Complete Tutorial' 
              : 'Next Step'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default UV_OnboardingTutorial;