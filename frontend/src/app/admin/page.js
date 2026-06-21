'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Server, Database, HardDrive, RefreshCw, Terminal } from 'lucide-react';

export default function AdminPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemInfo, setSystemInfo] = useState({
    status: 'checking',
    db_type: 'unknown',
    latency: '0ms'
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const checkSystemAndLogs = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      
      // Ping root for status
      const pingRes = await fetch(`${API_URL}/`);
      const pingData = await pingRes.json();
      
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      setSystemInfo({
        status: pingData.status || 'online',
        db_type: pingData.database || 'Local SQLite',
        latency: `${latencyMs}ms`
      });

      // Fetch audit logs
      const auditRes = await fetch(`${API_URL}/api/audit-logs`);
      const auditData = await auditRes.json();
      
      if (auditData.success) {
        setLogs(auditData.data);
      } else {
        setError('Failed to fetch audit log stream.');
      }
    } catch (err) {
      console.error('Admin diagnostics error:', err);
      setError('Could not connect to FastAPI server. Backend appears to be offline.');
      setSystemInfo({
        status: 'offline',
        db_type: 'none',
        latency: 'timeout'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemAndLogs();
  }, [API_URL]);

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString();
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <>
      <header className="main-header">
        <h1 className="header-title">
          <ShieldAlert size={24} color="var(--accent-cyan)" className="glow-text-cyan" />
          <span>System Administration Panel</span>
        </h1>
        <div className="header-meta">
          <button 
            onClick={checkSystemAndLogs} 
            className="meta-badge" 
            style={{ border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={12} />
            <span>RUN DIAGNOSTICS</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div style={{
            background: 'var(--high-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '16px 20px',
            borderRadius: '12px',
            color: 'var(--high)',
            fontSize: '0.9rem',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Diagnostics Dashboard Cards */}
        <div className="card-grid" style={{ marginBottom: '32px' }}>
          
          <div className="glass-card">
            <div className="glass-card-header">
              <span>API SERVER ENVIRONMENT</span>
              <Server size={18} color="var(--accent-blue)" />
            </div>
            <div className="glass-card-value" style={{ textTransform: 'uppercase', fontSize: '1.8rem', color: systemInfo.status === 'offline' ? 'var(--high)' : 'var(--low)' }}>
              {systemInfo.status === 'offline' ? 'OFFLINE' : 'RUNNING'}
            </div>
            <div className="glass-card-desc">
              FastAPI backend router hosted on <b>port 8000</b>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <span>DATABASE SYNCHRONIZATION</span>
              <Database size={18} color="var(--accent-cyan)" />
            </div>
            <div className="glass-card-value" style={{ fontSize: '1.4rem', padding: '6px 0', color: 'white' }}>
              {systemInfo.db_type}
            </div>
            <div className="glass-card-desc">
              Database instance currently serving request state
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <span>API LATENCY MARKER</span>
              <HardDrive size={18} color="var(--accent-purple)" />
            </div>
            <div className="glass-card-value" style={{ fontFamily: 'monospace' }}>
              {systemInfo.latency}
            </div>
            <div className="glass-card-desc">
              Command and response loop clearance latency
            </div>
          </div>

        </div>

        {/* Audit Log Terminal Stream */}
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div className="panel-header" style={{ padding: '20px 24px', margin: '0', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="panel-title" style={{ fontSize: '1.05rem' }}>
              <Terminal size={18} color="var(--accent-cyan)" />
              <span>Real-time Administrative Audit Logs</span>
            </h3>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '30vh', gap: '12px' }}>
              <div className="loader" style={{ width: '20px', height: '20px' }}></div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Querying logs audit stream...</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', margin: '0' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Timestamp</th>
                    <th style={{ width: '25%' }}>Action Event</th>
                    <th style={{ width: '50%' }}>Description / Payload Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {formatDate(log.created_at || log.timestamp)}
                        </td>
                        <td>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            background: log.action.includes('ERROR') ? 'var(--high-bg)' : 'rgba(255,255,255,0.03)',
                            color: log.action.includes('ERROR') ? 'var(--high)' : 'var(--accent-cyan)',
                            fontWeight: 700
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{log.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px', fontFamily: 'sans-serif' }}>
                        No system audit logs found. Run simulator events to populate system log activity.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
