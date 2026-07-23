import { useState } from 'react';
import { getConfirmedCards, getUserSettings } from '../services/database';
import { generateCSV, downloadCSV } from '../utils/csvExport';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface ExportProps {
  sessionId: string;
  isReExport: boolean;
  onNewSession: () => void;
  onBackToShows: () => void;
  onLogout: () => void;
}

export function Export({ sessionId, isReExport, onNewSession, onBackToShows, onLogout }: ExportProps) {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

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
      
      // Use database defaults if user settings don't exist
      const csvSettings = {
        kategorie: userSettings?.kategorie || 'Sportkarten',
        unterkategorie: userSettings?.unterkategorie || 'Soccer Singles',
        verkaufsformat: userSettings?.verkaufsformat || 'Auction',
        preis: userSettings?.preis || '1',
        versandprofil: userSettings?.versandprofil || 'Pack (50 g)',
        zustand: userSettings?.zustand || 'Raw - Very Good',
      };

      const csv = generateCSV(cards, csvSettings);
      downloadCSV(csv);
      
      setExported(true);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
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

      <div className="export-content glass-panel">
        <h1 className="export-title">
          {isReExport ? 'Export Again' : 'Export Complete'}
        </h1>
        <p className="export-subtitle">
          {isReExport 
            ? 'Download your CSV file again' 
            : 'All cards have been reviewed and confirmed'
          }
        </p>

        {!exported && (
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Generating CSV...' : 'Download CSV'}
          </button>
        )}

        {error && <div className="export-error">{error}</div>}

        {exported && (
          <div className="export-success">
            <div className="success-icon">✓</div>
            <div className="success-text">CSV downloaded successfully</div>
          </div>
        )}

        <div className="export-actions">
          <button
            className="btn btn-secondary"
            onClick={onBackToShows}
          >
            Back to Shows
          </button>
          <button
            className="btn btn-primary"
            onClick={onNewSession}
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}
