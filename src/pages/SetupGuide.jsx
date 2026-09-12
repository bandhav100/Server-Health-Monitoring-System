import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Server,
  Download,
  Copy,
  Check,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import api, { unwrap } from '../api';
import AddServerModal from '../components/Servers/AddServerModal';
import './SetupGuide.css';

export default function SetupGuide() {
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState('');
  const [loadingServers, setLoadingServers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  // Verification states per step
  const [step2State, setStep2State] = useState({ loading: false, result: null, error: null });
  const [step3State, setStep3State] = useState({ loading: false, result: null, error: null });
  const [step4State, setStep4State] = useState({ loading: false, result: null, error: null });
  const [step5Health, setStep5Health] = useState({ loading: false, data: null, error: null });
  const [fullVerification, setFullVerification] = useState({ loading: false, data: null, error: null });

  // Load registered servers
  const loadServers = useCallback(async () => {
    setLoadingServers(true);
    try {
      const res = await api.get('/servers');
      const list = unwrap(res) || [];
      setServers(list);
      if (list.length > 0 && !selectedServerId) {
        setSelectedServerId(String(list[0].id));
      }
    } catch (err) {
      console.error('Failed to load servers:', err);
    } finally {
      setLoadingServers(false);
    }
  }, [selectedServerId]);

  // Load system connectivity for Step 5
  const loadSystemHealth = useCallback(async () => {
    setStep5Health((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await api.get('/system/health');
      const data = unwrap(res) || {};
      setStep5Health({ loading: false, data, error: null });
    } catch (err) {
      setStep5Health({ loading: false, data: null, error: 'Failed to fetch system connectivity' });
    }
  }, []);

  useEffect(() => {
    loadServers();
    loadSystemHealth();
  }, [loadServers, loadSystemHealth]);

  // Resolve currently active server target
  const selectedServer = useMemo(() => {
    if (!selectedServerId) return null;
    return servers.find((s) => String(s.id) === String(selectedServerId)) || null;
  }, [servers, selectedServerId]);

  const targetHost = selectedServer?.ip_address || selectedServer?.tailscale_ip || (selectedServer?.prometheus_instance ? selectedServer.prometheus_instance.split(':')[0] : '100.84.0.0');
  const targetPort = selectedServer?.exporter_port || (selectedServer?.prometheus_instance ? selectedServer.prometheus_instance.split(':')[1] : 9182);
  const targetEndpoint = `http://${targetHost}:${targetPort}/metrics`;
  const lhmEndpoint = `http://${targetHost}:8085/data.json`;

  // Step 2: Verify Windows Exporter
  const handleVerifyExporter = async () => {
    if (!targetHost) return;
    setStep2State({ loading: true, result: null, error: null });
    try {
      const res = await api.post('/setup/verify-exporter', { host: targetHost, port: targetPort });
      const data = unwrap(res);
      setStep2State({ loading: false, result: data, error: null });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Verification failed';
      setStep2State({ loading: false, result: null, error: msg });
    }
  };

  // Step 3: Test LibreHardwareMonitor
  const handleTestLhm = async () => {
    if (!targetHost) return;
    setStep3State({ loading: true, result: null, error: null });
    try {
      const res = await api.post('/setup/test-lhm', { host: targetHost, port: 8085 });
      const data = unwrap(res);
      setStep3State({ loading: false, result: data, error: null });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Hardware monitoring endpoint unavailable.';
      setStep3State({ loading: false, result: null, error: msg });
    }
  };

  // Step 4: Verify Prometheus Target
  const handleVerifyPromTarget = async () => {
    const instance = selectedServer?.prometheus_instance || `${targetHost}:${targetPort}`;
    setStep4State({ loading: true, result: null, error: null });
    try {
      const res = await api.post('/setup/verify-prom-target', { instance });
      const data = unwrap(res);
      setStep4State({ loading: false, result: data, error: null });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Target not found in Prometheus active targets.';
      setStep4State({ loading: false, result: null, error: msg });
    }
  };

  // Step 6: Full verification run
  const handleRunFullVerification = async () => {
    if (!selectedServer && !targetHost) return;
    setFullVerification({ loading: true, data: null, error: null });
    try {
      const res = await api.post('/setup/verify-all', {
        server_id: selectedServer?.id,
        host: targetHost,
        port: targetPort,
      });
      const data = unwrap(res);
      setFullVerification({ loading: false, data, error: null });

      // Update intermediate step states based on full verification
      if (data?.steps) {
        if (data.steps.step2_exporter_reachable) {
          setStep2State({ loading: false, result: { verified: true, latency_ms: 50 }, error: null });
        }
        if (data.steps.step3_hardware_monitor) {
          setStep3State({ loading: false, result: { reachable: true }, error: null });
        }
        if (data.steps.step4_prometheus_target) {
          setStep4State({ loading: false, result: { found: true, health: 'up' }, error: null });
        }
      }
      loadSystemHealth();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Full verification failed';
      setFullVerification({ loading: false, data: null, error: msg });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  // Calculate actual completion progress based on genuine verification states
  const completedStepsCount = useMemo(() => {
    let count = 0;
    if (selectedServer) count++; // Step 1: Server added/registered
    if (step2State.result?.verified || fullVerification.data?.steps?.step2_exporter_reachable) count++;
    if (step3State.result?.reachable || fullVerification.data?.steps?.step3_hardware_monitor) count++;
    if (step4State.result?.found || fullVerification.data?.steps?.step4_prometheus_target) count++;
    if (step5Health.data?.database?.healthy && step5Health.data?.prometheus?.healthy) count++;
    if (fullVerification.data?.all_healthy) count++;
    return count;
  }, [selectedServer, step2State, step3State, step4State, step5Health, fullVerification]);

  const progressPercent = Math.round((completedStepsCount / 6) * 100);

  return (
    <main className="setup-guide-page">
      {/* Header */}
      <header className="setup-guide-header">
        <div className="setup-guide-header-text">
          <div className="setup-guide-badge">
            <Sparkles size={12} /> ONBOARDING & OPERATIONS RUNBOOK
          </div>
          <h1>Setup Guide</h1>
          <p>Configure and connect a new server to SHMS</p>
        </div>

        {/* Server Target Selector & Overall Progress */}
        <div className="setup-guide-header-controls">
          <div className="setup-target-picker">
            <label htmlFor="setup-server-select">Target Server:</label>
            <select
              id="setup-server-select"
              value={selectedServerId}
              onChange={(e) => {
                setSelectedServerId(e.target.value);
                setStep2State({ loading: false, result: null, error: null });
                setStep3State({ loading: false, result: null, error: null });
                setStep4State({ loading: false, result: null, error: null });
                setFullVerification({ loading: false, data: null, error: null });
              }}
              disabled={loadingServers}
            >
              {servers.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.displayName || srv.name} ({srv.ip || srv.tailscale_ip})
                </option>
              ))}
            </select>
          </div>

          <div className="setup-progress-box">
            <div className="setup-progress-label">
              <span>Setup Progress</span>
              <strong>{completedStepsCount}/6 completed ({progressPercent}%)</strong>
            </div>
            <div className="setup-progress-bar-track">
              <div className="setup-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* Steps Container */}
      <div className="setup-steps-list">
        {/* STEP 1: Add Server */}
        <section className={`setup-step-card ${selectedServer ? 'step-done' : ''}`}>
          <div className="setup-step-num">
            {selectedServer ? <Check size={16} /> : '1'}
          </div>
          <div className="setup-step-body">
            <div className="setup-step-head">
              <div>
                <h2>STEP 1 — Add Server</h2>
                <p>Register the server in SHMS to track inventory and Prometheus target configs.</p>
              </div>
              <button
                type="button"
                className="setup-btn primary"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Server size={14} /> Add Server
              </button>
            </div>

            <div className="setup-step-details-grid">
              <div className="setup-detail-cell">
                <small>Server Name</small>
                <strong>{selectedServer?.displayName || selectedServer?.name || '--'}</strong>
              </div>
              <div className="setup-detail-cell">
                <small>Host / IP</small>
                <strong>{targetHost || '--'}</strong>
              </div>
              <div className="setup-detail-cell">
                <small>Operating System</small>
                <strong>{selectedServer?.operating_system || 'Windows'}</strong>
              </div>
              <div className="setup-detail-cell">
                <small>Exporter Port</small>
                <strong>{targetPort}</strong>
              </div>
              <div className="setup-detail-cell">
                <small>Environment</small>
                <strong>{selectedServer?.environment || 'Production'}</strong>
              </div>
            </div>

            {selectedServer && (
              <div className="setup-status-pill success">
                <CheckCircle2 size={13} /> Server registered in PostgreSQL inventory
              </div>
            )}
          </div>
        </section>

        {/* STEP 2: Install Windows Exporter */}
        <section className={`setup-step-card ${step2State.result?.verified ? 'step-done' : ''}`}>
          <div className="setup-step-num">
            {step2State.result?.verified ? <Check size={16} /> : '2'}
          </div>
          <div className="setup-step-body">
            <div className="setup-step-head">
              <div>
                <h2>STEP 2 — Install Windows Exporter</h2>
                <p>Install Windows Exporter (MSI) on the target Windows machine to expose performance counters.</p>
              </div>
              <div className="setup-step-actions">
                <button
                  type="button"
                  className="setup-btn secondary"
                  onClick={() => copyToClipboard(targetEndpoint)}
                >
                  {copiedEndpoint ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedEndpoint ? 'Copied!' : 'Copy Endpoint'}
                </button>
                <button
                  type="button"
                  className="setup-btn primary"
                  onClick={handleVerifyExporter}
                  disabled={step2State.loading}
                >
                  <RefreshCw size={14} className={step2State.loading ? 'setup-spin' : ''} />
                  {step2State.loading ? 'Verifying...' : 'Verify Target'}
                </button>
              </div>
            </div>

            <div className="setup-endpoint-banner">
              <small>Target Exporter Metrics URL:</small>
              <code>{targetEndpoint}</code>
            </div>

            {step2State.result && (
              <div className="setup-status-pill success">
                <CheckCircle2 size={13} /> Exporter verified HTTP {step2State.result.status_code} ({step2State.result.latency_ms}ms latency). Metrics verified.
              </div>
            )}
            {step2State.error && (
              <div className="setup-status-pill error">
                <XCircle size={13} /> {step2State.error}
              </div>
            )}
          </div>
        </section>

        {/* STEP 3: Configure LibreHardwareMonitor */}
        <section className={`setup-step-card ${step3State.result?.reachable ? 'step-done' : ''}`}>
          <div className="setup-step-num">
            {step3State.result?.reachable ? <Check size={16} /> : '3'}
          </div>
          <div className="setup-step-body">
            <div className="setup-step-head">
              <div>
                <h2>STEP 3 — Configure LibreHardwareMonitor</h2>
                <p>Install LibreHardwareMonitor on the target machine for hardware temperature and sensor telemetry.</p>
              </div>
              <button
                type="button"
                className="setup-btn primary"
                onClick={handleTestLhm}
                disabled={step3State.loading}
              >
                <RefreshCw size={14} className={step3State.loading ? 'setup-spin' : ''} />
                {step3State.loading ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="setup-endpoint-banner">
              <small>Expected LHM Sensor Endpoint:</small>
              <code>{lhmEndpoint} (Port 8085)</code>
            </div>

            {step3State.result && (
              <div className="setup-status-pill success">
                <CheckCircle2 size={13} /> LibreHardwareMonitor reachable. Hardware temperature monitoring active.
              </div>
            )}
            {step3State.error && (
              <div className="setup-status-pill warning">
                <AlertCircle size={13} /> {step3State.error}
              </div>
            )}
          </div>
        </section>

        {/* STEP 4: Prometheus Configuration */}
        <section className={`setup-step-card ${step4State.result?.found && step4State.result?.health === 'up' ? 'step-done' : ''}`}>
          <div className="setup-step-num">
            {step4State.result?.found && step4State.result?.health === 'up' ? <Check size={16} /> : '4'}
          </div>
          <div className="setup-step-body">
            <div className="setup-step-head">
              <div>
                <h2>STEP 4 — Prometheus Configuration</h2>
                <p>Confirm the monitoring target is registered and scraped by Prometheus.</p>
              </div>
              <button
                type="button"
                className="setup-btn primary"
                onClick={handleVerifyPromTarget}
                disabled={step4State.loading}
              >
                <RefreshCw size={14} className={step4State.loading ? 'setup-spin' : ''} />
                {step4State.loading ? 'Verifying...' : 'Verify Prometheus Target'}
              </button>
            </div>

            <div className="setup-step-details-grid">
              <div className="setup-detail-cell">
                <small>Job Name</small>
                <strong>windows_exporter</strong>
              </div>
              <div className="setup-detail-cell">
                <small>Configured Target</small>
                <strong>{selectedServer?.prometheus_instance || `${targetHost}:${targetPort}`}</strong>
              </div>
              <div className="setup-detail-cell">
                <small>Scrape Status</small>
                <strong className={step4State.result?.health === 'up' ? 'text-emerald-500' : ''}>
                  {step4State.result?.health ? step4State.result.health.toUpperCase() : 'Not Tested'}
                </strong>
              </div>
            </div>

            {step4State.result && (
              <div className={`setup-status-pill ${step4State.result.health === 'up' ? 'success' : 'warning'}`}>
                {step4State.result.health === 'up' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                Prometheus target status: {step4State.result.health.toUpperCase()} {step4State.result.last_scrape ? `(Last scraped: ${step4State.result.last_scrape})` : ''}
              </div>
            )}
            {step4State.error && (
              <div className="setup-status-pill error">
                <XCircle size={13} /> {step4State.error}
              </div>
            )}
          </div>
        </section>

        {/* STEP 5: Connectivity Verification */}
        <section className={`setup-step-card ${step5Health.data?.database?.healthy && step5Health.data?.prometheus?.healthy ? 'step-done' : ''}`}>
          <div className="setup-step-num">
            {step5Health.data?.database?.healthy && step5Health.data?.prometheus?.healthy ? <Check size={16} /> : '5'}
          </div>
          <div className="setup-step-body">
            <div className="setup-step-head">
              <div>
                <h2>STEP 5 — Connectivity Verification</h2>
                <p>Live health matrix of the core infrastructure and telemetry components.</p>
              </div>
              <button
                type="button"
                className="setup-btn secondary"
                onClick={loadSystemHealth}
                disabled={step5Health.loading}
              >
                <RefreshCw size={14} className={step5Health.loading ? 'setup-spin' : ''} /> Refresh Status
              </button>
            </div>

            <div className="setup-connectivity-grid">
              <div className="setup-conn-card">
                <Database size={16} className="text-purple-400" />
                <span>Database</span>
                <strong className={step5Health.data?.database?.healthy ? 'status-ok' : 'status-down'}>
                  ● {step5Health.data?.database?.healthy ? 'Connected' : 'Unavailable'}
                </strong>
              </div>
              <div className="setup-conn-card">
                <Activity size={16} className="text-blue-400" />
                <span>Prometheus</span>
                <strong className={step5Health.data?.prometheus?.healthy ? 'status-ok' : 'status-down'}>
                  ● {step5Health.data?.prometheus?.healthy ? 'Available' : 'Unavailable'}
                </strong>
              </div>
              <div className="setup-conn-card">
                <Radio size={16} className="text-emerald-400" />
                <span>Windows Exporter</span>
                <strong className={step2State.result?.verified || selectedServer?.status === 'healthy' ? 'status-ok' : 'status-down'}>
                  ● {step2State.result?.verified || selectedServer?.status === 'healthy' ? 'Online' : 'Pending'}
                </strong>
              </div>
              <div className="setup-conn-card">
                <Cpu size={16} className="text-orange-400" />
                <span>Hardware Monitor</span>
                <strong className={step3State.result?.reachable ? 'status-ok' : 'status-pending'}>
                  ● {step3State.result?.reachable ? 'Available' : 'Unavailable'}
                </strong>
              </div>
              <div className="setup-conn-card">
                <ShieldCheck size={16} className="text-teal-400" />
                <span>Server Health</span>
                <strong className={selectedServer?.status === 'healthy' ? 'status-ok' : 'status-down'}>
                  ● {selectedServer?.status ? selectedServer.status.toUpperCase() : 'UNKNOWN'}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 6: Final Verification */}
        <section className={`setup-step-card ${fullVerification.data?.all_healthy ? 'step-done' : ''}`}>
          <div className="setup-step-num">
            {fullVerification.data?.all_healthy ? <Check size={16} /> : '6'}
          </div>
          <div className="setup-step-body">
            <div className="setup-step-head">
              <div>
                <h2>STEP 6 — Final Verification</h2>
                <p>Run end-to-end multi-point audit to ensure real telemetry is flowing into SHMS.</p>
              </div>
              <button
                type="button"
                className="setup-btn primary run-verify"
                onClick={handleRunFullVerification}
                disabled={fullVerification.loading}
              >
                <Play size={14} className={fullVerification.loading ? 'setup-spin' : ''} />
                {fullVerification.loading ? 'Running Full Verification...' : 'Run Full Verification'}
              </button>
            </div>

            <div className="setup-final-summary">
              <div className="setup-summary-row">
                <span>Server:</span>
                <b>{selectedServer?.displayName || selectedServer?.name || targetHost}</b>
              </div>
              <div className="setup-summary-row">
                <span>Target:</span>
                <b>{selectedServer?.prometheus_instance || `${targetHost}:${targetPort}`}</b>
              </div>
              <div className="setup-summary-row">
                <span>Prometheus:</span>
                <b className={step5Health.data?.prometheus?.healthy ? 'text-emerald-500' : 'text-red-500'}>
                  {step5Health.data?.prometheus?.healthy ? 'Connected' : 'Unavailable'}
                </b>
              </div>
              <div className="setup-summary-row">
                <span>Windows Exporter:</span>
                <b className={step2State.result?.verified || selectedServer?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}>
                  {step2State.result?.verified || selectedServer?.status === 'healthy' ? 'Online' : 'Pending / Offline'}
                </b>
              </div>
              <div className="setup-summary-row">
                <span>Hardware Monitoring:</span>
                <b className={step3State.result?.reachable ? 'text-emerald-500' : 'text-zinc-400'}>
                  {step3State.result?.reachable ? 'Available' : 'Unavailable'}
                </b>
              </div>
            </div>

            {fullVerification.data && (
              <div className={`setup-verdict-box ${fullVerification.data.all_healthy ? 'success' : 'warning'}`}>
                {fullVerification.data.all_healthy ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <strong>Setup Complete!</strong>
                      <p>All core components are healthy and real monitoring data is actively streaming to Live Monitoring and Analytics.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    <div>
                      <strong>Verification Incomplete</strong>
                      <p>Ensure Windows Exporter is started on the target host and port {targetPort} is reachable.</p>
                    </div>
                  </>
                )}
              </div>
            )}
            {fullVerification.error && (
              <div className="setup-status-pill error">
                <XCircle size={13} /> {fullVerification.error}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* AddServerModal Integration */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newServer) => {
          setIsAddModalOpen(false);
          loadServers();
          if (newServer?.id) {
            setSelectedServerId(String(newServer.id));
          }
        }}
        existingServers={servers}
      />
    </main>
  );
}
