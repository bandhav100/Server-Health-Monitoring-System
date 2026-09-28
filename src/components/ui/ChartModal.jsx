import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Maximize2, Minimize2, Server, Timer, X } from 'lucide-react';
import ChartActions from './ChartActions';
import './ChartActions.css';

/**
 * Centered Large Chart Modal Viewer (85–95% viewport width, 80–90% height)
 * - Renders via ReactDOM.createPortal at document.body level
 * - Automatically locks body scroll when open and restores it when closed
 * - Closes on: ✕ button, Close button, Escape key, or backdrop click
 * - Supports native browser fullscreen toggle
 * - Features header metadata (Server badge, Time range, Title, Subtitle)
 * - Footer with real-time last-updated label and download actions
 */
export default function ChartModal({
  isOpen,
  onClose,
  title = 'Chart Viewer',
  subtitle = '',
  server = '',
  timeRange = '',
  updated = '',
  onDownload,
  children,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef(null);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (modalRef.current?.requestFullscreen) {
          await modalRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Browser may block fullscreen request without direct gesture
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="chart-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chart-modal-title"
    >
      <div className="chart-modal-dialog" ref={modalRef}>
        {/* Modal Header */}
        <header className="chart-modal-header">
          <div className="chart-modal-title-area">
            <h2 id="chart-modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="chart-modal-header-actions">
            {server && (
              <span className="chart-modal-badge server-badge" title={`Active Server: ${server}`}>
                <Server size={11} /> {server}
              </span>
            )}
            {timeRange && (
              <span className="chart-modal-badge" title={`Time Range: ${timeRange}`}>
                <Timer size={11} /> {timeRange}
              </span>
            )}

            <button
              type="button"
              className="chart-modal-fullscreen-btn"
              onClick={toggleBrowserFullscreen}
              title={isFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
              aria-label={isFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              type="button"
              className="chart-modal-close-btn"
              onClick={onClose}
              title="Close modal (Esc)"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div className="chart-modal-body">
          <div className="chart-modal-content">
            {children}
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="chart-modal-footer">
          <div className="chart-modal-updated">
            Last updated: <strong>{updated || new Date().toLocaleTimeString()}</strong>
          </div>

          <div className="chart-modal-footer-actions">
            <ChartActions
              title={title}
              showExpand={false}
              showDownload={true}
              onDownload={onDownload}
            />
            <button
              type="button"
              className="chart-modal-btn primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
