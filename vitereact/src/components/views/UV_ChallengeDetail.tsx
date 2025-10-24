import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

const UV_ChallengeDetail: React.FC = () => {
  const { challenge_id } = useParams();
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const recentActivities = useAppStore(state => state.activity_history.recent_activities);
  
  // State for form and errors
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch challenge details
  const { data: challengeData, isLoading: challengeLoading, isError: challengeError } = useQuery({
    queryKey: ['challenge', challenge_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges/${challenge_id}`,
        {
          headers: { Authorization: `Bearer ${auth_token}` },
        }
      );
      return response.data;
    },
  });

  // Fetch user progress
  const { data: userProgress, isLoading: progressLoading, isError: progressError } = useQuery({
    queryKey: ['userProgress', challenge_id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.id}/challenges/${challenge_id}`,
        {
          headers: { Authorization: `Bearer ${auth_token}` },
        }
      );
      return response.data;
    },
    enabled:!!currentUser?.id,
  });

  // Mutation to submit activity
  const [submitActivity, { isLoading: isSubmitting, isError: submitError }] = useMutation({
    mutationFn: async (activityId) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges/${challenge_id}/submit_activity`,
        { activity_id: activityId },
        {
          headers: { Authorization: `Bearer ${auth_token}` },
        }
      );
      return response.data;
    },
  });

  // Handle loading states
  const isLoading = challengeLoading || progressLoading;
  const isError = challengeError || progressError || submitError;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) return;
    
    try {
      await submitActivity(selectedActivityId);
      setSelectedActivityId('');
      setSubmitError(null);
    } catch (err) {
      setSubmitError('Failed to submit activity');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading challenge details...</h1>
          <div className="animate-spin h-8 w-8 text-blue-600"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-gray-700">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold mb-6">Error Loading Challenge</h1>
          <p className="text-lg mb-4">{error?.message || 'Failed to fetch challenge details'}</p>
          <Link
            to="/challenges"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  // Destructure challenge data
  const { title, description, start_date, end_date, participants } = challengeData || {};

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <Link
                to={`/forum/threads/${challenge_id}`}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Discuss in Forum
              </Link>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Challenge Info */}
            <section className="bg-white rounded-xl shadow-lg p-8">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Challenge Details</h2>
                <div className="prose">
                  <p>{description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">Start Date</h3>
                    <p className="text-gray-600">{start_date}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">End Date</h3>
                    <p className="text-gray-600">{end_date}</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Leaderboard */}
            <section className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Leaderboard</h2>
              <div className="max-h-96 overflow-y-auto">
                <ul className="space-y-4">
                  {participants?.map((participant, index) => (
                    <li key={participant.id} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-0">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                          {participant.username[0].toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{participant.username}</span>
                      </div>
                      <span className="text-sm text-gray-600">#{index + 1}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            
            {/* User Progress */}
            {userProgress && (
              <section className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Progress</h2>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
                    <h3 className="text-lg font-medium text-blue-700">Progress: {userProgress.progress_percentage.toFixed(0)}%</h3>
                    <div className="mt-2">
                      <div className="relative pt-4">
                        <div className="overflow-hidden rounded-md bg-blue-100">
                          <div className="absolute bottom-0 left-0 h-4 w-full bg-blue-600" style={{ width: `${userProgress.progress_percentage}%` }}></div>
                        </div>
                        <div className="mt-3 flex justify-between text-sm text-gray-500">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-md p-6">
                    <h3 className="text-lg font-medium text-green-700">Current Rank: #{userProgress.current_rank}</h3>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
                    <h3 className="text-lg font-medium text-gray-700">Submitted Activities</h3>
                    <ul className="mt-3 space-y-2">
                      {userProgress.submitted_activities.map(activity => (
                        <li key={activity.id} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {activity.category}: {activity.value} {activity.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}
            
            {/* Submit Activity Form */}
            <section className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Submit Activity</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="activityId" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Activity
                  </label>
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an activity</option>
                    {recentActivities.map(activity => (
                      <option key={activity.id} value={activity.id}>
                        {activity.category}: {activity.value} {activity.unit} on {activity.timestamp}
                      </option>
                    ))}
                  </select>
                </div>
                
                {submitError && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={!selectedActivityId || isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white"
                >
                  {isSubmitting? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Activity'
                  )}
                </button>
              </form>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_ChallengeDetail;