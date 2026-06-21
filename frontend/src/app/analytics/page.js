'use client';

import { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/analytics`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError('Failed to load analytics statistics.');
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Could not connect to FastAPI server. Please check that the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [API_URL]);

  // Pre-process chart data
  const severityData = data ? Object.entries(data.severity_distribution).map(([level, count]) => ({
    name: level,
    value: count
  })) : [];

  const SEVERITY_COLORS = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#ef4444',
    'Critical': '#ec4899'
  };

  const hourlyData = data ? Array.from({ length: 24 }).map((_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count: data.hourly_distribution[hour] || 0
  })) : [];

  const causeData = data ? Object.entries(data.cause_distribution).map(([cause, count]) => ({
    cause: cause.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    count: count
  })) : [];

  return (
    <>
      <header className="main-header">
        <h1 className="header-title">
          <BarChart3 size={24} color="var(--accent-cyan)" className="glow-text-cyan" />
          <span>Analytics & Insights</span>
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

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
            <div className="loader"></div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Analyzing traffic event telemetry database...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Row 1: Severity Distribution & Hourly Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              
              {/* Severity Pie Chart */}
              <div className="glass-card">
                <div className="panel-header">
                  <h3 className="panel-title" style={{ fontSize: '1rem' }}>Incident Severity Ratios</h3>
                </div>
                
                <div style={{ height: '260px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {severityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {severityData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={SEVERITY_COLORS[entry.name] || '#3b82f6'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  {Object.entries(SEVERITY_COLORS).map(([name, color]) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
                      <span>{name} ({data.severity_distribution[name] || 0})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Activity Area Chart */}
              <div className="glass-card">
                <div className="panel-header">
                  <h3 className="panel-title" style={{ fontSize: '1rem' }}>Hourly Incident Peak Patterns</h3>
                </div>
                
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Row 2: Causes Bar Chart */}
            <div className="glass-card">
              <div className="panel-header">
                <h3 className="panel-title" style={{ fontSize: '1rem' }}>Top Incident Root Causes</h3>
              </div>
              
              <div style={{ height: '300px', width: '100%' }}>
                {causeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={causeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="cause" stroke="var(--text-muted)" fontSize={10} angle={-15} textAnchor="end" interval={0} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white' }}
                      />
                      <Bar dataKey="count" fill="var(--accent-purple)" radius={[4, 4, 0, 0]}>
                        {causeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-purple)' : 'var(--accent-cyan)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No cause telemetry available. Run simulators to populate.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </>
  );
}
