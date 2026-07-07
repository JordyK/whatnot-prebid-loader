interface ConnectionErrorProps {
  message: string;
  onRetry: () => void;
}

export function ConnectionError({ message, onRetry }: ConnectionErrorProps) {
  return (
    <div className="error-state">
      <div className="error-content">
        <h2 className="error-title">Connection Error</h2>
        <p className="error-message">{message}</p>
        <button 
          className="btn btn-secondary" 
          onClick={onRetry}
          type="button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
