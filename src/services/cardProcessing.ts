import { supabase } from '../lib/supabase';
import type { ProcessCardResponse } from '../types';

const PROCESS_CARD_URL = import.meta.env.VITE_PROCESS_CARD_URL;

if (!PROCESS_CARD_URL) {
  throw new Error('Missing VITE_PROCESS_CARD_URL environment variable');
}

export async function processCard(file: File): Promise<ProcessCardResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session. Please log in to upload cards.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_extension', file.name.split('.').pop() || '');

  const response = await fetch(PROCESS_CARD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to process card: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Response is an array, return the first item
  return Array.isArray(data) ? data[0] : data;
}
