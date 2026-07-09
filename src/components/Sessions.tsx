import { useState, useEffect } from 'react';
import { getUserSessions, createSession, deleteSession, getUserSettings } from '../services/database';
import type { SessionWithCardCount } from '../services/database';
import { getConfirmedCards } from '../services/database';
import { generateCSV, downloadCSV } from '../utils/csvExport';
import { useTheme } from '../hooks/useTheme';
import { StatusBadge } from './StatusBadge';
import { supabase } from '../lib/supabase';

interface SessionsProps {
  userId: string;
  onNavigateToSession: (sessionId: string) => void;
  onUploadMore: (sessionId: string) => void;
  onNewSessionCreated: (sessionId: string) => void;
  onLogout: () => void;
  onSettings: () => void;
  refreshTrigger?: number;
}

export function Sessions({ userId, onNavigateToSession, onUploadMore, onNewSessionCreated, onLogout, onSettings, refreshTrigger }: SessionsProps) {
  const { theme, toggleTheme } = useTheme();
  const [sessions, setSessions] = useState<SessionWithCardCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [exportingSession, setExportingSession] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newShowName, setNewShowName] = useState('');

  useEffect(() => {
    loadSessions();
  }, [userId, refreshTrigger]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserSessions(userId);
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const handleNewShow = async () => {
    if (!newShowName.trim()) {
      setError('Please enter a show name');
      return;
    }
    setCreatingSession(true);
    setError(null);
    try {
      const session = await createSession(userId, newShowName.trim());
      onNewSessionCreated(session.id);
    } catch (err: any) {
      console.error('Failed to create show:', err);
      setError(err.message || 'Failed to create show');
      setCreatingSession(false);
    }
  };

  const handleExportAgain = async (sessionId: string) => {
    setExportingSession(sessionId);
    try {
      const cards = await getConfirmedCards(sessionId);
      if (cards.length === 0) {
        setError('No confirmed cards to export');
        return;
      }

      // Get user settings for CSV export
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userSettings = await getUserSettings(user.id);
      if (!userSettings) {
        throw new Error('User settings not found');
      }

      const csv = generateCSV(cards, {
        kategorie: userSettings.kategorie || 'Sportkarten',
        unterkategorie: userSettings.unterkategorie || 'Fußball Singles',
        verkaufsformat: userSettings.verkaufsformat || 'Auction',
        preis: userSettings.preis || '1',
        versandprofil: userSettings.versandprofil || 'Pack (50 g)',
        zustand: userSettings.zustand || 'Raw - Very Good',
      });
      downloadCSV(csv);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setExportingSession(null);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this show? This cannot be undone.')) {
      return;
    }
    setDeletingSession(sessionId);
    try {
      await deleteSession(sessionId);
      await loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete show');
    } finally {
      setDeletingSession(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="sessions-container">
        <button
          className="settings-btn"
          onClick={onSettings}
          aria-label="Settings"
        >
          ⚙️
        </button>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="logout-btn" onClick={onLogout}>
          Log out
        </button>
        <div className="sessions-loading">Loading shows...</div>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      <button
        className="settings-btn"
        onClick={onSettings}
        aria-label="Settings"
      >
        ⚙️
      </button>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button className="logout-btn" onClick={onLogout}>
        Log out
      </button>

      <div className="sessions-content">
        <h1 className="sessions-title">Shows</h1>

        {error && <div className="sessions-error">{error}</div>}

        {sessions.length === 0 && !error ? (
          <div className="sessions-empty">
            <div className="empty-icon">📁</div>
            <div className="empty-text">No shows yet</div>
            {!showNameInput ? (
              <button
                className="btn btn-primary"
                onClick={() => setShowNameInput(true)}
              >
                New Show
              </button>
            ) : (
              <div className="new-show-form">
                <input
                  type="text"
                  placeholder="Enter show name..."
                  value={newShowName}
                  onChange={(e) => setNewShowName(e.target.value)}
                  className="field-input"
                  autoFocus
                />
                <div className="new-show-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowNameInput(false);
                      setNewShowName('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleNewShow}
                    disabled={creatingSession || !newShowName.trim()}
                  >
                    {creatingSession ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-info">
                    <div className="session-name">{session.name || 'Untitled Show'}</div>
                    <div className="session-date">{formatDate(session.created_at)}</div>
                    <div className="session-status">
                      <StatusBadge
                        status={session.status === 'in_progress' ? 'info' : 'success'}
                        icon={session.status === 'in_progress' ? '⏳' : '✓'}
                        label={session.status === 'in_progress' ? 'In Progress' : 'Completed'}
                      />
                      <span className="session-count">
                        {session.card_count} cards
                        {session.pending_count > 0 && (
                          <span className="pending-count"> ({session.pending_count} left to review)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="session-actions">
                    {session.status === 'in_progress' && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onUploadMore(session.id)}
                        >
                          Upload More
                        </button>
                        {session.pending_count > 0 && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onNavigateToSession(session.id)}
                          >
                            Review ({session.pending_count})
                          </button>
                        )}
                      </>
                    )}
                    {session.status === 'completed' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExportAgain(session.id)}
                        disabled={exportingSession === session.id}
                      >
                        {exportingSession === session.id ? 'Exporting...' : 'Export again'}
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingSession === session.id}
                    >
                      {deletingSession === session.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!showNameInput ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setShowNameInput(true)}
              >
                New Show
              </button>
            ) : (
              <div className="new-show-form">
                <input
                  type="text"
                  placeholder="Enter show name..."
                  value={newShowName}
                  onChange={(e) => setNewShowName(e.target.value)}
                  className="field-input"
                  autoFocus
                />
                <div className="new-show-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowNameInput(false);
                      setNewShowName('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleNewShow}
                    disabled={creatingSession || !newShowName.trim()}
                  >
                    {creatingSession ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
