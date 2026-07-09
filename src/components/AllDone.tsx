import { useTheme } from '../hooks/useTheme';

interface AllDoneProps {
  onCheckAgain: () => void;
}

export function AllDone({ onCheckAgain }: AllDoneProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="all-done-state">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="all-done-content glass-panel">
        <h2 className="all-done-title">All Caught Up!</h2>
        <p className="all-done-message">No cards waiting for review</p>
        <button 
          className="btn btn-secondary" 
          onClick={onCheckAgain}
          type="button"
        >
          Check Again
        </button>
      </div>
    </div>
  );
}
