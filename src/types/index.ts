export interface CardData {
  done: false;
  row_id: string;
  file_name: string;
  image_url: string;
  ai_title: string;
  ai_description: string;
  needs_review: boolean;
  review_reason: string | null;
  remaining: number;
}

export interface DoneResponse {
  done: true;
}

export type GetCardResponse = CardData | DoneResponse;

export interface ConfirmCardRequest {
  row_id: string;
  title: string;
  description: string;
  image_url: string;
  file_name: string;
  starting_price: number;
  shipping_profile: string;
  condition: string;
}

export interface ConfirmCardResponse {
  success: true;
}

// Raw n8n webhook response format
export interface N8nCardData {
  row_number: number;
  file_name: string;
  file_link: string;
  image_url: string;
  title: string;
  description: string;
  needs_review: string;
  review_reason: string;
  brand_set: string;
  player_name: string;
  serial_number: string;
  processed_at: string;
  reviewed: string;
}

export type N8nResponse = N8nCardData[];
