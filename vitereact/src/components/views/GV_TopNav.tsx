import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_TopNav: React.FC = () => {
  // Zustand store selectors (individual properties)
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const notifications = useAppStore(state => state.notifications.notifications);
  const unreadCount = useAppStore(state => state.notifications.unread_count);
  const fetchNotifications = useAppStore(state => state.fetch_notifications);
  const markNotificationRead = useAppStore(state => state.mark_notification_read);
  const logoutUser = useAppStore(state => state.logout_user);

  // Local state for dropdowns and mobile menu
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications when component mounts or authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Handle marking notification as read
  const handleMarkRead = (notificationId: string) => {
    markNotificationRead(notificationId);
    setNotificationsOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logoutUser();
    // Optionally close all dropdowns
    setProfileMenuOpen(false);
    setNotificationsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link 
                to="/home" 
                className="text-xl font-bold text-gray-800"
                aria-label="Go to Home Dashboard"
              >
                eco9
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Main Navigation Links */}
              <div className="flex space-x-6">
                <Link
                  to="/home"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  aria-label="Home"
                >
                  Home
                </Link>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  aria-label="Impact Dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  to="/challenges"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  aria-label="Community Challenges"
                >
                  Challenges
                </Link>
                <Link
                  to="/learn"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  aria-label="Educational Content"
                >
                  Learn
                </Link>
                <Link
                  to="/forum"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  aria-label="Community Forum"
                >
                  Community
                </Link>
              </div>

              {/* Auth Controls */}
              {isAuthenticated? (
                <>
                  {/* Notifications Bell */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      onClick={() => setNotificationsOpen(prev =>!prev)}
                      aria-expanded={isNotificationsOpen}
                      aria-label="Notifications"
                    >
                      <svg 
                        className={`h-6 w-6 ${unreadCount > 0? 'text-red-600' : 'text-gray-500'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M20 14a8 8 0 11-16 0 8 8 0 016 0zM6.5 7h.75a3.5 3.5 0 011.33 2.25l5.14 4.21a4 4 0 00.75 1.5l4.44 4.44a1 1 0 002.1.7v12.06a1 1 0 01-1.1 1h-6.31l3.16-3.16a4.5 4.5 0 002.69-6.56L19.31 7H6.5z"
                      />
                      {unreadCount > 0 && (
                        <span
                          className="absolute top-0 right-0 inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white"
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                      <div 
                        className="absolute right-0 top-full w-64 mt-1 bg-white shadow-xl rounded-lg overflow-hidden"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="notification-button"
                      >
                        <div className="py-2">
                          {notifications.length === 0? (
                            <p className="px-4 py-3 text-gray-600">No new notifications</p>
                          ) : (
                            notifications.map(notification => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 flex justify-between items-center ${
                                  notification.read? 'text-gray-500' : 'text-gray-900'
                                } ${
                                  notification.read? 'line-through' : ''
                                }`}
                                onClick={() => handleMarkRead(notification.id)}
                                role="menuitem"
                              >
                                <span className={notification.read? 'opacity-70' : ''}>
                                  {notification.message}
                                </span>
                                <time className="text-sm text-gray-500">
                                  {new Date(notification.created_at).toLocaleTimeString()}
                                </time>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="border-t border-gray-100">
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setProfileMenuOpen(prev =>!prev)}
                      aria-expanded={isProfileMenuOpen}
                      aria-label="User profile menu"
                    >
                      <span className="mr-3">{currentUser?.full_name || currentUser?.email}</span>
                      {currentUser?.profile_image_url? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={currentUser?.profile_image_url}
                          alt={currentUser?.full_name || 'User avatar'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40';
                            e.target.onerror = null;
                          }}
                        />
                      ) : (
                        <span className="h-10 w-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
                          {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </button>
                    
                    {/* Profile Menu */}
                    {isProfileMenuOpen && (
                      <div 
                        className="absolute right-0 top-full w-48 bg-white shadow-xl rounded-lg"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="profile-button"
                      >
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setProfileMenuOpen(false)}
                            role="menuitem"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setProfileMenuOpen(false)}
                            role="menuitem"
                          >
                            Settings
                          </Link>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={handleLogout}
                            role="menuitem"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/"
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
                    aria-label="Sign in"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/"
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
                    aria-label="Sign up"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <div className="flex justify-end px-4 py-3">
            <button
              type="button"
              className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setMobileMenuOpen(prev =>!prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle main menu"
            >
              {isMobileMenuOpen? (
                <svg 
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg 
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="bg-white shadow-lg absolute bottom-full left-0 w-full">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/home"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current="page"
                >
                  Home
                </Link>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/challenges"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Challenges
                </Link>
                <Link
                  to="/learn"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Learn
                </Link>
                <Link
                  to="/forum"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Community
                </Link>
                
                {isAuthenticated? (
                  <>
                    <button
                      type="button"
                      className="block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/"
                      className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;