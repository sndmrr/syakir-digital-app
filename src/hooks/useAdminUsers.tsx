import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminUserDirectoryItem {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  role: 'admin' | 'mitra' | 'unknown';
  can_edit_data?: boolean;
  can_delete_data?: boolean;
  can_lunas_data?: boolean;
  tanggal_setor?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export const fetchAdminUsers = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const { data, error } = await supabase.functions.invoke('manage-users', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: { action: 'list' },
  });

  if (error) {
    throw error;
  }

  return ((data as { users?: AdminUserDirectoryItem[] })?.users ?? []) as AdminUserDirectoryItem[];
};

export const useAdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextUsers = await fetchAdminUsers();
      setUsers(nextUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user]);

  return { users, loading, refresh };
};