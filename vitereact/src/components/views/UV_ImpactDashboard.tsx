import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { axios } from '@/utils/apiClient';
import { User } from '@/store/main';

const UV_ImpactDashboard: React.FC = () => {
  // URL Parameters
  const { range = 'monthly' } = useParams();
  
  // Global State
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const impactMethodology = useAppStore(state => state.cached_data.impact_methodology);
  
  // Data Fetching
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['impact-metrics'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/impact`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      return response.data;
    }
  });

  const { data: historicalData, isLoading: historicalLoading, error: historicalError } = useQuery({
    queryKey: ['impact-historical', range],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/impact`,
        {
          params: { range },
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      return response.data.historical_data;
    },
    enabled:!!range
  });

  // Local State
  const [showMethodology, setShowMethodology] = useState(false);
  const [exportType, setExportType] = useState('pdf');

  // Metric Calculation
  const co2Change = metrics?.co2_saved - (metrics?.historical_data?.[0]?.co2_saved || 0);
  const waterChange = metrics?.water_conserved - (metrics?.historical_data?.[0]?.water_conserved || 0);

  // Export Handling
  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/impact/export/${type}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `impact_report_${type === 'pdf'? 'pdf' : 'csv'}`);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Error Handling
  if (metricsError || historicalError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-700 mb-6">
            {metricsError?.message || historicalError?.message || 'Failed to load impact data'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (metricsLoading || historicalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Loading Impact Data</h1>
          <p className="text-gray-600 max-w-lg mx-auto">Please wait while we fetch your environmental impact metrics...</p>
        </div>
        <div className="flex space-x-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-transparent rounded-full"></div>
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-transparent rounded-full"></div>
          <div className="animate-spin h-8 w-8 border-4 border-yellow-500 border-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Impact Dashboard
              </h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setExportType('pdf')}
                  className={`px-4 py-2 rounded-lg ${exportType === 'pdf'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setExportType('csv')}
                  className={`px-4 py-2 rounded-lg ${exportType === 'csv'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport(exportType)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:bg-blue-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'CO₂ Saved', value: metrics?.co2_saved || 0, unit: 'kg', change: co2Change },
              { label: 'Water Conserved', value: metrics?.water_conserved || 0, unit: 'liters', change: waterChange },
              { label: 'Waste Diverted', value: metrics?.waste_diverted || 0, unit: 'kg' },
              { label: 'Trees Saved', value: metrics?.trees_saved || 0, unit: 'trees' }
            ].map((metric, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{metric.label}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{metric.value.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{metric.unit}</p>
                  </div>
                  {metric.change!== undefined && (
                    <div className={`ml-4 text-${co2Change >= 0? 'green' : 'red'}-500 flex items-center`}>
                      <span className="mr-1">{Math.abs(metric.change)} {metric.unit}</span>
                      <span className={`text-${co2Change >= 0? 'green' : 'red'}-500`}>
                        {co2Change >= 0? '↑' : '↓'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`bg-blue-500 h-2 rounded-full`}
                    style={{ width: `${(metric.value / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Trend Graphs */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Historical Trends</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="relative h-64 sm:h-80">
                {/* Chart implementation would go here */}
                <svg className="absolute inset-0" viewBox="0 0 400 300">
                  {/* Example line chart */}
                  <path d="M20 280 Q80 200 140 240 Q200 280 260 220 Q320 160 380 240" 
                    stroke="#3B82F6" 
                    strokeWidth="2" 
                    fill="none" 
                  />
                  {/* Axis labels */}
                  <text x="10" y="290" className="text-gray-500 font-medium">0</text>
                  <text x="10" y="190" className="text-gray-500 font-medium">500</text>
                  <text x="10" y="90" className="text-gray-500 font-medium">1000</text>
                  <text x="200" y="310" className="text-gray-500 font-medium">Jan</text>
                  <text x="300" y="310" className="text-gray-500 font-medium">Dec</text>
                </svg>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors hover:bg-gray-200"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => setShowMethodology(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:bg-blue-700"
                >
                  Show Calculation Method
                </button>
              </div>
            </div>
          </div>

          {/* Virtual Forest */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Virtual Forest</h2>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(Math.min(20, (metrics?.trees_saved || 0) % 20))].map((_, index) => (
                <div key={index} className="animate-bounce delay-500">
                  🌳
                </div>
              ))}
            </div>
            <p className="mt-4 text-gray-600">
              {`You've saved ${metrics?.trees_saved || 0} trees!`} 
              <span className="text-blue-600 cursor-pointer hover:underline">
                How is this calculated?
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Methodology Tooltip */}
      {showMethodology && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Calculation Methodology</h2>
            <p className="text-gray-700 mb-6">
              {impactMethodology || 'Our calculations are based on EPA standards and scientific research. For example, biking 1 mile saves approximately 0.4kg of CO2 compared to driving.'}
            </p>
            <button
              onClick={() => setShowMethodology(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_ImpactDashboard;