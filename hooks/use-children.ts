import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useChildrenStore } from '@/store/children-store';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { Child, CreateChildInput, UpdateChildInput } from '@/types';

// Free tier: 2 children. Premium: unlimited.
const MAX_CHILDREN_FREE = 2;

export const useChildren = () => {
  const { user } = useAuthStore();
  const { isPremium } = useSubscriptionStore();
  const {
    children,
    isLoading,
    error,
    setChildren,
    addChild,
    updateChild,
    removeChild,
    setLoading,
    setError,
  } = useChildrenStore();

  const maxChildren = isPremium ? Infinity : MAX_CHILDREN_FREE;

  const fetchChildren = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setChildren(data as Child[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch children';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, setChildren, setLoading, setError]);

  const createChild = useCallback(async (input: CreateChildInput) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    if (children.length >= maxChildren) {
      return {
        success: false,
        error: isPremium
          ? 'Failed to add child'
          : `Free plan allows up to ${MAX_CHILDREN_FREE} children. Upgrade for unlimited.`,
      };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          name: input.name.trim(),
        })
        .select()
        .single();

      if (createError) throw createError;

      addChild(data as Child);
      return { success: true, child: data as Child };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create child';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user, children.length, maxChildren, isPremium, addChild, setLoading, setError]);

  const editChild = useCallback(async (id: string, input: UpdateChildInput) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('children')
        .update({ name: input.name.trim() })
        .eq('id', id)
        .eq('parent_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      updateChild(id, data as Partial<Child>);
      return { success: true, child: data as Child };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update child';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user, updateChild, setLoading, setError]);

  const deleteChild = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('children')
        .delete()
        .eq('id', id)
        .eq('parent_id', user.id);

      if (deleteError) throw deleteError;

      removeChild(id);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete child';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user, removeChild, setLoading, setError]);

  const canAddChild = children.length < maxChildren;

  return {
    children,
    isLoading,
    error,
    fetchChildren,
    createChild,
    editChild,
    deleteChild,
    canAddChild,
    maxChildren,
    isPremium,
  };
};
