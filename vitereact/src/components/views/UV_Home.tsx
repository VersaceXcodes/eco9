import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const UV_Home: React.FC = () => {
  // Authentication check
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  if (!currentUser) {
    // Redirect to root (handled by route protection in practice)
    return null;
  }

  // Fetch recent activities
  const { data: recentActivities, isLoading, isError } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      const response = await axios.get<Activity[]>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/activities?limit=5`,
        { headers: { Authorization: `Bearer ${currentUser.auth_token}` } }
      );
      return response.data;
    },
  });

  // Calculate impact metrics
  const totalCo2Saved = recentActivities?.reduce((sum, act) => sum + act.impact.co2_saved, 0) || 0;
  const totalWaterConserved = recentActivities?.reduce((sum, act) => sum + act.impact.water_conserved, 0) || 0;

  // Quick access activity categories (static)
  const quickAccessActivities = [
    { category: 'transport', label: 'Transport', icon: '🚲' },
    { category: 'energy', label: 'Energy', icon: '⚡' },
    { category: 'waste', label: 'Waste', icon: '🗑️' },
    { category: 'diet', label: 'Diet', icon: '🍎' },
    { category: 'water', label: 'Water', icon: '💧' },
  ];

  // Auto-suggestion based on time
  const getCurrentSuggestion = () => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 10) return 'Did you bike to work today?';
    if (hour >= 12 && hour < 14) return 'Time for a midday walk instead of driving!';
    return 'Log your daily eco-actions to track your impact!';
  };
  const suggestion = getCurrentSuggestion();

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Home Hub</h1>
        </div>
      </header>

      {/* Impact Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6V6m6 6h-12a1 1 0 00-1 1v12a1 1 0 001 1h12v-1M4 18h12v-1H4v1m5.356-2.239a1 1 0 00-.724-.481L5.93 15.354A1 1 0 005.46 14.383l-1.88-1.83a1 1 0 00-1.175 0l-1.88 1.83a1 1 0 105.178 1.844L8.53 16.26a1 1 0 002.114.816h3.45a1 1 0 100 1.659l3.45-3.45a1 1 0 000-1.416z" />
              </svg>
              <h3 className="text-lg font-semibold">CO₂ Saved</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalCo2Saved} kg</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path vector-effect="non-scalingStroke" d="M12 3L0.5 13.5A1 1 0 001 14h3a1 1 0 011 1v5a1 1 0 11-2 0v-1H5v-4h5.5a1 1 0 011 1v5a1 1 0 11-2 0v-6.5l6.5-6.5M21 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold">Water Conserved</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalWaterConserved} L</p>
          </div>
        </div>
      </section>

      {/* Recent Activities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Recent Activities</h2>
        <div className="space-y-6">
          {isLoading && <div className="bg-gray-50 p-6 rounded-xl shadow-lg">
            <p className="text-gray-600">Loading recent activities...</p>
          </div>}
          
          {isError && <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <p className="text-red-700">Error fetching activities. Please try again.</p>
          </div>}
          
          {recentActivities?.length === 0 && (
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <p className="text-yellow-700">No recent activities yet. Start logging!</p>
            </div>
          )}
          
          {recentActivities?.map((activity) => (
            <div key={activity.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">{activity.category}</h3>
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11a1 1 0 11 0 2 1 1 0 01-2 0M9 11a8 8 0 11-8 0 8 8 0 018 0M21 12a1 1 0 11-1 1 1 1 0 012 0m-6.5-7.5a1 1 0 00-1 1v8a1 1 0 001 1h3.5a1 1 0 100-2h-3.5v-8a1 1 0 00-1-1M5.5 7.5h5a1 1 0 011 1v5.5a1 1 0 110 1h-5a1 1 0 01-1-1V7.5z" />
                </svg>
              </div>
              
              <p className="text-gray-600">{activity.value} {activity.unit}</p>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">Impact:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li className="text-gray-700">{activity.impact.co2_saved} kg CO₂ saved</li>
                  <li className="text-gray-700">{activity.impact.water_conserved} L water conserved</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access Activities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Quick Log</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickAccessActivities.map((act) => (
            <div key={act.category} className="group relative p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
              <Link
                to={`/log-activity?category=${encodeURIComponent(act.category)}`}
                className="block h-full flex flex-col items-center justify-center text-center transition-colors duration-200 hover:bg-gray-50"
              >
                <div className="text-5xl text-gray-500 group-hover:text-blue-600">{act.icon}</div>
                <p className="mt-4 text-gray-700 group-hover:text-blue-700">{act.label}</p>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Auto-suggestion Banner */}
      {suggestion && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-700 text-sm font-medium">{suggestion}</p>
          </div>
        </section>
      )}

      {/* Floating Action Button */}
      <Link
        to="/log-activity"
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg shadow-gray-500/30 transition-colors duration-200"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6V6m6 6h-12a1 1 0 00-1 1v12a1 1 0 001 1h12v-1M4 18h12v-1H4v1m5.356-2.239a1 1 0 00-.724-.481L5.93 15.354A1 1 0 005.46 14.383l-1.88-1.83a1 1 0 00-1.175 0l-1.88 1.83a1 1 0 105.178 1.844L8.53 16.26a1 1 0 002.114.816h3.45a1 1 0 100 1.659l3.45-3.45a1 1 0 000-1.416z" />
        </svg>
      </Link>
    </>
  );
};

export default UV_Home;