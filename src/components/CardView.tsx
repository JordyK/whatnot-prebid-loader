import { useState, useEffect } from 'react';
import type { Card } from '../types';
import { useTheme } from '../hooks/useTheme';

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

interface CardViewProps {
  card: Card;
  confirmedCount: number;
  totalCount: number;
  onConfirm: (title: string, description: string, startingPrice: number, shippingProfile: string, condition: string) => void;
  isSaving: boolean;
  onLogout: () => void;
  onBack: () => void;
}

export function CardView({ card, confirmedCount, totalCount, onConfirm, isSaving, onLogout, onBack }: CardViewProps) {
  const { theme, toggleTheme } = useTheme();
  const [title, setTitle] = useState(card.ai_title);
  const [description, setDescription] = useState(card.ai_description);
  const [startingPrice, setStartingPrice] = useState(card.starting_price || 1);
  const [shippingProfile, setShippingProfile] = useState(card.shipping_profile || 'Pack (50 g)');
  const [condition, setCondition] = useState(card.condition || 'Raw - Very Good');

  // Reset local state when card changes
  useEffect(() => {
    setTitle(card.ai_title);
    setDescription(card.ai_description);
    setStartingPrice(card.starting_price || 1);
    setShippingProfile(card.shipping_profile || 'Pack (50 g)');
    setCondition(card.condition || 'Raw - Very Good');
  }, [card]);

  const handleSubmit = () => {
    const hasUnknown = 
      title.toLowerCase().includes('unknown') || 
      description.toLowerCase().includes('unknown');
    
    if (hasUnknown) {
      const confirmed = window.confirm(
        'Warning: The title or description contains "Unknown". This should not appear in the final CSV file. Are you sure you want to proceed?'
      );
      if (!confirmed) {
        return;
      }
    }
    
    onConfirm(title, description, startingPrice, shippingProfile, condition);
  };

  return (
    <div className="card-view">
      <div className="card-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
        <button className="logout-btn" onClick={onLogout}>
          Log out
        </button>
      </div>

      <div className="progress-container">
        <div className="progress-counter">
          {String(confirmedCount).padStart(3, '0')} / {String(totalCount).padStart(3, '0')}
        </div>
        <div className="progress-label">reviewing</div>
      </div>

      {card.review_reason && (
        <div className="warning-banner">
          <span className="warning-icon">⚠</span>
          <span className="warning-text">{card.review_reason}</span>
        </div>
      )}

      <div className="card-slab">
        <img 
          src={card.image_url} 
          alt={card.file_name} 
          className="card-image"
        />
      </div>

      <div className="form-fields">
        <div className="field-group">
          <label htmlFor="title" className="field-label">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field-input field-input-title"
            disabled={isSaving}
          />
        </div>

        <div className="field-group">
          <label htmlFor="description" className="field-label">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field-input field-input-description"
            rows={4}
            disabled={isSaving}
          />
        </div>

        <div className="field-group">
          <label htmlFor="startingPrice" className="field-label">Starting Price</label>
          <input
            id="startingPrice"
            type="number"
            min="1"
            value={startingPrice}
            onChange={(e) => setStartingPrice(Math.max(1, parseInt(e.target.value) || 1))}
            className="field-input"
            disabled={isSaving}
          />
        </div>

        <div className="field-group">
          <label htmlFor="shippingProfile" className="field-label">Shipping Profile</label>
          <select
            id="shippingProfile"
            value={shippingProfile}
            onChange={(e) => setShippingProfile(e.target.value)}
            className="field-input"
            disabled={isSaving}
          >
            {SHIPPING_PROFILES.map((profile) => (
              <option key={profile} value={profile}>
                {profile}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="condition" className="field-label">Condition</label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="field-input"
            disabled={isSaving}
          >
            {CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={isSaving}
        type="button"
      >
        {isSaving ? 'Saving...' : 'Confirm'}
      </button>
    </div>
  );
}
