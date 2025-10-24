import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_GoalSetting: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const clearAuthError = useAppStore(state => state.clear_auth_error);

  const [form, setForm] = useState({
    title: '',
    targetValue: '',
    targetUnit: '',
    deadline: '',
  });
  const [editingGoal, setEditingGoal] = useState(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch goals
  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/goals`,
        {
          headers: { Authorization: `Bearer ${auth_token}` },
        }
      );
      return response.data;
    },
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (newGoal) =>
      axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/goals`,
        newGoal,
        { headers: { Authorization: `Bearer ${auth_token}` } }
      ),
    onError: (error) => {
      setFormError(error.response?.data?.message || error.message || 'Failed to create goal');
    },
    onSuccess: () => {
      goalsQuery.refetch();
      setFormError(null);
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: (updatedGoal) =>
      axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/goals/${updatedGoal.id}`,
        updatedGoal,
        { headers: { Authorization: `Bearer ${auth_token}` } }
      ),
    onError: (error) => {
      setFormError(error.response?.data?.message || error.message || 'Failed to update goal');
    },
    onSuccess: () => {
      goalsQuery.refetch();
      setFormError(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setFormError(null);

    const goalData = {
      title: form.title,
      target_value: parseFloat(form.targetValue),
      target_unit: form.targetUnit,
      deadline: form.deadline,
    };

    if (editingGoal) {
      const updatedGoal = {...goalData, id: editingGoal.id };
      updateGoalMutation.mutate(updatedGoal);
    } else {
      createGoalMutation.mutate(goalData);
    }

    // Reset form
    setForm({
      title: '',
      targetValue: '',
      targetUnit: '',
      deadline: '',
    });
    setEditingGoal(null);
  };

  const editGoal = (goal: any) => {
    setForm({
      title: goal.title,
      targetValue: goal.target_value.toString(),
      targetUnit: goal.target_unit,
      deadline: goal.deadline,
    });
    setEditingGoal(goal);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Goal Management</h1>
          
          {/* Error Message */}
          {formError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

          {/* Goal Form */}
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingGoal? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="targetValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Value
                </label>
                <input
                  id="targetValue"
                  type="number"
                  step="any"
                  value={form.targetValue}
                  onChange={(e) => setForm({...form, targetValue: e.target.value})}
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="targetUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Unit
                </label>
                <select
                  id="targetUnit"
                  value={form.targetUnit}
                  onChange={(e) => setForm({...form, targetUnit: e.target.value})}
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Unit</option>
                  <option value="kg CO2 saved">kg CO2 saved</option>
                  <option value="miles biked">Miles Biked</option>
                  <option value="kWh saved">kWh Saved</option>
                  <option value="liters conserved">Liters Conserved</option>
                </select>
              </div>
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({...form, deadline: e.target.value})}
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={createGoalMutation.isMutating || updateGoalMutation.isMutating}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createGoalMutation.isMutating || updateGoalMutation.isMutating? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingGoal? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingGoal? 'Update Goal' : 'Create Goal'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Goals List */}
          {goalsQuery.isLoading? (
            <div className="text-center py-6">Loading goals...</div>
          ) : goalsQuery.isError? (
            <div className="text-center text-red-600 py-6">
              Error fetching goals: {goalsQuery.error.message}
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Your Goals</h2>
              <div className="space-y-6">
                {goalsQuery.data?.map((goal: any) => (
                  <div key={goal.id} className="flex justify-between items-start border border-gray-200 rounded-lg p-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Target: {goal.target_value} {goal.target_unit} by {goal.deadline}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Progress:</span>
                          <span className="text-sm text-gray-500 ml-2">{Math.round(goal.progress * 100)}%</span>
                        </div>
                        <div className="relative bg-gray-200 rounded-full h-2">
                          <div
                            className={`absolute left-0 right-auto inset-y-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full h-full`}
                            style={{ width: `${goal.progress * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => editGoal(goal)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_GoalSetting;