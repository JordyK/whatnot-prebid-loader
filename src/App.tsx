import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTeamRole } from './hooks/useTeamRole';
import { getPendingCardCount, getPendingCards, confirmCard, getConfirmedCards, completeSession, getUserTeam, getPendingInvites, acceptInvite } from './services/database';
import type { Card } from './types';
import { Auth } from './components/Auth';
import { Sessions } from './components/Sessions';
import { Upload } from './components/Upload';
import { CardView } from './components/CardView';
import { Export } from './components/Export';
import { Loading } from './components/Loading';
import { Settings } from './components/Settings';
import { ShowOverview } from './components/ShowOverview';
import { Team } from './components/Team';

type AppState =
  | { type: 'auth' }
  | { type: 'sessions' }
  | { type: 'upload'; sessionId: string }
  | { type: 'review'; sessionId: string; cards: Card[]; currentIndex: number; isSaving: boolean }
  | { type: 'export'; sessionId: string; isReExport: boolean }
  | { type: 'overview'; sessionId: string; sessionName: string }
  | { type: 'settings' }
  | { type: 'team' }
  | { type: 'invite'; invite: any }
  | { type: 'loading' }
  | { type: 'error'; message: string };

export function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { setTeamRole } = useTeamRole();
  const [state, setState] = useState<AppState>({ type: 'loading' });
  const [sessionsRefreshTrigger, setSessionsRefreshTrigger] = useState(0);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ type: 'auth' });
      return;
    }

    const initializeUser = async () => {
      try {
        // Check for pending invites
        const pendingInvites = await getPendingInvites(user.email);
        if (pendingInvites.length > 0) {
          setState({ type: 'invite', invite: pendingInvites[0] });
          return;
        }

        // Get user's team
        const userTeam = await getUserTeam(user.id);
        if (!userTeam) {
          setState({ type: 'error', message: 'No team found. Your account may not be set up for team access yet. Please contact support.' });
          return;
        }

        // Store team info and role
        setTeamId(userTeam.team.id);
        setTeamRole(userTeam.member.role);

        // Check URL for session parameter
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');

        if (sessionId) {
          try {
            const pendingCount = await getPendingCardCount(sessionId);
            const confirmedCards = await getConfirmedCards(sessionId);

            if (pendingCount > 0) {
              const pendingCards = await getPendingCards(sessionId);
              setState({ type: 'review', sessionId, cards: pendingCards, currentIndex: 0, isSaving: false });
            } else if (confirmedCards.length > 0) {
              setState({ type: 'export', sessionId, isReExport: true });
            } else {
              setState({ type: 'upload', sessionId });
            }
          } catch (error) {
            console.error('Error loading session:', error);
            setState({ type: 'sessions' });
          }
        } else {
          setState({ type: 'sessions' });
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setState({ type: 'error', message: 'Failed to initialize. Please try again.' });
      }
    };

    initializeUser();
  }, [user, authLoading]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
  }, [signIn]);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    await signUp(email, password);
  }, [signUp]);

  const handleNavigateToSession = useCallback(async (sessionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({}, '', url.toString());
    
    // Directly determine route and set state
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
  }, []);

  const handleNewSessionCreated = useCallback((sessionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({}, '', url.toString());
    // Directly set state to upload screen for new session
    setState({ type: 'upload', sessionId });
  }, []);

  const handleUploadMore = useCallback((sessionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.pushState({}, '', url.toString());
    // Always go to upload screen for upload more
    setState({ type: 'upload', sessionId });
  }, []);

  const handleSettings = useCallback(() => {
    setState({ type: 'settings' });
  }, []);

  const handleBackFromSettings = useCallback(() => {
    setState({ type: 'sessions' });
  }, []);

  const handleTeam = useCallback(() => {
    setState({ type: 'team' });
  }, []);

  const handleAcceptInvite = useCallback(async (inviteId: string) => {
    try {
      await acceptInvite(inviteId);
      // Reload the page to reinitialize with the new team
      window.location.reload();
    } catch (error) {
      console.error('Failed to accept invite:', error);
    }
  }, []);

  const handleDeclineInvite = useCallback(() => {
    setState({ type: 'error', message: 'Please contact the team owner to remove the invite.' });
  }, []);

  const handleViewCards = useCallback((sessionId: string, sessionName: string) => {
    setState({ type: 'overview', sessionId, sessionName });
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
        // All cards confirmed, complete the session and go to export
        await completeSession(sessionId);
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
    // Increment refresh trigger to force sessions list reload
    setSessionsRefreshTrigger(prev => prev + 1);
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
        teamId={teamId!}
        onNavigateToSession={handleNavigateToSession}
        onUploadMore={handleUploadMore}
        onNewSessionCreated={handleNewSessionCreated}
        onViewCards={handleViewCards}
        onLogout={handleLogout}
        onSettings={handleSettings}
        refreshTrigger={sessionsRefreshTrigger}
      />
    );
  }

  if (state.type === 'upload') {
    return (
      <Upload 
        sessionId={state.sessionId}
        onUploadComplete={handleUploadComplete}
        onLogout={handleLogout}
        onSettings={handleSettings}
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
        onSettings={handleSettings}
      />
    );
  }

  if (state.type === 'export') {
    return (
      <Export 
        sessionId={state.sessionId}
        isReExport={state.isReExport}
        onNewSession={handleBackToSessions}
        onBackToShows={handleBackToSessions}
        onLogout={handleLogout}
      />
    );
  }

  if (state.type === 'overview') {
    return (
      <ShowOverview 
        sessionId={state.sessionId}
        sessionName={state.sessionName}
        onBack={handleBackToSessions}
        onLogout={handleLogout}
        onSettings={handleSettings}
      />
    );
  }

  if (state.type === 'settings') {
    return (
      <Settings
        userId={user!.id}
        onLogout={handleLogout}
        onBack={handleBackFromSettings}
        onTeam={handleTeam}
      />
    );
  }

  if (state.type === 'team') {
    return (
      <Team
        teamId={teamId!}
        onBack={handleBackFromSettings}
        onLogout={handleLogout}
      />
    );
  }

  if (state.type === 'invite') {
    return (
      <div className="upload-container">
        <div className="upload-content">
          <h1 className="upload-title">Team Invitation</h1>
          <p className="upload-subtitle">
            You've been invited to join a team
          </p>
          <div className="invite-actions">
            <button
              className="btn btn-primary"
              onClick={() => handleAcceptInvite(state.invite.id)}
            >
              Accept Invite
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDeclineInvite}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
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
