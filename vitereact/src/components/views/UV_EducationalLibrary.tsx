import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// Define types based on Zod schemas and OpenAPI specs
interface EducationalContentItem {
  id: string;
  title: string;
  content_type: string;
  category: string;
  media_url?: string | null;
}

interface EducationalContentResponse {
  items: EducationalContentItem[];
}

const UV_EducationalLibrary: React.FC = () => {
  // Zustand state for authentication
  const isAuthenticated = useAppStore(
    (state) => state.authentication_state.authentication_status.is_authenticated
  );
  const currentUser = useAppStore(
    (state) => state.authentication_state.current_user
  );
  const auth_token = useAppStore(
    (state) => state.authentication_state.auth_token
  );

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // React Query for educational content
  const {
    data: contentData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['educational_contents', selectedCategory, searchQuery],
    queryFn: async () => {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/educational_contents`;
      
      let params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('q', searchQuery);

      const response = await axios.get<EducationalContentResponse>(
        `${apiUrl}?${params.toString()}`,
        auth_token
         ? { headers: { Authorization: `Bearer ${auth_token}` } }
          : {}
      );

      // Transform media_url to use placeholder if null
      return response.data.items.map(item => ({
       ...item,
        media_url: item.media_url || 'https://picsum.photos/200',
      }));
    },
    staleTime: 60000, // 1 minute cache
    refetchOnWindowFocus: false,
  });

  // Handle filter changes
  useEffect(() => {
    refetch();
  }, [selectedCategory, searchQuery, refetch]);

  // Error handling
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">Error loading content</h2>
          <p className="mt-4 text-gray-600">
            Please check your connection and try again.
          </p>
          <button
            onClick={refetch}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <svg className="animate-spin h-8 w-8 mx-auto my-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Loading educational content...</p>
        </div>
      </div>
    );
  }

  // Default empty state
  if (!contentData?.items?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold text-gray-900">No content found</h2>
          <p className="mt-4 text-gray-600">
            Your search or filter criteria returned no results. Try broadening your search or checking another category.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchQuery('');
              refetch();
            }}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <h1 className="text-3xl font-bold text-gray-900 py-6">
                Learning Resource Hub
              </h1>
              
              {/* Search & Filters */}
              <div className="mt-8 space-y-4">
                {/* Search Input */}
                <div className="relative group">
                  <label className="sr-only">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Clear error on input change
                      useAppStore(state => state.clear_auth_error)();
                    }}
                    placeholder="Search educational content..."
                    className="absolute inset-0 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  />
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                </div>
                
                {/* Category Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      useAppStore(state => state.clear_auth_error)();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedCategory === '' 
                       ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {/* Note: In real implementation, categories would be fetched from API */}
                  {[ 'Composting', 'Renewable Energy', 'Zero-Waste', 'Sustainable Diet', 'Water Conservation' ].map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category.toLowerCase());
                        useAppStore(state => state.clear_auth_error)();
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedCategory === category.toLowerCase()
                         ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {contentData?.items.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                {/* Media Preview */}
                <div className="relative h-48">
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="object-cover w-full h-full"
                  />
                  {/* Content Type Badge */}
                  <div className="absolute bottom-2 left-2 bg-white/90 p-1.5 rounded-md">
                    <span className="text-xs font-medium text-gray-800">
                      {item.content_type.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.category}
                  </p>
                  
                  {/* Category Badge */}
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => {
                        console.warn('Content detail navigation not implemented (missing endpoint)');
                      }}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110 4 2 2 0 010-4z-8 5.291a1 1 0 010 1.415l3-1.707a1 1 0 011.192 0l3 1.707a1 1 0 01-1.192.836h-.744a4 4 0 01-2.12-.928 4.005 4.005 0 00-3.356 1.57L4.498 14H2.5a1 1 0 110-2h1.5a3 3 0 104.242 2.34c3.03-.78 5.4-2.83 6.49-5.4a1 1 0 00-1.07-.2 4.002 4.002 0 00-8.78 2.21M7.93 3.21c.75-.69 1.41-1.46 1.83-2.38a3.14 3.14 0 002.02-.94c1.38.34 2.63.82 3.46 1.51a1 1 0 002 0c1.38-.34 2.63-.82 3.46-1.51 1.38.34 2.63.82 3.46 1.51a1 1 0 002 0c-1.38-.34-2.63-.82-3.46-1.51-1.38-.34-2.63-.82-3.46-1.51a1 1 0 00-2 0M7 14a1 1 0 01-1 1h2a1 1 0 110 2h-2a1 1 0 011-1 1h2zM7 8a1 1 0 00-1-1V5a1 1 0 012 0v3m5 4a1 1 0 01-1 1h-1m-5v3a1 1 0 100 2v-3h1z" />
                      <span className="text-sm">View Details</span>
                    </button>
                    
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          // Handle certificate download if authenticated
                          console.log('Certificate download not implemented');
                        }}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 2a1 1 0 011 1v12a1 1 0 11-2 0V3a1 1 0 110 2v10a1 1 0 11-2 0V3a1 1 0 011-1z m-1 9a1 1 0 01-1 1v4a1 1 0 011 1h2a1 1 0 011 1v-4a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="text-sm">Download Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default UV_EducationalLibrary;