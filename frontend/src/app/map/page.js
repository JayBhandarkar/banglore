'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Map, AlertTriangle, TrendingUp, RefreshCw, Star } from 'lucide-react';

// Import Leaflet MapComponent dynamically to disable SSR (since Leaflet requires the browser 'window' object)
const MapComponent = dynamic(
  () => import('../components/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', background: '#090e17' }}>
        <div className="loader"></div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Initializing map interface...</div>
      </div>
    )
  }
);

export default function HotspotMap() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hotspots`);
      const data = await res.json();
      if (data.success) {
        setHotspots(data.data);
      } else {
        setError('Failed to retrieve hotspot intelligence.');
      }
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setError('Could not connect to FastAPI server. Please check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, [API_URL]);

  return (
    <>
      <header className="main-header">
        <h1 className="header-title">
          <Map size={24} color="var(--accent-cyan)" className="glow-text-cyan" />
          <span>Hotspot Intelligence Map</span>
        </h1>
        <div className="header-meta">
          <button 
            onClick={fetchHotspots} 
            className="meta-badge" 
            style={{ border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={12} />
            <span>REFRESH MAP</span>
          </button>
        </div>
      </header>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: 'calc(100vh - var(--header-height) - 64px)', overflow: 'hidden', paddingBottom: '0' }}>
        
        {error && (
          <div style={{
            background: 'var(--high-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '16px 20px',
            borderRadius: '12px',
            color: 'var(--high)',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px', flex: 1, minHeight: 0, marginBottom: '24px' }}>
          
          {/* Hotspot Rankings List */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="panel-header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
              <h3 className="panel-title" style={{ fontSize: '1rem' }}>
                <TrendingUp size={16} color="var(--accent-cyan)" />
                <span>Congestion Rankings</span>
              </h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div className="loader" style={{ width: '20px', height: '20px' }}></div>
                </div>
              ) : hotspots.length > 0 ? (
                hotspots.slice(0, 10).map((spot, i) => {
                  let badgeColor = 'var(--low)';
                  if (spot.score >= 0.85) badgeColor = 'var(--critical)';
                  else if (spot.score >= 0.65) badgeColor = 'var(--high)';
                  else if (spot.score >= 0.3) badgeColor = 'var(--medium)';

                  return (
                    <div 
                      key={spot.id || spot.junction_name} 
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>RANK #{i+1}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: badgeColor, fontFamily: 'monospace' }}>
                          {spot.score.toFixed(4)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {spot.junction_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Tracked Incidents: <strong>{spot.event_count}</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '0.85rem' }}>
                  No hotspots detected in system. Run simulations to generate hotspot telemetry.
                </div>
              )}
            </div>
          </div>

          {/* Interactive Leaflet Map Container */}
          <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              {!loading && (
                <MapComponent hotspots={hotspots} />
              )}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', background: '#090e17' }}>
                  <div className="loader"></div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading coordinate map data...</div>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </>
  );
}
