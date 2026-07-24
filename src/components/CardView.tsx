import { useState, useEffect } from 'react';
import type { Card } from '../types';
import { HeaderBar } from './HeaderBar';
import { useTeamRole } from '../hooks/useTeamRole';
import { getUserSettings } from '../services/database';
import { supabase } from '../lib/supabase';

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
  onSettings: () => void;
}

export function CardView({ card, confirmedCount, totalCount, onConfirm, isSaving, onLogout, onBack, onSettings }: CardViewProps) {
  const { canConfirm } = useTeamRole();
  const [title, setTitle] = useState(card.ai_title);
  const [description, setDescription] = useState(card.ai_description);
  const [startingPrice, setStartingPrice] = useState(card.starting_price || 1);
  const [shippingProfile, setShippingProfile] = useState(card.shipping_profile || 'Pack (50 g)');
  const [condition, setCondition] = useState(card.condition || 'Raw - Very Good');
  const [userDefaults, setUserDefaults] = useState<{
    shippingProfile: string;
    condition: string;
    startingPrice: string;
  }>({
    shippingProfile: 'Pack (50 g)',
    condition: 'Raw - Very Good',
    startingPrice: '1',
  });

  // Load user settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const settings = await getUserSettings(user.id);
          if (settings) {
            setUserDefaults({
              shippingProfile: settings.versandprofil || 'Pack (50 g)',
              condition: settings.zustand || 'Raw - Very Good',
              startingPrice: settings.preis || '1',
            });
          }
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      }
    };
    loadUserSettings();
  }, []);

  // Reset local state when card changes
  useEffect(() => {
    setTitle(card.ai_title);
    setDescription(card.ai_description);
    
    // Use user defaults if card doesn't have explicit values
    const price = card.starting_price ? card.starting_price : parseInt(userDefaults.startingPrice) || 1;
    const shipping = card.shipping_profile ? card.shipping_profile : userDefaults.shippingProfile;
    const cond = card.condition ? card.condition : userDefaults.condition;
    
    setStartingPrice(price);
    setShippingProfile(shipping);
    setCondition(cond);
  }, [card, userDefaults]);

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
      <HeaderBar onBack={onBack} onSettings={onSettings} onLogout={onLogout} />

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

      {canConfirm && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isSaving}
          type="button"
        >
          {isSaving ? 'Saving...' : 'Confirm'}
        </button>
      )}
      {!canConfirm && (
        <div className="field-info">
          You have read-only access to this card. Only team owners can confirm cards.
        </div>
      )}
    </div>
  );
}
