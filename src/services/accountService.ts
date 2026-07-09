import { supabase } from '../lib/supabase';

export async function deleteAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No active session');
  }

  const deleteUrl = import.meta.env.VITE_DELETE_ACCOUNT_URL;
  if (!deleteUrl) {
    throw new Error('Delete account URL not configured');
  }

  const response = await fetch(deleteUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete account: ${errorText}`);
  }
}
