'use client';

import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  UserCheck, 
  Shield, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Activity, 
  ArrowRight,
  Server
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch analytics
        const statsRes = await fetch(`${API_URL}/api/analytics`);
        const statsData = await statsRes.json();
        
        // Fetch recent history
        const historyRes = await fetch(`${API_URL}/api/history?limit=5`);
        const historyData = await historyRes.json();

        if (statsData.success) {
          setStats(statsData.data);
        }
        if (historyData.success) {
          setHistory(historyData.data);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Could not connect to the FastAPI backend. Make sure the backend server is running on port 8000.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [API_URL]);

  return (
    <>
      <header className="main-header">
        <h1 className="header-title">
          <Activity size={24} color="var(--accent-cyan)" className="glow-text-cyan" />
          <span>Operations Command Centre</span>
        </h1>
        <div className="header-meta">
          <div className="meta-badge">
            <Server size={14} color={error ? "var(--high)" : "var(--low)"} />
            <span>API: {error ? 'OFFLINE' : 'ONLINE'}</span>
          </div>
          <div className="meta-badge">
            <span>Bengaluru Zone</span>
          </div>
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
            fontSize: '0.95rem',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
            <div className="loader"></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Synchronizing command dashboard metrics...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="card-grid">
              <div className="glass-card">
                <div className="glass-card-header">
                  <span>TOTAL INCIDENTS TRACKED</span>
                  <AlertTriangle size={18} color="var(--accent-blue)" />
                </div>
                <div className="glass-card-value">
                  {stats?.total_events ?? 0}
                </div>
                <div className="glass-card-desc">
                  Simulated and recorded events in database
                </div>
              </div>

              <div className="glass-card">
                <div className="glass-card-header">
                  <span>POLICE PERSONNEL ALLOCATED</span>
                  <UserCheck size={18} color="var(--low)" />
                </div>
                <div className="glass-card-value">
                  {stats?.allocated_police ?? 0}
                </div>
                <div className="glass-card-desc">
                  Active field officers deployed
                </div>
              </div>

              <div className="glass-card">
                <div className="glass-card-header">
                  <span>BARRICADES DEPLOYED</span>
                  <Shield size={18} color="var(--medium)" />
                </div>
                <div className="glass-card-value">
                  {stats?.allocated_barricades ?? 0}
                </div>
                <div className="glass-card-desc">
                  Physical traffic diversions placed
                </div>
              </div>

              <div className="glass-card">
                <div className="glass-card-header">
                  <span>AVG RESOLUTION TIME</span>
                  <Clock size={18} color="var(--accent-purple)" />
                </div>
                <div className="glass-card-value">
                  {stats?.avg_duration ? `${stats.avg_duration}m` : '0m'}
                </div>
                <div className="glass-card-desc">
                  Average incident duration before clearance
                </div>
              </div>
            </div>

            {/* Split Panel Grid */}
            <div className="panel-grid">
              {/* Left Column: Recent Activity Log */}
              <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
                <div className="panel-header">
                  <h3 className="panel-title">
                    <TrendingUp size={20} color="var(--accent-cyan)" />
                    <span>Real-time Incident & Prediction Stream</span>
                  </h3>
                  <Link href="/history" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>VIEW ALL</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Junction</th>
                        <th>Zone</th>
                        <th>Event Type</th>
                        <th>Cause</th>
                        <th>Predicted Impact</th>
                        <th>Score</th>
                        <th>Resources Deployed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? (
                        history.map((row) => (
                          <tr key={row.id}>
                            <td style={{ fontWeight: 600 }}>{row.junction}</td>
                            <td>{row.zone}</td>
                            <td style={{ textTransform: 'capitalize' }}>{row.event_type}</td>
                            <td style={{ textTransform: 'capitalize' }}>{row.event_cause?.replace('_', ' ')}</td>
                            <td>
                              <span className={`badge level-${row.predicted_impact_level}`}>
                                {row.predicted_impact_level}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {row.impact_score?.toFixed(4)}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <UserCheck size={14} color="var(--low)" /> {row.police_required}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Shield size={14} color="var(--medium)" /> {row.barricades_required}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                            No simulated events found in database. Go to the <b>Event Simulator</b> to predict traffic impact.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
