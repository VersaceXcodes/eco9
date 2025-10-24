import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useIsMutating } from '@tanstack/react-query';
import axios from 'axios';

const mockTestimonials = [
  {
    user: {
      id: 'user1',
      name: 'Jane Doe',
      profile_image_url: 'https://via.placeholder.com/150',
    },
    quote: 'eco9 has transformed how I think about sustainability!',
  },
  {
    user: {
      id: 'user2',
      name: 'John Smith',
      profile_image_url: 'https://via.placeholder.com/150',
    },
    quote: 'The community support is amazing!',
  },
];

const UV_Landing: React.FC = () => {
  const navigate = useNavigate();
  
  // Authentication check
  const isAuthenticated = useAppStore(
    (state) => state.authentication_state.authentication_status.is_authenticated
  );
  const isLoadingAuth = useAppStore(
    (state) => state.authentication_state.authentication_status.is_loading
  );

  // Redirect if authenticated
  useEffect(() => {
    if (isLoadingAuth) return;
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  // Fetch featured challenges
  const { data: featuredChallenges, isLoading: isChallengesLoading, error } = useQuery({
    queryKey: ['featuredChallenges'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges`,
        { params: { featured: true } }
      );
      return response.data;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // State for testimonials carousel
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Handle carousel navigation
  const handleNextTestimonial = () => {
    setCurrentTestimonial(
      currentTestimonial + 1 === mockTestimonials.length? 0 : currentTestimonial + 1
    );
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonial(
      currentTestimonial - 1 < 0? mockTestimonials.length - 1 : currentTestimonial - 1
    );
  };

  return (
    <>
      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-blue-50 to-green-100 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight sm:leading-snug">
              Track, Learn, and Grow Your Eco Impact
            </h1>
            <p className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of eco-conscious users achieving their sustainability goals
            </p>
            
            <div className="mt-12 sm:mt-16 flex justify-center sm:justify-start flex-wrap gap-4">
              <Link
                to="/register"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-300 hover:shadow-green-400"
              >
                Sign Up Free
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-all border border-gray-300"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why eco9?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the key features that make eco9 the ultimate sustainability platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-6">
                <svg className="w-10 h-10 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5M5 12a5 5 0 018 0 5 5 0 00-8 0zm7 10v-2a5 5 0 00-8 0v2m0-5a5 5 0 018 0 5 5 0 000-8 0z"></path>
                </svg>
                <h3 className="text-xl font-semibold">Activity Tracking</h3>
              </div>
              <p className="text-gray-600">
                Easily log your daily sustainable actions with smart suggestions and geolocation support
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-6">
                <svg className="w-10 h-10 text-green-600 mr-4" fill="none" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v18l8-7.586 8 7.586h-6a2 2 0 1 0-2-2zm-3 16l-1.707-1.707a.75.75 0 011.060.541l2.12-2.12a.75.75 0 01.541 1.06l-2.12 2.12a.75.75 0 01-1.060 0z"></path>
                </svg>
                <h3 className="text-xl font-semibold">Impact Dashboard</h3>
              </div>
              <p className="text-gray-600">
                Visualize your environmental impact with interactive charts and real-time metrics
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-6">
                <svg className="w-10 h-10 text-yellow-600 mr-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 4L8.686 7.314A8 8 0 018 16c5.373 0 10 3.627 10 8s-4.627 8-10 8-10-3.627-10-8 0-5.373 4.314-8 8-8z"></path>
                </svg>
                <h3 className="text-xl font-semibold">Community Challenges</h3>
              </div>
              <p className="text-gray-600">
                Join time-bound challenges, compete on leaderboards, and earn rewards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What Our Users Say</h2>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="flex items-center justify-between absolute left-0 right-0 top-1/4 z-10">
              <button
                onClick={handlePrevTestimonial}
                className="bg-white rounded-full shadow p-2 transition-all duration-200 hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11h-3m0 0l-9 9m9-9l-9-9M7 22V2a2 2 0 012-2h4a2 2 0 014 0v20a2 2 0 01-14 0z"></path>
                </svg>
              </button>
              <button
                onClick={handleNextTestimonial}
                className="bg-white rounded-full shadow p-2 transition-all duration-200 hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13l2-2V4a2 2 0 012-2h4a2 2 0 012 2v10l2-2h-6m-2 4a4 4 0 00.01 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </button>
            </div>
            
            <div className="slide">
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-4">
                  <img
                    src={mockTestimonials[currentTestimonial].user.profile_image_url}
                    alt={mockTestimonials[currentTestimonial].user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <blockquote className="text-gray-800 text-xl font-semibold">{mockTestimonials[currentTestimonial].quote}</blockquote>
                    <p className="text-gray-500 mt-2">— {mockTestimonials[currentTestimonial].user.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">Download the eco9 App</h2>
          
          <div className="flex flex-col md:flex-row justify-center gap-8">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <img src="https://via.placeholder.com/200x200" alt="App Store" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">App Store</h3>
              <p className="text-gray-600">Download for iOS devices</p>
            </div>
            
            <div className="w-full md:w-1/2 lg:w-1/3">
              <img src="https://via.placeholder.com/200x200" alt="Google Play" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Google Play</h3>
              <p className="text-gray-600">Available for Android devices</p>
            </div>
            
            <div className="w-full md:w-1/2 lg:w-1/3">
              <img src="https://via.placeholder.com/200x200" alt="QR Code" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">QR Code</h3>
              <p className="text-gray-600">Scan to download mobile app (Phase 2)</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default UV_Landing;