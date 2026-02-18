import { create } from 'zustand';
import { Child } from '@/types';

interface ChildrenState {
  children: Child[];
  isLoading: boolean;
  error: string | null;
  setChildren: (children: Child[]) => void;
  addChild: (child: Child) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  removeChild: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChildren: () => void;
}

export const useChildrenStore = create<ChildrenState>((set) => ({
  children: [],
  isLoading: false,
  error: null,
  setChildren: (children) => set({ children }),
  addChild: (child) => set((state) => ({ children: [...state.children, child] })),
  updateChild: (id, updates) =>
    set((state) => ({
      children: state.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeChild: (id) =>
    set((state) => ({
      children: state.children.filter((c) => c.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearChildren: () => set({ children: [], error: null }),
}));
