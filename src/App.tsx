import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { getPendingCardCount, getPendingCards, confirmCard, getConfirmedCards } from './services/database';
import type { Card } from './types';
import { Auth } from './components/Auth';
import { Sessions } from './components/Sessions';
import { Upload } from './components/Upload';
import { CardView } from './components/CardView';
import { Export } from './components/Export';
import { Loading } from './components/Loading';

type AppState = 
  | { type: 'auth' }
  | { type: 'sessions' }
  | { type: 'upload'; sessionId: string }
  | { type: 'review'; sessionId: string; cards: Card[]; currentIndex: number; isSaving: boolean }
  | { type: 'export'; sessionId: string; isReExport: boolean }
  | { type: 'loading' }
  | { type: 'error'; message: string };

export function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const [state, setState] = useState<AppState>({ type: 'loading' });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ type: 'auth' });
      return;
    }

    // Check URL for session parameter
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');

    const determineRoute = async () => {
      if (sessionId) {
        try {
          const pendingCount = await getPendingCardCount(sessionId);
          const confirmedCards = await getConfirmedCards(sessionId);

          if (pendingCount > 0) {
            // Has pending cards → fetch them and show review screen
            const pendingCards = await getPendingCards(sessionId);
            setState({ type: 'review', sessionId, cards: pendingCards, currentIndex: 0, isSaving: false });
          } else if (confirmedCards.length > 0) {
            // All confirmed → show export screen
            setState({ type: 'export', sessionId, isReExport: true });
          } else {
            // Zero cards → show upload screen (reuse empty session)
            setState({ type: 'upload', sessionId });
          }
        } catch (error) {
          console.error('Error loading session:', error);
          setState({ type: 'sessions' });
        }
      } else {
        // No session parameter → show sessions screen
        setState({ type: 'sessions' });
      }
    };

    determineRoute();
  }, [user, authLoading]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
  }, [signIn]);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    await signUp(email, password);
  }, [signUp]);

  const handleNavigateToSession = useCallback((sessionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({}, '', url.toString());
    // The URL change will trigger the useEffect to re-route
  }, []);

  const handleNewSessionCreated = useCallback((sessionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({}, '', url.toString());
    // Directly set state to upload screen for new session
    setState({ type: 'upload', sessionId });
  }, []);

  const handleUploadComplete = (sessionId: string) => {
    loadPendingCards(sessionId);
  };

  const loadPendingCards = async (sessionId: string) => {
    setState({ type: 'loading' });
    try {
      const pendingCards = await getPendingCards(sessionId);
      if (pendingCards.length > 0) {
        setState({ type: 'review', sessionId, cards: pendingCards, currentIndex: 0, isSaving: false });
      } else {
        const confirmedCards = await getConfirmedCards(sessionId);
        if (confirmedCards.length > 0) {
          setState({ type: 'export', sessionId, isReExport: false });
        } else {
          setState({ type: 'upload', sessionId });
        }
      }
    } catch (error) {
      setState({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to load cards' 
      });
    }
  };

  const handleConfirm = async (title: string, description: string, startingPrice: number, shippingProfile: string, condition: string) => {
    if (state.type !== 'review') return;

    const { sessionId, cards, currentIndex } = state;
    const currentCard = cards[currentIndex];
    
    setState({ ...state, isSaving: true });
    
    try {
      await confirmCard(currentCard.id, title, description, startingPrice, shippingProfile, condition);

      if (currentIndex < cards.length - 1) {
        setState({ 
          ...state, 
          currentIndex: currentIndex + 1,
          isSaving: false 
        });
      } else {
        // All cards confirmed, go to export
        setState({ type: 'export', sessionId, isReExport: false });
      }
    } catch (error) {
      setState({ 
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to confirm card' 
      });
    }
  };

  const handleBackToSessions = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url.toString());
    setState({ type: 'sessions' });
  };

  const handleLogout = () => {
    signOut();
    setState({ type: 'auth' });
  };

  if (authLoading || state.type === 'loading') {
    return <Loading />;
  }

  if (state.type === 'auth') {
    return <Auth onSignIn={handleSignIn} onSignUp={handleSignUp} />;
  }

  if (state.type === 'sessions') {
    return (
      <Sessions 
        userId={user!.id}
        onNavigateToSession={handleNavigateToSession}
        onNewSessionCreated={handleNewSessionCreated}
        onLogout={handleLogout}
      />
    );
  }

  if (state.type === 'upload') {
    return (
      <Upload 
        sessionId={state.sessionId}
        onUploadComplete={handleUploadComplete}
        onLogout={handleLogout}
      />
    );
  }

  if (state.type === 'review') {
    const currentCard = state.cards[state.currentIndex];
    return (
      <CardView 
        card={currentCard}
        confirmedCount={state.currentIndex}
        totalCount={state.cards.length}
        onConfirm={handleConfirm}
        isSaving={state.isSaving}
        onLogout={handleLogout}
        onBack={handleBackToSessions}
      />
    );
  }

  if (state.type === 'export') {
    return (
      <Export 
        sessionId={state.sessionId}
        isReExport={state.isReExport}
        onNewSession={handleBackToSessions}
        onLogout={handleLogout}
      />
    );
  }

  if (state.type === 'error') {
    return (
      <div className="app">
        <div className="error-state">
          <div className="error-content">
            <h2 className="error-title">Error</h2>
            <p className="error-message">{state.message}</p>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
