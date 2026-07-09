import { useState } from 'react';
import { getConfirmedCards, completeSession } from '../services/database';
import { generateCSV, downloadCSV } from '../utils/csvExport';

interface ExportProps {
  sessionId: string;
  isReExport: boolean;
  onNewSession: () => void;
  onLogout: () => void;
}

export function Export({ sessionId, isReExport, onNewSession, onLogout }: ExportProps) {
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

      const csv = generateCSV(cards);
      downloadCSV(csv);
      
      // Only complete session if this is not a re-export
      if (!isReExport) {
        await completeSession(sessionId);
      }
      
      setExported(true);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-container">
      <button className="logout-btn" onClick={onLogout}>
        Log out
      </button>

      <div className="export-content">
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

        <button
          className="btn btn-secondary"
          onClick={onNewSession}
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
