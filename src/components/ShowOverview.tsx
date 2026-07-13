import { useState, useEffect } from 'react';
import { getAllCards, updateCard, deleteCard } from '../services/database';
import type { Card } from '../types';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '../hooks/useTheme';

const SALES_FORMATS = [
  'Auction',
  'Buy it Now',
  'Giveaway',
];

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
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    verkaufsformat: '',
    preis: '',
    versandprofil: '',
    zustand: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Delete confirmation state
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCards();
  }, [sessionId]);

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
      verkaufsformat: card.verkaufsformat || '',
      preis: card.starting_price?.toString() || card.preis || '',
      versandprofil: card.versandprofil || '',
      zustand: card.zustand || '',
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
      await updateCard(editingCard.id, editForm);
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
              verkaufsformat: editForm.verkaufsformat,
              preis: editForm.preis,
              versandprofil: editForm.versandprofil,
              zustand: editForm.zustand,
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
        <h1 className="show-overview-title">{sessionName || 'Show Overview'}</h1>
        <div className="show-overview-grid">
          {cards.map((card) => (
            <div key={card.id} className="card-grid-item glass-panel">
              <div className="card-grid-image-wrapper">
                <img 
                  src={card.image_url} 
                  alt={card.file_name} 
                  className="card-grid-image"
                />
                <div className="card-grid-actions">
                  <button
                    className="card-action-btn"
                    onClick={() => handleEdit(card)}
                    aria-label="Edit card"
                  >
                    ✏️
                  </button>
                  <button
                    className="card-action-btn card-action-btn-danger"
                    onClick={() => handleDelete(card)}
                    aria-label="Delete card"
                  >
                    🗑️
                  </button>
                </div>
                {card.status === 'pending_review' && (
                  <div className="card-grid-status">
                    <StatusBadge
                      status="info"
                      icon="⏳"
                      label="Pending"
                    />
                  </div>
                )}
              </div>
              <div className="card-grid-details">
                <h3 className="card-grid-title">{getCardTitle(card)}</h3>
                <p className="card-grid-description">{getCardDescription(card)}</p>
                <div className="card-grid-fields">
                  {card.kategorie && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Category:</span>
                      <span className="card-grid-field-value">{card.kategorie}</span>
                    </div>
                  )}
                  {card.unterkategorie && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Subcategory:</span>
                      <span className="card-grid-field-value">{card.unterkategorie}</span>
                    </div>
                  )}
                  {card.verkaufsformat && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Format:</span>
                      <span className="card-grid-field-value">{card.verkaufsformat}</span>
                    </div>
                  )}
                  {card.preis && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Price:</span>
                      <span className="card-grid-field-value">{card.preis}</span>
                    </div>
                  )}
                  {card.versandprofil && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Shipping:</span>
                      <span className="card-grid-field-value">{card.versandprofil}</span>
                    </div>
                  )}
                  {card.zustand && (
                    <div className="card-grid-field">
                      <span className="card-grid-field-label">Condition:</span>
                      <span className="card-grid-field-value">{card.zustand}</span>
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
                <label className="field-label">Sales Format</label>
                <select
                  value={editForm.verkaufsformat}
                  onChange={(e) => setEditForm({ ...editForm, verkaufsformat: e.target.value })}
                  className="field-input"
                  disabled={saving}
                >
                  {SALES_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="field-group">
                <label className="field-label">Price</label>
                <input
                  type="text"
                  value={editForm.preis}
                  onChange={(e) => setEditForm({ ...editForm, preis: e.target.value })}
                  className="field-input"
                  disabled={saving}
                  placeholder="e.g. 1"
                />
              </div>
              
              <div className="field-group">
                <label className="field-label">Shipping Profile</label>
                <select
                  value={editForm.versandprofil}
                  onChange={(e) => setEditForm({ ...editForm, versandprofil: e.target.value })}
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
                  value={editForm.zustand}
                  onChange={(e) => setEditForm({ ...editForm, zustand: e.target.value })}
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
