import { create } from 'zustand';
import { User } from '@/types';

// typescript interface for the auth store state and actions
// Blueprint for the auth store, defining the shape of the state and the actions to manipulate it
interface AuthState {
  //state fields
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Held here rather than in a route param: on web, params land in the URL and browser history.
  pendingEmail: string | null;
  //functions to update the state
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingEmail: (email: string | null) => void;
  logout: () => void;
}

// Actual data + Business logic for the auth store, implementing the defined interface
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  pendingEmail: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setPendingEmail: (pendingEmail) => set({ pendingEmail }),
  logout: () => set({ user: null, isAuthenticated: false, pendingEmail: null }),
}));
