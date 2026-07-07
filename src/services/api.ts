import { config } from './config';
import type { GetCardResponse, ConfirmCardRequest, ConfirmCardResponse, N8nResponse, N8nCardData } from '../types';

export async function getTotalCount(): Promise<number> {
  if (!config.countUrl) {
    return 0;
  }
  
  const response = await fetch(config.countUrl);
  
  if (!response.ok) {
    console.warn('Failed to fetch total count:', response.status);
    return 0;
  }
  
  const text = await response.text();
  if (!text.trim()) {
    return 0;
  }
  
  try {
    const data = JSON.parse(text);
    // Handle different response formats
    if (typeof data === 'number') {
      return data;
    }
    if (data.total_rows !== undefined) {
      return data.total_rows;
    }
    if (data.count !== undefined) {
      return data.count;
    }
    if (data.total !== undefined) {
      return data.total;
    }
  } catch (e) {
    console.warn('Failed to parse total count response:', e);
  }
  return 0;
}

function transformN8nCard(n8nCard: N8nCardData, remaining: number): GetCardResponse {
  return {
    done: false,
    row_id: String(n8nCard.row_number),
    file_name: n8nCard.file_name,
    image_url: n8nCard.image_url,
    ai_title: n8nCard.title,
    ai_description: n8nCard.description,
    needs_review: n8nCard.needs_review === 'TRUE',
    review_reason: n8nCard.review_reason || null,
    remaining,
  };
}

export async function getNextCard(): Promise<GetCardResponse> {
  const response = await fetch(config.getCardUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch card: ${response.status} ${response.statusText}`);
  }
  
  const text = await response.text();
  if (!text.trim()) {
    return { done: true };
  }
  
  const data: N8nResponse | N8nCardData = JSON.parse(text);
  
  // Handle both array and single object responses
  const cardsArray = Array.isArray(data) ? data : [data];
  
  // Filter for unreviewed cards
  const unreviewedCards = cardsArray.filter(card => card.reviewed === 'no');
  
  if (unreviewedCards.length === 0) {
    return { done: true };
  }
  
  // Return the first unreviewed card
  const firstCard = unreviewedCards[0];
  return transformN8nCard(firstCard, unreviewedCards.length);
}

export async function confirmCard(data: ConfirmCardRequest): Promise<ConfirmCardResponse> {
  console.log('Confirming card:', data);
  
  const response = await fetch(config.confirmCardUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', errorText);
    throw new Error(`Failed to confirm card: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const responseData = await response.json();
  console.log('Success response:', responseData);
  return responseData;
}
