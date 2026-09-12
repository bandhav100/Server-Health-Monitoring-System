import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Maximize2 } from 'lucide-react';
import './ChartActions.css';

/**
 * Reusable Chart Action Buttons Component
 * Provides:
 * 1. Enlarge / Fullscreen button ([⛶])
 * 2. Download button ([↓]) with a dropdown menu for PNG, CSV, and JSON formats
 */
export default function ChartActions({
  onExpand,
  onDownload,
  title = 'Chart',
  disabled = false,
  showExpand = true,
  showDownload = true,
  className = '',
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleSelectFormat = (format) => {
    setDropdownOpen(false);
    if (typeof onDownload === 'function') {
      onDownload(format);
    }
  };

  return (
    <div className={`chart-actions-group ${className}`} ref={containerRef}>
      {showExpand && (
        <button
          type="button"
          className="chart-action-btn"
          title={`Expand ${title}`}
          aria-label={`Expand ${title}`}
          onClick={onExpand}
          disabled={disabled}
        >
          <Maximize2 size={13} />
        </button>
      )}

      {showDownload && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={`chart-action-btn ${dropdownOpen ? 'active' : ''}`}
            title={`Download ${title}`}
            aria-label={`Download ${title}`}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            onClick={() => setDropdownOpen((prev) => !prev)}
            disabled={disabled}
          >
            <Download size={13} />
          </button>

          {dropdownOpen && (
            <div className="chart-download-dropdown" role="menu">
              <div className="chart-download-dropdown-header">Export Format</div>
              <button
                type="button"
                className="chart-dropdown-item"
                role="menuitem"
                onClick={() => handleSelectFormat('png')}
              >
                <span>
                  <ImageIcon size={13} /> Image
                </span>
                <span className="format-badge">PNG</span>
              </button>
              <button
                type="button"
                className="chart-dropdown-item"
                role="menuitem"
                onClick={() => handleSelectFormat('csv')}
              >
                <span>
                  <FileSpreadsheet size={13} /> Data Sheet
                </span>
                <span className="format-badge">CSV</span>
              </button>
              <button
                type="button"
                className="chart-dropdown-item"
                role="menuitem"
                onClick={() => handleSelectFormat('json')}
              >
                <span>
                  <FileText size={13} /> Telemetry
                </span>
                <span className="format-badge">JSON</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
