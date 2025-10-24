import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UV_Settings: React.FC = () => {
  // Get current user from global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const update_user_profile = useAppStore(state => state.update_user_profile);

  // Form state initialization
  const initialUnitSystem = currentUser?.unit_system || 'metric';
  const initialNotifications = currentUser?.notification_preferences || {
    activity_reminders: true,
    challenge_updates: true,
  };
  const initialDataPrivacy = currentUser?.data_privacy_opt_in || true;

  const [unitSystem, setUnitSystem] = useState(initialUnitSystem);
  const [activityReminders, setActivityReminders] = useState(initialNotifications.activity_reminders);
  const [challengeUpdates, setChallengeUpdates] = useState(initialNotifications.challenge_updates);
  const [dataPrivacyOptIn, setDataPrivacyOptIn] = useState(initialDataPrivacy);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Mutation to save settings
  const { mutate: saveSettings } = useMutation({
    mutationFn: async (newUserData) => {
      if (!currentUser?.id) throw new Error('User ID not found');
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.id}`,
        newUserData,
        { headers: { Authorization: `Bearer ${currentUser.auth_token}` } }
      );
      return response.data;
    }
  }, {
    onSuccess: (data) => {
      update_user_profile(data);
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save settings';
      setError(errorMessage);
    },
    onSettled: () => setIsSaving(false)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const newUserData = {
      unit_system: unitSystem,
      notification_preferences: {
        activity_reminders,
        challenge_updates,
      },
      data_privacy_opt_in: dataPrivacyOptIn,
    };

    saveSettings(newUserData);
  };

  const handleInputChange = () => setError(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Unit System */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Unit System</h2>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="unitSystem"
                  value="metric"
                  checked={unitSystem === 'metric'}
                  onChange={(e) => {
                    setUnitSystem('metric');
                    handleInputChange();
                  }}
                  className="appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="metric" className="ml-2 text-gray-700">
                  Metric (kg, km)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="unitSystem"
                  value="imperial"
                  checked={unitSystem === 'imperial'}
                  onChange={(e) => {
                    setUnitSystem('imperial');
                    handleInputChange();
                  }}
                  className="appearance-none w-4 h-4 border-2 border-gray-300 rounded-full bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="imperial" className="ml-2 text-gray-700">
                  Imperial (lbs, miles)
                </label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={activityReminders}
                  onChange={(e) => {
                    setActivityReminders(e.target.checked);
                    handleInputChange();
                  }}
                  className="appearance-checkbox h-4 w-4 border-2 border-gray-300 rounded bg-white checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="text-gray-700">Activity Reminders</label>
                  <p className="text-sm text-gray-600 mt-1">Receive reminders for logging activities</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={challengeUpdates}
                  onChange={(e) => {
                    setChallengeUpdates(e.target.checked);
                    handleInputChange();
                  }}
                  className="appearance-checkbox h-4 w-4 border-2 border-gray-300 rounded bg-white checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="text-gray-700">Challenge Updates</label>
                  <p className="text-sm text-gray-600 mt-1">Receive notifications about challenge progress and events</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Privacy */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Privacy</h2>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={dataPrivacyOptIn}
                onChange={(e) => {
                  setDataPrivacyOptIn(e.target.checked);
                  handleInputChange();
                }}
                className="appearance-checkbox h-4 w-4 border-2 border-gray-300 rounded bg-white checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-gray-700">Opt-in to Data Sharing</label>
                <p className="text-sm text-gray-600 mt-1">Allow your anonymized data to be used for research and improvements</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UV_Settings;