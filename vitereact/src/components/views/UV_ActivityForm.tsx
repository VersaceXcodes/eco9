import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const UV_ActivityForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const activityId = params.activityId; // Assuming route is defined with optional :activityId

  // Global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const clearAuthError = useAppStore(state => state.clear_auth_error);

  // Form state
  const [activityData, setActivityData] = useState({
    category: null,
    value: 0,
    unit: '',
    timestamp: new Date().toISOString(),
    notes: null,
    image_url: null,
  });

  const [impactPreview, setImpactPreview] = useState({
    co2_saved: 0,
    water_conserved: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  // Fetch existing activity if in edit mode
  const { data: existingActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async () => {
      if (!activityId ||!currentUser) return null;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/activities/${activityId}`,
          {
            headers: { Authorization: `Bearer ${currentUser.auth_token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error('Failed to fetch activity:', error);
        return null;
      }
    },
    enabled:!!activityId &&!!currentUser,
  });

  useEffect(() => {
    if (existingActivity &&!isActivityLoading) {
      setActivityData({
        category: existingActivity.category,
        value: existingActivity.value,
        unit: existingActivity.unit,
        timestamp: existingActivity.timestamp,
        notes: existingActivity.notes || null,
        image_url: existingActivity.image_url || null,
      });
      setImpactPreview({
        co2_saved: existingActivity.impact.co2_saved,
        water_conserved: existingActivity.impact.water_conserved,
      });
    }
  }, [existingActivity, isActivityLoading]);

  // Impact calculation mutation
  const { mutate: calculateImpact, isLoading: impactLoading } = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/activities/calculate`,
        data,
        {
          headers: { Authorization: `Bearer ${currentUser?.auth_token}` },
        }
      );
      return response.data;
    },
  });

  useEffect(() => {
    if (activityData.category && activityData.value > 0) {
      calculateImpact({ category: activityData.category, value: activityData.value });
    }
  }, [activityData.category, activityData.value, calculateImpact]);

  useEffect(() => {
    if (calculateImpact.data) {
      setImpactPreview({
        co2_saved: calculateImpact.data.co2_saved,
        water_conserved: calculateImpact.data.water_conserved,
      });
    }
  }, [calculateImpact.data]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setError(null);

    // Validation
    if (!activityData.category || activityData.value <= 0 ||!activityData.unit) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        category: activityData.category,
        value: activityData.value,
        unit: activityData.unit,
        timestamp: activityData.timestamp,
        notes: activityData.notes || undefined,
        image_url: activityData.image_url || undefined,
      };

      if (activityId) {
        // Update existing activity
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/activities/${activityId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${currentUser?.auth_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Create new activity
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/activities`,
          {...payload, user_id: currentUser?.id },
          {
            headers: {
              Authorization: `Bearer ${currentUser?.auth_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Reset form and navigate
      setActivityData({
        category: null,
        value: 0,
        unit: '',
        timestamp: new Date().toISOString(),
        notes: null,
        image_url: null,
      });
      setImpactPreview({ co2_saved: 0, water_conserved: 0 });
      navigate('/home');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save activity';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivityData(prev => ({...prev, [name]: value }));
    setError(null);
  };

  // Handle file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload the file and get a URL
      setActivityData(prev => ({...prev, image_url: file.name }));
    }
  };

  // Geolocation handling
  useEffect(() => {
    if (useGeolocation) {
      if (!navigator.geolocation) {
        setGeolocationError('Geolocation is not supported by your browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setActivityData(prev => ({
           ...prev,
            notes: prev.notes 
             ? `${prev.notes}\nGeolocation: ${position.coords.latitude}, ${position.coords.longitude}` 
              : `Geolocation: ${position.coords.latitude}, ${position.coords.longitude}`
          ));
        },
        (error) => {
          setGeolocationError('Unable to retrieve your location.');
        }
      );
    }
  }, [useGeolocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Log Activity</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={activityData.category || ''}
              onChange={handleInputChange}
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              <option value="transport">Transport</option>
              <option value="energy">Energy</option>
              <option value="waste">Waste</option>
              <option value="diet">Diet</option>
              <option value="water">Water</option>
            </select>
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Value
            </label>
            <input
              id="value"
              name="value"
              type="number"
              step="0.01"
              min="0"
              value={activityData.value}
              onChange={handleInputChange}
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter value"
            />
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <input
              id="unit"
              name="unit"
              type="text"
              value={activityData.unit}
              onChange={handleInputChange}
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., miles, kWh"
            />
          </div>

          {/* Timestamp */}
          <div>
            <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-2">
              Date/Time
            </label>
            <input
              id="timestamp"
              name="timestamp"
              type="datetime-local"
              value={activityData.timestamp.slice(0, 16)}
              onChange={handleInputChange}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={activityData.notes || ''}
              onChange={handleInputChange}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Attach Photo (optional)
            </label>
            <input
              id="image"
              name="image"
              type="file"
              onChange={handleImageUpload}
              className="relative font-medium text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              accept="image/*"
            />
            {activityData.image_url && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">Selected: {activityData.image_url}</span>
              </div>
            )}
          </div>

          {/* Geolocation Toggle */}
          <div>
            <label className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Include Geolocation</span>
              <span className="flex items-center">
                <input
                  type="checkbox"
                  onChange={(e) => setUseGeolocation(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </span>
            </label>
            {geolocationError && (
              <div className="mt-2 text-sm text-red-500">{geolocationError}</div>
            )}
          </div>

          {/* Impact Preview */}
          {impactLoading? (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <p className="text-sm text-blue-700">Calculating impact...</p>
            </div>
          ) : (
            (impactPreview.co2_saved > 0 || impactPreview.water_conserved > 0) && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Impact Preview</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">CO2 Saved:</span>
                    <span className="text-sm text-gray-900">{impactPreview.co2_saved} kg</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Water Conserved:</span>
                    <span className="text-sm text-gray-900">{impactPreview.water_conserved} liters</span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || impactLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#3B82F6' }}
            >
              {isSubmitting? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {activityId? 'Updating...' : 'Submitting...'}
                </span>
              ) : (
                activityId? 'Update Activity' : 'Log Activity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UV_ActivityForm;