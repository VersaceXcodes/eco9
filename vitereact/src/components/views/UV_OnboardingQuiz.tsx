import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    id: 'q1',
    text: 'What is your biggest environmental concern?',
    options: [
      'Climate Change',
      'Waste Management',
      'Energy Consumption',
      'Water Conservation',
      'Biodiversity Loss'
    ]
  },
  {
    id: 'q2',
    text: 'What type of sustainability goals interest you most?',
    options: [
      'Reduce Carbon Footprint',
      'Zero Waste Lifestyle',
      'Sustainable Diet',
      'Eco-Friendly Travel',
      'General Eco-Learning'
    ]
  },
  {
    id: 'q3',
    text: 'How do you prefer to engage with sustainability content?',
    options: [
      'Solo Challenges',
      'Group Activities',
      'Educational Courses',
      'Community Forums',
      'Gamified Experiences'
    ]
  }
];

const UV_OnboardingQuiz: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  
  // Get auth state and update method from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const update_user_profile = useAppStore(state => state.update_user_profile);

  const handleAnswerSelection = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Update answers and move to next question
    setQuizAnswers(prev => ({...prev, [currentQuestion.id]: answer }));
    
    // Auto-advance if not last question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(quizAnswers).length!== questions.length) {
      setError('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      if (currentUser) {
        // Update user profile with quiz answers
        await update_user_profile({
          onboarding_quiz_answers: quizAnswers
        });
        
        // Redirect to home after successful submission
        navigate('/home', { replace: true });
      } else {
        throw new Error('User not authenticated during quiz submission');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to submit quiz answers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Progress Indicator */}
        <div className="flex justify-between space-x-4 text-sm text-gray-600">
          {questions.map((_, index) => (
            <div key={index} className={`flex-1 border-b-2 ${
              index <= currentQuestionIndex 
               ? 'border-blue-600' 
                : 'border-gray-200'
            }`}>
              <span className={`block text-center ${
                index === currentQuestionIndex 
                 ? 'text-blue-700 font-medium' 
                  : 'text-gray-500'
              }`}>
                {index + 1}
              </span>
            </div>
          ))}
        </div>

        {/* Question Card */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {currentQuestion.text}
          </h3>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelection(option)}
                className={`group w-full text-left text-gray-800 ${
                  quizAnswers[currentQuestion.id] === option
                   ? 'bg-blue-50 border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                } p-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <span className={`block ${quizAnswers[currentQuestion.id] === option? 'font-medium' : 'font-normal'}`}>
                  {option}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-red-200 p-4 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          {currentQuestionIndex > 0 && (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(quizAnswers).length!== questions.length}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              isSubmitting
               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-100'
            }`}
          >
            {isSubmitting? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                  fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" 
                    stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : currentQuestionIndex === questions.length - 1? 
              'Complete Onboarding' : 'Next Question'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default UV_OnboardingQuiz;