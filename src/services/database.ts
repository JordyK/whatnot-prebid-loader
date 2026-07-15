import { supabase } from '../lib/supabase';
import type { Session, Card } from '../types';

export interface ImportSalesResponse {
  matched: number;
  total: number;
  unmatched?: string[];
}

export async function createSession(userId: string, name: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, name, status: 'in_progress' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getResumableSession(userId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      cards (
        id,
        status
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }

  // Check if session has pending_review cards
  const hasPendingCards = data.cards?.some((card: any) => card.status === 'pending_review');
  if (!hasPendingCards) return null;

  return data;
}

export async function insertCard(sessionId: string, cardData: {
  file_name: string;
  image_url: string;
  brand_set: string | null;
  player_name: string | null;
  serial_number: string | null;
  ai_title: string;
  ai_description: string;
  needs_review: string; // "TRUE" or "FALSE"
  review_reason: string;
}): Promise<Card> {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      session_id: sessionId,
      status: 'pending_review',
      processed_at: new Date().toISOString(),
      needs_review: cardData.needs_review === 'TRUE',
      review_reason: cardData.review_reason || null,
      brand_set: cardData.brand_set || null,
      player_name: cardData.player_name || null,
      serial_number: cardData.serial_number || null,
      file_name: cardData.file_name,
      image_url: cardData.image_url,
      ai_title: cardData.ai_title,
      ai_description: cardData.ai_description,
      starting_price: 1,
      shipping_profile: 'Pack (50 g)',
      condition: 'Raw - Very Good',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingCards(sessionId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPendingCardCount(sessionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'pending_review');

  if (error) throw error;
  return count || 0;
}

export async function confirmCard(
  cardId: string,
  finalTitle: string,
  finalDescription: string,
  startingPrice: number,
  shippingProfile: string,
  condition: string
): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .update({
      final_title: finalTitle,
      final_description: finalDescription,
      starting_price: startingPrice,
      shipping_profile: shippingProfile,
      condition,
      status: 'confirmed',
    })
    .eq('id', cardId);

  if (error) throw error;
}

export async function getConfirmedCards(sessionId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function completeSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

export async function getUserSessions(userId: string): Promise<SessionWithCardCount[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sessionsError) throw sessionsError;

  if (!sessions || sessions.length === 0) {
    return [];
  }

  // Get all card counts in a single query using group by
  const sessionIds = sessions.map(s => s.id);
  const { data: cardCounts, error: cardCountsError } = await supabase
    .from('cards')
    .select('session_id, status')
    .in('session_id', sessionIds);

  if (cardCountsError) throw cardCountsError;

  // Calculate counts per session
  const countsMap = new Map<string, { total: number; pending: number }>();
  (cardCounts || []).forEach(card => {
    const current = countsMap.get(card.session_id) || { total: 0, pending: 0 };
    current.total++;
    if (card.status === 'pending_review') {
      current.pending++;
    }
    countsMap.set(card.session_id, current);
  });

  const sessionsWithCounts = sessions.map(session => {
    const counts = countsMap.get(session.id) || { total: 0, pending: 0 };
    return {
      ...session,
      card_count: counts.total,
      pending_count: counts.pending,
    };
  });

  return sessionsWithCounts;
}

export interface SessionWithCardCount extends Session {
  card_count: number;
  pending_count: number;
}

export interface UserSettings {
  user_id: string;
  kategorie: string;
  unterkategorie: string;
  verkaufsformat: string;
  preis: string;
  versandprofil: string;
  zustand: string;
  monthly_card_limit: number;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }

  return data;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;
}

export async function getUsageStats(userId: string): Promise<{ total: number; thisMonth: number }> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Get total count
  const { count: totalCount, error: totalError } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (totalError) throw totalError;

  // Get this month's count
  const { count: monthCount, error: monthError } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth);

  if (monthError) throw monthError;

  return {
    total: totalCount || 0,
    thisMonth: monthCount || 0,
  };
}

export async function getAllCards(sessionId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateCard(
  cardId: string,
  updates: {
    title?: string;
    description?: string;
    verkaufsformat?: string;
    preis?: string;
    versandprofil?: string;
    zustand?: string;
    sold_price?: number | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .update({
      ai_title: updates.title,
      ai_description: updates.description,
      final_title: updates.title,
      final_description: updates.description,
      verkaufsformat: updates.verkaufsformat,
      preis: updates.preis,
      versandprofil: updates.versandprofil,
      zustand: updates.zustand,
      sold_price: updates.sold_price,
    })
    .eq('id', cardId);

  if (error) throw error;
}

export async function deleteCard(cardId: string): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

export async function importSalesPdf(sessionId: string, file: File): Promise<ImportSalesResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', sessionId);

  const response = await fetch(import.meta.env.VITE_IMPORT_SALES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Import failed: ${response.statusText}`);
  }

  const data: ImportSalesResponse = await response.json();
  return data;
}
