// Supabase database types
export type SessionStatus = 'in_progress' | 'completed';
export type CardStatus = 'pending_review' | 'confirmed';

export interface Session {
  id: string;
  user_id: string;
  name: string;
  status: SessionStatus;
  created_at: string;
}

export interface Card {
  id: string;
  session_id: string;
  file_name: string;
  image_url: string;
  brand_set: string | null;
  player_name: string | null;
  serial_number: string | null;
  ai_title: string;
  ai_description: string;
  final_title: string | null;
  final_description: string | null;
  starting_price: number | null;
  shipping_profile: string | null;
  condition: string | null;
  needs_review: boolean;
  review_reason: string | null;
  status: CardStatus;
  processed_at: string | null;
  created_at: string;
  kategorie: string | null;
  unterkategorie: string | null;
  verkaufsformat: string | null;
  preis: string | null;
  versandprofil: string | null;
  zustand: string | null;
}

// n8n process card webhook response
export interface ProcessCardResponse {
  file_name: string;
  image_url: string;
  title: string;
  description: string;
  needs_review: string; // "TRUE" or "FALSE"
  review_reason: string;
  brand_set: string;
  player_name: string;
  serial_number: string;
  processed_at: string;
}
