'use client';

import { useState } from 'react';
import { 
  Cpu, 
  AlertTriangle, 
  UserCheck, 
  Shield, 
  Compass, 
  Clock, 
  MapPin, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

const BENGALURU_JUNCTIONS = {
  'SilkBoardJunc': { lat: 12.9176, lon: 77.6244, zone: 'South Zone 1', corridor: 'Hosur Road' },
  'HebbalFlyoverJunc': { lat: 13.0358, lon: 77.5978, zone: 'North Zone 1', corridor: 'Bellary Road 1' },
  'UrvashiJunction': { lat: 12.9575, lon: 77.5855, zone: 'Central Zone 1', corridor: 'CBD 2' },
  'IbblurJunction': { lat: 12.9234, lon: 77.6645, zone: 'East Zone 1', corridor: 'ORR East 1' },
  'LalbaghMainGateJunc': { lat: 12.9562, lon: 77.5880, zone: 'Central Zone 2', corridor: 'CBD 2' },
  'QueensStatueCircle': { lat: 12.9779, lon: 77.6009, zone: 'Central Zone 1', corridor: 'CBD 2' },
  'MysoreRd-RingRdJunc(Nayandanahallii)': { lat: 12.9463, lon: 77.5332, zone: 'West Zone 1', corridor: 'ORR West 1' },
  '28thMainJayanagarJunc': { lat: 12.9192, lon: 77.5936, zone: 'South Zone 2', corridor: 'Non-corridor' },
  'Peenya14thCrossJunc': { lat: 13.0315, lon: 77.5312, zone: 'West Zone 2', corridor: 'Tumkur Road' },
  'RingRoad-UllalJunction': { lat: 12.9641, lon: 77.4988, zone: 'West Zone 1', corridor: 'ORR West 1' }
};

export default function Simulator() {
  const [formData, setFormData] = useState({
    event_type: 'unplanned',
    event_cause: 'vehicle_breakdown',
    requires_road_closure: false,
    veh_type: 'private_car',
    corridor: 'Non-corridor',
    zone: 'South Zone 1',
    junction: 'SilkBoardJunc',
    latitude: 12.9176,
    longitude: 77.6244,
    start_datetime: '',
    closed_datetime: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (name === 'junction' && BENGALURU_JUNCTIONS[value]) {
      // Autocomplete coordinates and metadata
      const junc = BENGALURU_JUNCTIONS[value];
      setFormData(prev => ({
        ...prev,
        junction: value,
        latitude: junc.lat,
        longitude: junc.lon,
        zone: junc.zone,
        corridor: junc.corridor
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: val
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Default datetime values if empty
    const now = new Date();
    const payload = {
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      start_datetime: formData.start_datetime || now.toISOString(),
      closed_datetime: formData.closed_datetime || new Date(now.getTime() + 60 * 60 * 1000).toISOString() // 1hr later
    };

    try {
      const res = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.detail || 'Failed to simulate event impact.');
      }
    } catch (err) {
      console.error('Simulation API error:', err);
      setError('Could not connect to FastAPI server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="main-header">
        <h1 className="header-title">
          <Cpu size={24} color="var(--accent-purple)" className="glow-text-purple" />
          <span>Incident Impact Simulator</span>
        </h1>
        <div className="header-meta">
          <div className="meta-badge">
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>CatBoost Model v2</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="panel-grid">
          {/* Form Panel */}
          <div className="glass-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <Compass size={20} color="var(--accent-purple)" />
                <span>Simulate Live Incident Parameters</span>
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="sim-form-grid">
                <div className="form-group">
                  <label className="form-label">Incident Junction</label>
                  <select 
                    name="junction" 
                    value={formData.junction} 
                    onChange={handleInputChange} 
                    className="form-select"
                  >
                    {Object.keys(BENGALURU_JUNCTIONS).map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                    <option value="Custom">Custom Junction</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Junction Name (Custom)</label>
                  <input 
                    type="text" 
                    name="junction"
                    disabled={formData.junction !== 'Custom'}
                    value={formData.junction === 'Custom' ? '' : formData.junction}
                    onChange={handleInputChange} 
                    className="form-input" 
                    placeholder="Enter custom location name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    name="latitude" 
                    value={formData.latitude} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    name="longitude" 
                    value={formData.longitude} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <select name="zone" value={formData.zone} onChange={handleInputChange} className="form-select">
                    <option value="Central Zone 1">Central Zone 1</option>
                    <option value="Central Zone 2">Central Zone 2</option>
                    <option value="North Zone 1">North Zone 1</option>
                    <option value="North Zone 2">North Zone 2</option>
                    <option value="South Zone 1">South Zone 1</option>
                    <option value="South Zone 2">South Zone 2</option>
                    <option value="West Zone 1">West Zone 1</option>
                    <option value="West Zone 2">West Zone 2</option>
                    <option value="East Zone 1">East Zone 1</option>
                    <option value="East Zone 2">East Zone 2</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Traffic Corridor</label>
                  <select name="corridor" value={formData.corridor} onChange={handleInputChange} className="form-select">
                    <option value="Tumkur Road">Tumkur Road</option>
                    <option value="ORR East 1">ORR East 1</option>
                    <option value="Non-corridor">Non-corridor</option>
                    <option value="CBD 2">CBD 2</option>
                    <option value="ORR East 2">ORR East 2</option>
                    <option value="ORR West 1">ORR West 1</option>
                    <option value="ORR North 1">ORR North 1</option>
                    <option value="Old Madras Road">Old Madras Road</option>
                    <option value="Bellary Road 1">Bellary Road 1</option>
                    <option value="Bellary Road 2">Bellary Road 2</option>
                    <option value="Hosur Road">Hosur Road</option>
                    <option value="Bannerghata Road">Bannerghata Road</option>
                    <option value="ORR North 2">ORR North 2</option>
                    <option value="Magadi Road">Magadi Road</option>
                    <option value="IRR(Thanisandra road)">IRR (Thanisandra Road)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select name="event_type" value={formData.event_type} onChange={handleInputChange} className="form-select">
                    <option value="unplanned">Unplanned Incident</option>
                    <option value="planned">Planned Event</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Type Involved</label>
                  <select name="veh_type" value={formData.veh_type} onChange={handleInputChange} className="form-select">
                    <option value="private_car">Private Car</option>
                    <option value="auto">Auto Rickshaw</option>
                    <option value="taxi">Cab/Taxi</option>
                    <option value="bmtc_bus">BMTC Bus</option>
                    <option value="ksrtc_bus">KSRTC Bus</option>
                    <option value="private_bus">Private Bus</option>
                    <option value="lcv">Light Commercial Vehicle (LCV)</option>
                    <option value="truck">Truck</option>
                    <option value="heavy_vehicle">Heavy Vehicle</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Incident Cause</label>
                  <select name="event_cause" value={formData.event_cause} onChange={handleInputChange} className="form-select">
                    <option value="vehicle_breakdown">Vehicle Breakdown</option>
                    <option value="accident">Accident / Collision</option>
                    <option value="tree_fall">Tree Fall</option>
                    <option value="water_logging">Water Logging / Flooding</option>
                    <option value="pot_holes">Pothole Congestion</option>
                    <option value="congestion">General Overcapacity</option>
                    <option value="construction">Metro/Road Construction</option>
                    <option value="road_conditions">Bad Road Conditions</option>
                    <option value="vip_movement">VIP Movement</option>
                    <option value="procession">Religious/Public Procession</option>
                    <option value="protest">Public Protest</option>
                    <option value="Debris">Debris on Road</option>
                    <option value="Fog / Low Visibility">Fog / Low Visibility</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Road Blockage</label>
                  <label className="form-checkbox-container">
                    <input 
                      type="checkbox" 
                      name="requires_road_closure" 
                      checked={formData.requires_road_closure} 
                      onChange={handleInputChange} 
                      className="form-checkbox"
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Requires Road Closure</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Start Time</label>
                  <input 
                    type="datetime-local" 
                    name="start_datetime" 
                    value={formData.start_datetime} 
                    onChange={handleInputChange} 
                    className="form-input" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Clearance Time</label>
                  <input 
                    type="datetime-local" 
                    name="closed_datetime" 
                    value={formData.closed_datetime} 
                    onChange={handleInputChange} 
                    className="form-input" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? (
                  <>
                    <div className="loader" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                    <span>CALCULATING INCIDENT IMPACT...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={18} />
                    <span>RUN PREDICTIVE SIMULATION</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Display Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header">
              <h3 className="panel-title">
                <Layers size={20} color="var(--accent-cyan)" />
                <span>Simulation Assessment Output</span>
              </h3>
            </div>

            {error && (
              <div style={{
                background: 'var(--high-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '16px 20px',
                borderRadius: '12px',
                color: 'var(--high)',
                fontSize: '0.9rem',
                margin: 'auto 0'
              }}>
                {error}
              </div>
            )}

            {result ? (
              <div className="simulator-results">
                {/* Severity Card */}
                <div className={`result-header-card level-${result.prediction.predicted_impact_level}`}>
                  <div>
                    <div className="form-label" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Predicted Severity Level
                    </div>
                    <div className={`result-level-text level-${result.prediction.predicted_impact_level}`}>
                      {result.prediction.predicted_impact_level}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="form-label" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Impact Index
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'monospace' }}>
                      {result.prediction.impact_score.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Probabilities */}
                <div>
                  <div className="form-label" style={{ marginBottom: '12px' }}>Model Confidence Matrix</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(result.prediction.probabilities).map(([level, prob]) => {
                      const percentage = (prob * 100).toFixed(1);
                      return (
                        <div key={level} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 500 }}>
                            <span>{level} Impact</span>
                            <span>{percentage}%</span>
                          </div>
                          <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${percentage}%`, 
                                backgroundColor: `var(--${level.toLowerCase()})`,
                                borderRadius: '3px',
                                boxShadow: `0 0 8px var(--${level.toLowerCase()})`
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resource Allocations */}
                <div>
                  <div className="form-label" style={{ marginBottom: '12px' }}>Remediation Action Plan</div>
                  <div className="resource-recommendations">
                    <div className="resource-item">
                      <UserCheck size={24} color="var(--low)" />
                      <span className="resource-val">{result.recommendation.police_required}</span>
                      <span className="form-label" style={{ fontSize: '0.7rem' }}>Police Officers</span>
                    </div>

                    <div className="resource-item">
                      <Shield size={24} color="var(--medium)" />
                      <span className="resource-val">{result.recommendation.barricades_required}</span>
                      <span className="form-label" style={{ fontSize: '0.7rem' }}>Barricades</span>
                    </div>

                    <div className="resource-item">
                      <Clock size={24} color="var(--accent-blue)" />
                      <span className="resource-val" style={{ fontSize: '1.2rem', padding: '6px 0' }}>
                        {result.recommendation.diversion_strategy}
                      </span>
                      <span className="form-label" style={{ fontSize: '0.7rem' }}>Road Diversion</span>
                    </div>
                  </div>
                </div>

                {result.database_records?.event_id && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <Info size={14} />
                    <span>Simulation record committed to DB: <code>{result.database_records.event_id.slice(0, 8)}</code></span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                gap: '12px'
              }}>
                <Cpu size={48} style={{ opacity: 0.3, strokeWidth: 1 }} />
                <span>Configure incident parameters and launch the simulation to compute traffic impact predictions and officer allocations.</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
