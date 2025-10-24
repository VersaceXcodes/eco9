import { create, Store } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  profile_image_url?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  category: string;
  value: number;
  unit: string;
  timestamp: string;
  impact: {
    co2_saved: number;
    water_conserved: number;
  };
}

export interface ImpactMetrics {
  co2_saved: number;
  water_conserved: number;
  waste_diverted: number;
  trees_saved: number;
  historical_data: Array<{
    date: string;
    co2_saved: number;
    water_conserved: number;
  }>;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ActivityCategory {
  category: string;
  default_impact_multiplier: {
    co2: number;
    water: number;
  };
}

// Auth State
interface AuthState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

// App State
interface AppState {
  auth_state: AuthState;
  activity_history: {
    recent_activities: Activity[];
    total_impact: ImpactMetrics;
  };
  notifications: {
    unread_count: number;
    notifications: Notification[];
  };
  cached_data: {
    activity_categories: ActivityCategory[];
    impact_methodology: string | null;
  };
  // Actions
  login_user: (email: string, password: string) => Promise<void>;
  register_user: (email: string, password: string, full_name?: string) => Promise<void>;
  logout_user: () => void;
  initialize_auth: () => Promise<void>;
  clear_auth_error: () => void;
  update_user_profile: (userData: Partial<User>) => void;
  set_recent_activities: (activities: Activity[]) => void;
  set_total_impact: (impact: ImpactMetrics) => void;
  set_notifications: (notifications: Notification[]) => void;
  mark_notification_read: (notificationId: string) => void;
  set_activity_categories: (categories: ActivityCategory[]) => void;
  set_impact_methodology: (methodology: string) => void;
}

// Create the store
export const useAppStore = create<AppState>(
  persist(
    (set) => ({
      // Initial state
      auth_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },
      activity_history: {
        recent_activities: [],
        total_impact: {
          co2_saved: 0,
          water_conserved: 0,
          waste_diverted: 0,
          trees_saved: 0,
          historical_data: [],
        },
      },
      notifications: {
        unread_count: 0,
        notifications: [],
      },
      cached_data: {
        activity_categories: [],
        impact_methodology: null,
      },

      // Actions
      login_user: async (email: string, password: string) => {
        set((state) => ({
          auth_state: {
           ...state.auth_state,
            authentication_status: {
             ...state.auth_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
            { email, password },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { user, token } = response.data;

          set((state) => ({
            auth_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set((state) => ({
            auth_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      register_user: async (email: string, password: string, full_name?: string) => {
        set((state) => ({
          auth_state: {
           ...state.auth_state,
            authentication_status: {
             ...state.auth_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register`,
            { email, password, full_name },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { user, token } = response.data;

          set((state) => ({
            auth_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));
          return response;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set((state) => ({
            auth_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: errorMessage,
            },
          }));
          throw new Error(errorMessage);
        }
      },

      logout_user: () => {
        set(() => ({
          auth_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
        }));
      },

      initialize_auth: async () => {
        const { auth_state } = get();
        const token = auth_state.auth_token;

        if (!token) {
          set((state) => ({
            auth_state: {
             ...state.auth_state,
              authentication_status: {
               ...state.auth_state.authentication_status,
                is_loading: false,
              },
            },
          }));
          return;
        }

        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const { user } = response.data;

          set((state) => ({
            auth_state: {
              current_user: user,
              auth_token: token,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
              error_message: null,
            },
          }));
        } catch (error) {
          set(() => ({
            auth_state: {
              current_user: null,
              auth_token: null,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
              error_message: null,
            },
          }));
        }
      },

      clear_auth_error: () => {
        set((state) => ({
          auth_state: {
           ...state.auth_state,
            error_message: null,
          },
        }));
      },

      update_user_profile: (userData: Partial<User>) => {
        set((state) => ({
          auth_state: {
           ...state.auth_state,
            current_user: state.auth_state.current_user
             ? {...state.auth_state.current_user,...userData }
              : null,
          },
        }));
      },

      set_recent_activities: (activities: Activity[]) => {
        set(() => ({ activity_history: { recent_activities: activities, total_impact: activity_history.total_impact } }));
      },

      set_total_impact: (impact: ImpactMetrics) => {
        set(() => ({ activity_history: { recent_activities: activity_history.recent_activities, total_impact: impact } }));
      },

      set_notifications: (notifications: Notification[]) => {
        const unreadCount = notifications.filter(n =>!n.read).length;
        set(() => ({ notifications: { notifications, unread_count: unreadCount } }));
      },

      mark_notification_read: (notificationId: string) => {
        set((state) => {
          const notifications = state.notifications.notifications.map(n => 
            n.id === notificationId? {...n, read: true } : n
          );
          const unreadCount = notifications.filter(n =>!n.read).length;
          return { notifications: { notifications, unread_count: unreadCount } };
        });
      },

      set_activity_categories: (categories: ActivityCategory[]) => {
        set(() => ({ cached_data: {...cached_data, activity_categories: categories } }));
      },

      set_impact_methodology: (methodology: string) => {
        set(() => ({ cached_data: {...cached_data, impact_methodology: methodology } }));
      },
    }),
    {
      name: 'app-auth-storage',
      partialize: (state) => ({
        auth_state: {
          current_user: state.auth_state.current_user,
          auth_token: state.auth_state.auth_token,
          authentication_status: {
            is_authenticated: state.auth_state.authentication_status.is_authenticated,
            is_loading: false,
          },
          error_message: null,
        },
      }),
    }
  )
);

export type { User, Activity, ImpactMetrics, Notification, ActivityCategory };