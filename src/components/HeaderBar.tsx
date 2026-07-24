import { useTheme } from '../hooks/useTheme';

interface HeaderBarProps {
  onBack?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

export function HeaderBar({ onBack, onSettings, onLogout }: HeaderBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="header-bar">
      {onBack ? (
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
      ) : (
        <span />
      )}
      <div className="header-bar-actions">
        {onSettings && (
          <button className="icon-btn" onClick={onSettings} aria-label="Settings">
            ⚙️
          </button>
        )}
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {onLogout && (
          <button className="icon-btn" onClick={onLogout} aria-label="Log out">
            🚪
          </button>
        )}
      </div>
    </div>
  );
}
