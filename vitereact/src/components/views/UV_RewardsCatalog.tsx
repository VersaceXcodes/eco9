import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface Reward {
  id: string;
  title: string;
  point_cost: number;
  description: string;
}

const UV_RewardsCatalog: React.FC = () => {
  // Authentication state
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Fetch rewards
  const { data: rewards, isLoading: isFetchingRewards, isError: rewardsError, refetch } = useQuery<Reward[]>({
    queryKey: ['rewards'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/rewards`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data;
    }
  });

  // Redeem reward mutation
  const [redeemReward, { isLoading: isRedeeming, error: redeemError }] = useMutation(
    (rewardId: string) => 
      axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/rewards/${rewardId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      ),
    {
      onSuccess: () => refetch()
    }
  );

  if (!currentUser) {
    return <div className="text-center py-8">Unauthorized access</div>;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 sm:pl-4">Rewards Catalog</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isFetchingRewards && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {rewardsError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md shadow-sm mt-4">
            <h2 className="text-lg font-medium text-red-700">Error loading rewards</h2>
            <p className="mt-2 text-sm text-red-600">{rewardsError.message}</p>
          </div>
        )}

        {rewards && rewards.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rewards.map(reward => (
              <div
                key={reward.id}
                className="group relative bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                  <p className="mt-2 text-gray-600">{reward.description}</p>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Points Required:</span>
                      <span className="text-blue-600 font-bold">{reward.point_cost}</span>
                    </div>
                    
                    <button
                      onClick={() => redeemReward(reward.id)}
                      disabled={isRedeeming}
                      className="w-full mt-4 px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      {isRedeeming? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Redeeming...
                        </span>
                      ) : (
                        'Redeem Now'
                      )}
                    </button>
                    
                    {redeemError && (
                      <div className="mt-2 text-sm text-red-600">
                        {redeemError.response?.data?.message || 'Failed to redeem reward'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!rewards &&!rewardsError &&!isFetchingRewards && (
          <div className="text-center py-8">
            <p className="text-gray-600">No rewards available</p>
          </div>
        )}
      </main>
    </>
  );
};

export default UV_RewardsCatalog;