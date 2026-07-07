interface AllDoneProps {
  onCheckAgain: () => void;
}

export function AllDone({ onCheckAgain }: AllDoneProps) {
  return (
    <div className="all-done-state">
      <div className="all-done-content">
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
