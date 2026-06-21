'use client';

import { useEffect, useState } from 'react';
import { History, Search, Filter, Shield, UserCheck, AlertTriangle } from 'lucide-react';

export default function PredictionHistory() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/history?limit=100`);
        const result = await res.json();
        if (result.success) {
          setHistory(result.data);
          setFilteredHistory(result.data);
        } else {
          setError('Failed to fetch prediction history log.');
        }
      } catch (err) {
        console.error('History fetch error:', err);
        setError('Could not connect to FastAPI server. Please check that the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [API_URL]);

  // Apply filters on search term or severity change
  useEffect(() => {
    let temp = [...history];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      temp = temp.filter(
        item => 
          item.junction.toLowerCase().includes(term) ||
          item.zone.toLowerCase().includes(term) ||
          item.corridor.toLowerCase().includes(term) ||
          item.event_cause.toLowerCase().includes(term)
      );
    }

    if (severityFilter !== 'All') {
      temp = temp.filter(item => item.predicted_impact_level === severityFilter);
    }

    setFilteredHistory(temp);
  }, [searchTerm, severityFilter, history]);

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <>
      <header className="main-header">
        <h1 className="header-title">
          <History size={24} color="var(--accent-cyan)" className="glow-text-cyan" />
          <span>Prediction History Logs</span>
        </h1>
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

        {/* Filter Controls Panel */}
        <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            
            {/* Search Input */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Search Junction, Zone, Corridor or Cause</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input" 
                  placeholder="e.g. SilkBoardJunc, Hosur Road, accident..."
                  style={{ paddingLeft: '44px', width: '100%' }}
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div className="form-group">
              <label className="form-label">Filter by Predicted Impact</label>
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="form-select"
              >
                <option value="All">All Severity Levels</option>
                <option value="Low">Low Impact</option>
                <option value="Medium">Medium Impact</option>
                <option value="High">High Impact</option>
                <option value="Critical">Critical Impact</option>
              </select>
            </div>

          </div>
        </div>

        {/* Table Log */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '16px' }}>
            <div className="loader"></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Fetching command log entries...</div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none', margin: '0' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Junction</th>
                    <th>Zone & Corridor</th>
                    <th>Cause</th>
                    <th>Requires Closure</th>
                    <th>Severity Level</th>
                    <th>Impact Score</th>
                    <th>Resource Allocation Deployed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((row) => (
                      <tr key={row.id}>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(row.created_at)}
                        </td>
                        <td style={{ fontWeight: 700, color: 'white' }}>{row.junction}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{row.zone}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{row.corridor}</div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{row.event_cause?.replace('_', ' ')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: row.requires_road_closure ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                            color: row.requires_road_closure ? 'var(--high)' : 'var(--text-muted)'
                          }}>
                            {row.requires_road_closure ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge level-${row.predicted_impact_level}`}>
                            {row.predicted_impact_level}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'white' }}>
                          {row.impact_score?.toFixed(4)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                              <UserCheck size={14} color="var(--low)" /> {row.police_required} Officers
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                              <Shield size={14} color="var(--medium)" /> {row.barricades_required} Barricades
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                        No records match the active search and filter configuration.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
