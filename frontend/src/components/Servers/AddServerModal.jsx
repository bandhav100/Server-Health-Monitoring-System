import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../api';

const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const HOSTNAME_REGEX = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

export const AddServerModal = ({ isOpen, onClose, onSuccess, existingServers = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    operating_system: 'Windows',
    port: '9182',
    environment: 'Production',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [backendWarning, setBackendWarning] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        host: '',
        operating_system: 'Windows',
        port: '9182',
        environment: 'Production',
        description: '',
      });
      setErrors({});
      setBackendError(null);
      setBackendWarning(null);
      setSuccessMessage(null);
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const validateField = (field, value) => {
    const val = (value || '').trim();
    switch (field) {
      case 'name':
        if (!val) return 'Server name is required.';
        if (existingServers.some((s) => (s.hostname || s.name || '').toLowerCase() === val.toLowerCase())) {
          return 'Server already exists.';
        }
        return null;
      case 'host': {
        if (!val) return 'Enter a valid hostname or IP address.';
        const parts = val.split('.');
        if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
          if (!IP_REGEX.test(val)) return 'Enter a valid hostname or IP address.';
          return null;
        }
        if (!HOSTNAME_REGEX.test(val) || /^\d+$/.test(val.replace(/\./g, ''))) {
          return 'Enter a valid hostname or IP address.';
        }
        return null;
      }
      case 'port': {
        const portNum = Number(val);
        if (!val || Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
          return 'Port must be between 1 and 65535.';
        }
        const target = `${formData.host.trim()}:${portNum}`;
        if (
          formData.host.trim() &&
          existingServers.some((s) => (s.prometheus_instance || '').toLowerCase() === target.toLowerCase())
        ) {
          return 'This monitoring target is already configured.';
        }
        return null;
      }
      default:
        return null;
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (backendError) setBackendError(null);
    if (backendWarning) setBackendWarning(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError(null);
    setBackendWarning(null);

    // Validate all fields
    const nameErr = validateField('name', formData.name);
    const hostErr = validateField('host', formData.host);
    const portErr = validateField('port', formData.port);

    const validationErrors = {};
    if (nameErr) validationErrors.name = nameErr;
    if (hostErr) validationErrors.host = hostErr;
    if (portErr) validationErrors.port = portErr;

    // Check composite target duplicate
    const target = `${formData.host.trim()}:${formData.port.trim()}`;
    if (
      !validationErrors.host &&
      !validationErrors.port &&
      existingServers.some((s) => (s.prometheus_instance || '').toLowerCase() === target.toLowerCase())
    ) {
      validationErrors.host = 'This monitoring target is already configured.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        host: formData.host.trim(),
        port: parseInt(formData.port.trim(), 10),
        operating_system: formData.operating_system,
        environment: formData.environment,
        description: formData.description.trim(),
      };

      const response = await api.post('/servers', payload);
      const data = response.data;

      if (data.success) {
        setSuccessMessage(data.message || 'Server added successfully.');
        setTimeout(() => {
          if (onSuccess) onSuccess(data.data?.server || data.server);
          onClose();
        }, 1200);
      } else if (response.status === 207 || data.server_saved) {
        // Server was saved in DB, but Prometheus reload had an issue
        setBackendWarning(data.message || 'Server saved, but Prometheus reload failed.');
        setTimeout(() => {
          if (onSuccess) onSuccess(data.data?.server || data.server);
          onClose();
        }, 2200);
      } else {
        setBackendError(data.message || 'Server registration failed.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Server registration failed.';
      setBackendError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-server-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <motion.div
        className="add-server-modal-card"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Modal Header */}
        <div className="add-server-modal-header">
          <div className="add-server-modal-header-icon">
            <Server size={22} />
          </div>
          <div className="add-server-modal-header-text">
            <h2>Add Server</h2>
            <p>Register a new Windows monitoring target and connect it to Prometheus.</p>
          </div>
          <button
            type="button"
            className="add-server-modal-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Banners */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="add-server-alert success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {backendWarning && (
            <motion.div
              className="add-server-alert warning"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={16} />
              <span>{backendWarning}</span>
            </motion.div>
          )}

          {backendError && (
            <motion.div
              className="add-server-alert error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={16} />
              <span>{backendError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="add-server-form" noValidate>
          {/* Row 1: Server Name & Host */}
          <div className="add-server-form-row">
            <div className="add-server-form-group">
              <label htmlFor="server-name-input">
                Server Name / Hostname <span className="required">*</span>
              </label>
              <input
                id="server-name-input"
                ref={nameInputRef}
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. DESKTOP-ABC123"
                disabled={submitting}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error-text">{errors.name}</span>}
              {!errors.name && <span className="field-helper-text">Unique display name for the server</span>}
            </div>

            <div className="add-server-form-group">
              <label htmlFor="server-host-input">
                Host / IP Address <span className="required">*</span>
              </label>
              <input
                id="server-host-input"
                type="text"
                value={formData.host}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="e.g. 100.104.89.32 or hostname"
                disabled={submitting}
                className={errors.host ? 'input-error' : ''}
              />
              {errors.host && <span className="field-error-text">{errors.host}</span>}
              {!errors.host && <span className="field-helper-text">IPv4 address or resolvable hostname</span>}
            </div>
          </div>

          {/* Row 2: OS, Port, Environment */}
          <div className="add-server-form-row three-col">
            <div className="add-server-form-group">
              <label htmlFor="server-os-select">Operating System</label>
              <select
                id="server-os-select"
                value={formData.operating_system}
                onChange={(e) => handleChange('operating_system', e.target.value)}
                disabled={submitting}
              >
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
                <option value="Other">Other</option>
              </select>
              <span className="field-helper-text">Target host platform</span>
            </div>

            <div className="add-server-form-group">
              <label htmlFor="server-port-input">
                Exporter Port <span className="required">*</span>
              </label>
              <input
                id="server-port-input"
                type="number"
                min="1"
                max="65535"
                value={formData.port}
                onChange={(e) => handleChange('port', e.target.value)}
                placeholder="9182"
                disabled={submitting}
                className={errors.port ? 'input-error' : ''}
              />
              {errors.port && <span className="field-error-text">{errors.port}</span>}
              {!errors.port && <span className="field-helper-text">Default Windows Exporter: 9182</span>}
            </div>

            <div className="add-server-form-group">
              <label htmlFor="server-env-select">Environment</label>
              <select
                id="server-env-select"
                value={formData.environment}
                onChange={(e) => handleChange('environment', e.target.value)}
                disabled={submitting}
              >
                <option value="Production">Production</option>
                <option value="Development">Development</option>
                <option value="Testing">Testing</option>
              </select>
              <span className="field-helper-text">Operational tier</span>
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="add-server-form-group">
            <label htmlFor="server-desc-input">Description (Optional)</label>
            <textarea
              id="server-desc-input"
              rows="2"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g. Primary database server or engineering workstation"
              disabled={submitting}
            />
          </div>

          {/* Prometheus Target Summary Box */}
          <div className="add-server-target-preview">
            <div className="add-server-target-preview-icon">
              <ShieldCheck size={16} />
            </div>
            <div className="add-server-target-preview-info">
              <span className="add-server-target-preview-label">Configured Prometheus Target</span>
              <code className="add-server-target-preview-val">
                {formData.host.trim() ? `${formData.host.trim()}:${formData.port || '9182'}` : 'awaiting host...'}
              </code>
            </div>
          </div>

          {/* Form Actions */}
          <div className="add-server-modal-actions">
            <button
              type="button"
              className="add-server-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-server-btn-submit"
              disabled={submitting || Boolean(successMessage)}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Adding Server...
                </>
              ) : successMessage ? (
                <>
                  <CheckCircle2 size={16} />
                  Added!
                </>
              ) : (
                'Add Server'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddServerModal;
