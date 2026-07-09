import { useState, useCallback } from 'react';
import { insertCard } from '../services/database';
import { processCard } from '../services/cardProcessing';
import { useTheme } from '../hooks/useTheme';

interface UploadProps {
  sessionId: string;
  onUploadComplete: (sessionId: string) => void;
  onLogout: () => void;
}

export function Upload({ sessionId, onUploadComplete, onLogout }: UploadProps) {
  const { theme, toggleTheme } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles = Array.from(selectedFiles).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && ['jpg', 'jpeg', 'png', 'heic'].includes(ext);
    });

    if (validFiles.length === 0) {
      setError('Please select valid image files (jpg, png, heic)');
      return;
    }

    setFiles(validFiles);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);
    setFailed([]);

    try {
      // Process files one at a time
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const result = await processCard(file);
          await insertCard(sessionId, {
            file_name: result.file_name,
            image_url: result.image_url,
            brand_set: result.brand_set || null,
            player_name: result.player_name || null,
            serial_number: result.serial_number || null,
            ai_title: result.title,
            ai_description: result.description,
            needs_review: result.needs_review,
            review_reason: result.review_reason,
          });
          setProcessed(i + 1);
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
          setFailed((prev) => [...prev, file.name]);
        }
      }

      onUploadComplete(sessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to process files');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="upload-container">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button className="logout-btn" onClick={onLogout}>
        Log out
      </button>

      <div className="upload-content">
        <h1 className="upload-title">Upload Cards</h1>
        <p className="upload-subtitle">
          Select or drag and drop images to process
        </p>

        {!processing && (
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept=".jpg,.jpeg,.png,.heic"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="file-input"
            />
            <label htmlFor="file-input" className="drop-zone-label">
              <div className="drop-zone-icon">📁</div>
              <div className="drop-zone-text">
                {files.length > 0
                  ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
                  : 'Click to select or drag and drop'}
              </div>
              <div className="drop-zone-hint">
                JPG, PNG, HEIC supported
              </div>
            </label>
          </div>
        )}

        {processing && (
          <div className="progress-container">
            <div className="progress-text">
              {processed} of {files.length} processed
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(processed / files.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && <div className="upload-error">{error}</div>}

        {failed.length > 0 && (
          <div className="failed-files">
            <div className="failed-title">Failed to process:</div>
            {failed.map((name) => (
              <div key={name} className="failed-item">{name}</div>
            ))}
          </div>
        )}

        {!processing && files.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleUpload}
          >
            Start Processing
          </button>
        )}
      </div>
    </div>
  );
}
