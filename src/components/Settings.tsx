import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserSettings, updateUserSettings, getUsageStats, type UserSettings } from '../services/database';
import { deleteAccount } from '../services/accountService';
import { useTheme } from '../hooks/useTheme';
import { StatusBadge } from './StatusBadge';

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

interface SettingsProps {
  userId: string;
  onLogout: () => void;
  onBack: () => void;
  onTeam: () => void;
}

export function Settings({ userId, onLogout, onBack, onTeam }: SettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState<string>('');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [usageStats, setUsageStats] = useState<{ total: number; thisMonth: number } | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Partial<UserSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
      }

      const settings = await getUserSettings(userId);
      if (settings) {
        setUserSettings(settings);
        setSettingsForm({
          kategorie: settings.kategorie,
          unterkategorie: settings.unterkategorie,
          verkaufsformat: settings.verkaufsformat,
          preis: settings.preis,
          versandprofil: settings.versandprofil,
          zustand: settings.zustand,
        });
      } else {
        // Use database defaults if no settings exist
        setSettingsForm({
          kategorie: 'Sportkarten',
          unterkategorie: 'Soccer Singles',
          verkaufsformat: 'Auction',
          preis: '1',
          versandprofil: 'Pack (50 g)',
          zustand: 'Raw - Very Good',
        });
      }

      const stats = await getUsageStats(userId);
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsError(null);
    setSettingsSuccess(false);
    setSavingSettings(true);

    try {
      await updateUserSettings(userId, settingsForm);
      setSettingsSuccess(true);
      
      // Reload settings to confirm update
      const updated = await getUserSettings(userId);
      if (updated) {
        setUserSettings(updated);
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    
    if (deleteConfirmEmail !== email) {
      setDeleteError('Email does not match');
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteAccount();
      onLogout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const usagePercentage = usageStats && userSettings 
    ? (usageStats.thisMonth / userSettings.monthly_card_limit) * 100 
    : 0;
  const isApproachingLimit = usagePercentage >= 90;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="settings-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="logout-icon-btn" onClick={onLogout} aria-label="Log out">
            🚪
          </button>
        </div>
      </div>

      <div className="settings-content">
        <h1 className="settings-title">Settings</h1>

        {/* Account Section */}
        <div className="settings-section glass-panel">
          <h2 className="section-title">Account</h2>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="field-input"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Change Password</label>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="field-input"
              disabled={changingPassword}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field-input"
              disabled={changingPassword}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field-input"
              disabled={changingPassword}
            />
          </div>

          {passwordError && (
            <div className="settings-error">
              <StatusBadge status="danger" icon="⚠" label={passwordError} />
            </div>
          )}

          {passwordSuccess && (
            <div className="settings-success">
              <StatusBadge status="success" icon="✓" label="Password changed successfully" />
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>

        {/* Listing Defaults Section */}
        <div className="settings-section glass-panel">
          <h2 className="section-title">Listing Defaults</h2>
          
          <div className="field-group">
            <label className="field-label">Sales Format</label>
            <select
              value={settingsForm.verkaufsformat || 'Auction'}
              onChange={(e) => setSettingsForm({ ...settingsForm, verkaufsformat: e.target.value })}
              className="field-input"
              disabled={savingSettings}
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
              value={settingsForm.preis || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, preis: e.target.value })}
              className="field-input"
              disabled={savingSettings}
              placeholder="e.g. 1"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Shipping Profile</label>
            <select
              value={settingsForm.versandprofil || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, versandprofil: e.target.value })}
              className="field-input"
              disabled={savingSettings}
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
              value={settingsForm.zustand || ''}
              onChange={(e) => setSettingsForm({ ...settingsForm, zustand: e.target.value })}
              className="field-input"
              disabled={savingSettings}
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {settingsError && (
            <div className="settings-error">
              <StatusBadge status="danger" icon="⚠" label={settingsError} />
            </div>
          )}

          {settingsSuccess && (
            <div className="settings-success">
              <StatusBadge status="success" icon="✓" label="Settings saved successfully" />
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Usage Section */}
        <div className="settings-section glass-panel">
          <h2 className="section-title">Usage</h2>
          
          <div className="usage-stats">
            <div className="usage-stat">
              <span className="usage-label">Total cards processed</span>
              <span className="usage-value">{usageStats?.total || 0}</span>
            </div>
            <div className="usage-stat">
              <span className="usage-label">This month</span>
              <span className="usage-value">
                {usageStats?.thisMonth || 0} / {userSettings?.monthly_card_limit || 200}
              </span>
            </div>
          </div>

          <div className="usage-progress">
            <div 
              className="usage-bar"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          {isApproachingLimit && (
            <div className="usage-warning">
              <StatusBadge status="warning" icon="⚠" label="Approaching your monthly limit" />
            </div>
          )}
        </div>

        {/* Danger Zone Section */}
        <div className="settings-section danger-zone glass-panel">
          <h2 className="section-title danger-title">Danger Zone</h2>
          
          <button
            className="btn btn-secondary"
            onClick={onLogout}
          >
            Sign Out
          </button>

          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>

          <button
            className="btn btn-secondary"
            onClick={onTeam}
          >
            Team Management
          </button>

          {showDeleteConfirm && (
            <div className="delete-confirm">
              <p className="delete-confirm-text">
                Are you sure you want to delete your account? This action cannot be undone.
                Type your email to confirm:
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                className="field-input"
                disabled={deletingAccount}
              />
              
              {deleteError && (
                <div className="settings-error">
                  <StatusBadge status="danger" icon="⚠" label={deleteError} />
                </div>
              )}

              <div className="delete-confirm-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmEmail('');
                    setDeleteError(null);
                  }}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmEmail !== email}
                >
                  {deletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
