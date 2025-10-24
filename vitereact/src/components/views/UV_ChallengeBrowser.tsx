import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const challengeTypes = [
  { value: 'individual', label: 'Individual' },
  { value: 'group', label: 'Group' }
];

const durations = [
  { value: '1week', label: '1 Week' },
  { value: '1month', label: '1 Month' }
];

const UV_ChallengeBrowser: React.FC = () => {
  // Get auth token from global state
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);

  // Local state for filters
  const [challenge_type, setChallengeType] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  // Query for challenges
  const queryClient = useQueryClient();

  const { data: challengesData, isLoading: challengesLoading, error: challengesError, refetch } = useQuery({
    queryKey: ['challenges', challenge_type, duration],
    queryFn: async () => {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges`;
      
      const params = new URLSearchParams();
      if (challenge_type) params.append('challenge_type', challenge_type);
      if (duration) params.append('duration', duration);

      const response = await axios.get(`${apiUrl}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Data mapping as per datamap specification
      return {
        items: response.data.map((challenge: any) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          start_date: challenge.start_date,
          end_date: challenge.end_date,
          participants: challenge.participants.map((u: any) => u.id)
        }))
      };
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Mutation for joining a challenge
  const { mutate: joinChallenge, isLoading: joining, error: joinError } = useMutation({
    mutationFn: (challenge_id: string) => {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges/${challenge_id}`;
      
      return axios.post(apiUrl, {}, {
        headers: {
          Authorization: `Bearer ${auth_token}`,
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['challenges', challenge_type, duration] });
    }
  });

  // Handle filter changes
  const handleFilterChange = (type: 'type' | 'duration', value: string | null) => {
    if (type === 'type') {
      setChallengeType(value);
    } else {
      setDuration(value);
    }
    // Clear selected challenge when filters change
    setSelectedChallengeId(null);
  };

  // Handle join challenge
  const handleJoinChallenge = (challenge_id: string) => {
    setSelectedChallengeId(challenge_id);
    joinChallenge(challenge_id);
  };

  // Memoized empty array for participants
  const emptyParticipants = useMemo(() => [], []);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.href = '/';
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Challenge Browser</h1>
            <p className="text-lg text-gray-600 mt-2">
              Discover and join sustainability challenges to track your impact
            </p>
          </div>
        </header>

        {/* Filter Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Type
              </label>
              <select
                className="w-full bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-700 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={challenge_type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || null)}
              >
                <option value="">All Types</option>
                {challengeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                className="w-full bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-700 py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={duration || ''}
                onChange={(e) => handleFilterChange('duration', e.target.value || null)}
              >
                <option value="">All Durations</option>
                {durations.map((dur) => (
                  <option key={dur.value} value={dur.value}>
                    {dur.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reload button */}
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
            disabled={challengesLoading}
          >
            {challengesLoading? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Refresh Challenges'
            )}
          </button>
        </div>

        {/* Challenge Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {challengesLoading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-8 w-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Loading challenges...</p>
            </div>
          )}

          {challengesError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-6">
              <p>Error loading challenges: {challengesError.message}</p>
            </div>
          )}

          {(challengesData?.items || []).length === 0 &&!challengesLoading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path d="M12 2L.5 12.94h21M12 2v10.07h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h2 className="mt-6 text-lg text-gray-900">No challenges found</h2>
              <p className="mt-2 text-sm text-gray-600">
                Try adjusting your filters or check back later for new challenges
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {challengesData?.items.map((challenge) => (
              <div
                key={challenge.id}
                className="bg-white shadow-lg border border-gray-100 rounded-xl p-6 transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">{challenge.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{challenge.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v5h5a2 2 0 002-2V9z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5a2 2 0 002-2V6a2 2 0 00-2-2h-5"></path>
                      </svg>
                      <span className="text-sm text-gray-600">
                        {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21a9 9 0 11-18 0 9 9 0 0118 0M5.5 8h.79L8.5 11.5l1.5-1.5h3.71c.9 0 1.7-.3 2.1-.8l.1-.2a2 2 0 002.1-.8v-4.4a2 2 0 00-2.1-.8l-.1-.2C15.02 5.5 14.3 5 13.5 5H5.5a.5.5 0 00-.5.5v3.5z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">
                        {challenge.participants.length} participants
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={joining && selectedChallengeId === challenge.id}
                    >
                      {joining && selectedChallengeId === challenge.id? (
                        <span className="flex items-center">
                          <svg className="animate-spin -mr-1 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </span>
                      ) : (
                        'Join Challenge'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {joinError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mt-6">
              <p>Error joining challenge: {joinError.message}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_ChallengeBrowser;