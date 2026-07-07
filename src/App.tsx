import { useState, useEffect } from 'react';
import { getNextCard, confirmCard, getTotalCount } from './services/api';
import { validateConfig } from './services/config';
import type { CardData } from './types';
import { Loading } from './components/Loading';
import { CardView } from './components/CardView';
import { AllDone } from './components/AllDone';
import { ConnectionError } from './components/ConnectionError';

type AppState = 
  | { type: 'loading' }
  | { type: 'card'; card: CardData; confirmedCount: number; totalCount: number; isSaving: boolean }
  | { type: 'allDone' }
  | { type: 'error'; message: string };

export function App() {
  const [state, setState] = useState<AppState>({ type: 'loading' });
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!validateConfig()) {
      setConfigError('Missing environment variables. Please set VITE_GET_CARD_URL and VITE_CONFIRM_CARD_URL.');
      setState({ type: 'error', message: 'Configuration error' });
      return;
    }
    fetchCard();
  }, []);

  const fetchCard = async () => {
    setState({ type: 'loading' });
    try {
      const [response, totalCount] = await Promise.all([
        getNextCard(),
        getTotalCount()
      ]);
      
      if (response.done) {
        setState({ type: 'allDone' });
      } else {
        setState({ 
          type: 'card', 
          card: response as CardData, 
          confirmedCount: 0, 
          totalCount,
          isSaving: false 
        });
      }
    } catch (error) {
      setState({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to load card' 
      });
    }
  };

  const handleConfirm = async (title: string, description: string, startingPrice: number, shippingProfile: string, condition: string) => {
    if (state.type !== 'card') return;

    const { card, confirmedCount, totalCount } = state;
    setState({ ...state, isSaving: true });
    
    try {
      await confirmCard({
        row_id: card.row_id,
        title,
        description,
        image_url: card.image_url,
        file_name: card.file_name,
        starting_price: startingPrice,
        shipping_profile: shippingProfile,
        condition,
      });

      // Fetch next card
      const response = await getNextCard();
      if (response.done) {
        setState({ type: 'allDone' });
      } else {
        setState({ 
          type: 'card', 
          card: response as CardData, 
          confirmedCount: confirmedCount + 1,
          totalCount,
          isSaving: false
        });
      }
    } catch (error) {
      // Keep the current state with edits intact, just show error
      setState({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to confirm card' 
      });
    }
  };

  const handleRetry = () => {
    if (state.type === 'error') {
      fetchCard();
    }
  };

  if (configError) {
    return (
      <div className="app config-error">
        <ConnectionError message={configError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="app">
      {state.type === 'loading' && <Loading />}
      {state.type === 'card' && (
        <CardView 
          card={state.card} 
          confirmedCount={state.confirmedCount}
          totalCount={state.totalCount}
          onConfirm={handleConfirm}
          isSaving={state.isSaving}
        />
      )}
      {state.type === 'allDone' && <AllDone onCheckAgain={fetchCard} />}
      {state.type === 'error' && (
        <ConnectionError message={state.message} onRetry={handleRetry} />
      )}
    </div>
  );
}
