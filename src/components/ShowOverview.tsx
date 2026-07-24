import { useState, useEffect } from 'react';
import { getAllCards, updateCard, deleteCard, importSalesPdf } from '../services/database';
import type { Card } from '../types';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '../hooks/useTheme';
import { useTeamRole } from '../hooks/useTeamRole';

const SHIPPING_PROFILES = [
  'Kleine Hobbybox (bis zu 10 Boosterpacks)',
  'Mittlere Hobbybox (bis zu 24 Boosterpacks)',
  'Große Hobbybox (bis zu 36 Boosterpacks)',
  'Kleiner Break Spot (max. 15 Karten)',
  'Mittlerer Break Spot (max. 30 Karten)',
  'Großer Break Spot (max. 60 Karten)',
  'Single (15 g)',
  'Slab (90 g)',
  'Pack (50 g)',
];

const CONDITIONS = [
  'Graded',
  'Raw - Near Mint or Better',
  'Raw - Excellent',
  'Raw - Very Good',
  'Raw - Poor',
];

interface ShowOverviewProps {
  sessionId: string;
  sessionName: string;
  onBack: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

export function ShowOverview({ sessionId, sessionName, onBack, onLogout, onSettings }: ShowOverviewProps) {
  const { theme, toggleTheme } = useTheme();
  const { canEdit, canDelete } = useTeamRole();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    starting_price: '',
    shipping_profile: '',
    condition: '',
    sold_price: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Delete confirmation state
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sales import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ matched: number; total: number; unmatched?: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCards();
  }, [sessionId]);

  // Filter cards based on search query
  const filteredCards = cards.filter(card => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      card.file_name?.toLowerCase().includes(query) ||
      card.ai_title?.toLowerCase().includes(query) ||
      card.final_title?.toLowerCase().includes(query) ||
      card.ai_description?.toLowerCase().includes(query) ||
      card.final_description?.toLowerCase().includes(query) ||
      card.brand_set?.toLowerCase().includes(query) ||
      card.player_name?.toLowerCase().includes(query) ||
      card.serial_number?.toLowerCase().includes(query)
    );
  });

  const loadCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCards(sessionId);
      setCards(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setEditForm({
      title: card.final_title || card.ai_title,
      description: card.final_description || card.ai_description,
      starting_price: card.starting_price?.toString() || '',
      shipping_profile: card.shipping_profile || '',
      condition: card.condition || '',
      sold_price: card.sold_price?.toString() || '',
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateCard(editingCard.id, {
        title: editForm.title,
        description: editForm.description,
        starting_price: editForm.starting_price ? parseFloat(editForm.starting_price) : null,
        shipping_profile: editForm.shipping_profile,
        condition: editForm.condition,
        sold_price: editForm.sold_price ? parseFloat(editForm.sold_price) : null,
      });
      setSaveSuccess(true);

      // Update local state
      setCards(cards.map(card =>
        card.id === editingCard.id
          ? {
              ...card,
              ai_title: editForm.title,
              ai_description: editForm.description,
              final_title: editForm.title,
              final_description: editForm.description,
              starting_price: editForm.starting_price ? parseFloat(editForm.starting_price) : null,
              shipping_profile: editForm.shipping_profile,
              condition: editForm.condition,
              sold_price: editForm.sold_price ? parseFloat(editForm.sold_price) : null,
            }
          : card
      ));

      setTimeout(() => {
        setEditingCard(null);
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (card: Card) => {
    setDeletingCard(card);
  };

  const handleImportSales = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      setImportError(null);
      setImportResult(null);

      try {
        const result = await importSalesPdf(sessionId, file);
        setImportResult(result);
        // Refetch cards to show sold prices
        await loadCards();
      } catch (err: any) {
        setImportError(err.message || 'Failed to import sales');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const confirmDelete = async () => {
    if (!deletingCard) return;
    
    setDeleting(true);
    try {
      await deleteCard(deletingCard.id);
      // Remove from local state immediately
      setCards(cards.filter(card => card.id !== deletingCard.id));
      setDeletingCard(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete card');
    } finally {
      setDeleting(false);
    }
  };

  const getCardTitle = (card: Card) => card.final_title || card.ai_title;
  const getCardDescription = (card: Card) => card.final_description || card.ai_description;

  if (loading) {
    return (
      <div className="show-overview-container">
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
        <button
          className="logout-icon-btn"
          onClick={onLogout}
          aria-label="Log out"
        >
          🚪
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
        <div className="sessions-loading">Loading cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="show-overview-container">
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
        <button
          className="logout-icon-btn"
          onClick={onLogout}
          aria-label="Log out"
        >
          🚪
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
        <div className="sessions-error">{error}</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="show-overview-container">
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
        <button
          className="logout-icon-btn"
          onClick={onLogout}
          aria-label="Log out"
        >
          🚪
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
        <div className="sessions-empty">
          <div className="empty-icon">📭</div>
          <div className="empty-text">No cards in this show</div>
        </div>
      </div>
    );
  }

  return (
    <div className="show-overview-container">
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
      <button
        className="logout-icon-btn"
        onClick={onLogout}
        aria-label="Log out"
      >
        🚪
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onBack}>
        ← Back
      </button>

      <div className="show-overview-content">
        <div className="show-overview-header">
          <h1 className="show-overview-title">{sessionName || 'Show Overview'}</h1>
          <div className="show-overview-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleImportSales}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import Sales PDF'}
            </button>
          </div>
        </div>

        {importError && (
          <div className="settings-error">
            <StatusBadge status="danger" icon="⚠" label={importError} />
          </div>
        )}

        {importResult && (
          <div className="import-result glass-panel">
            <div className="import-summary">
              <StatusBadge
                status="success"
                icon="✓"
                label={`${importResult.matched} of ${importResult.total} items matched`}
              />
            </div>
            {importResult.unmatched && importResult.unmatched.length > 0 && (
              <div className="import-unmatched">
                <p className="import-unmatched-title">Unmatched items:</p>
                <ul className="import-unmatched-list">
                  {importResult.unmatched.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <p className="import-unmatched-note">
                  These weren't found as cards in this session — check for typos or edits made after export.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="show-overview-grid">
          {filteredCards.map((card) => (
            <div key={card.id} className="card-grid-item glass-panel">
              <div className="card-grid-image-wrapper">
                <img 
                  src={card.image_url} 
                  alt={card.file_name} 
                  className="card-grid-image"
                />
                <div className="card-grid-actions">
                  {canEdit && (
                    <button
                      className="card-action-btn"
                      onClick={() => handleEdit(card)}
                      aria-label="Edit card"
                    >
                      ✏️
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="card-action-btn card-action-btn-danger"
                      onClick={() => handleDelete(card)}
                      aria-label="Delete card"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="card-grid-status">
                  {card.sold_price && (
                    <StatusBadge
                      status="success"
                      icon="💰"
                      label={`Sold · €${card.sold_price}`}
                    />
                  )}
                  {card.status === 'pending_review' && !card.sold_price && (
                    <StatusBadge
                      status="info"
                      icon="⏳"
                      label="Pending"
                    />
                  )}
                </div>
              </div>
              <div className="card-grid-details">
                <h3 className="card-grid-title">{getCardTitle(card)}</h3>
                <p className="card-grid-description">{getCardDescription(card)}</p>
                <div className="card-grid-fields">
                  {card.shipping_profile && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Shipping:</span>
                      <span className="card-grid-field-value">{card.shipping_profile}</span>
                    </div>
                  )}
                  {card.condition && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Condition:</span>
                      <span className="card-grid-field-value">{card.condition}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <div className="modal-overlay" onClick={() => !saving && setEditingCard(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Card</h2>
            
            <div className="modal-form">
              <div className="field-group">
                <label className="field-label">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="field-input"
                  disabled={saving}
                />
              </div>
              
              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="field-input"
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Starting Price</label>
                <input
                  type="number"
                  value={editForm.starting_price}
                  onChange={(e) => setEditForm({ ...editForm, starting_price: e.target.value })}
                  className="field-input"
                  disabled={saving}
                  placeholder="e.g. 1"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Shipping Profile</label>
                <select
                  value={editForm.shipping_profile}
                  onChange={(e) => setEditForm({ ...editForm, shipping_profile: e.target.value })}
                  className="field-input"
                  disabled={saving}
                >
                  {SHIPPING_PROFILES.map((profile) => (
                    <option key={profile} value={profile}>
                      {profile}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Condition</label>
                <select
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  className="field-input"
                  disabled={saving}
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Selling price (optional)</label>
                <input
                  type="number"
                  value={editForm.sold_price}
                  onChange={(e) => setEditForm({ ...editForm, sold_price: e.target.value })}
                  className="field-input"
                  disabled={saving}
                  placeholder="e.g. 25.50"
                  step="0.01"
                />
              </div>
            </div>
            
            {saveError && (
              <div className="settings-error">
                <StatusBadge status="danger" icon="⚠" label={saveError} />
              </div>
            )}
            
            {saveSuccess && (
              <div className="settings-success">
                <StatusBadge status="success" icon="✓" label="Card updated successfully" />
              </div>
            )}
            
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingCard(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCard && (
        <div className="modal-overlay" onClick={() => !deleting && setDeletingCard(null)}>
          <div className="modal-content glass-panel modal-content-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Card</h2>
            <p className="delete-confirm-text">
              Are you sure you want to delete this card? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingCard(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
