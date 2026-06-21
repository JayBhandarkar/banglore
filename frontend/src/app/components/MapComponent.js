'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issues
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  });
}

const getSeverityColor = (score) => {
  if (score < 0.3) return '#10b981'; // Low (Green)
  if (score < 0.65) return '#f59e0b'; // Medium (Yellow)
  if (score < 0.85) return '#ef4444'; // High (Red)
  return '#ec4899'; // Critical (Pink/Neon Magenta)
};

export default function MapComponent({ hotspots }) {
  // Center of Bengaluru
  const centerPosition = [12.9716, 77.5946];

  return (
    <MapContainer 
      center={centerPosition} 
      zoom={12} 
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', background: '#090e17' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {hotspots.map((spot, index) => {
        const lat = parseFloat(spot.latitude);
        const lon = parseFloat(spot.longitude);
        
        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(lon)) return null;

        const color = getSeverityColor(spot.score);
        const radius = Math.min(10 + (spot.event_count * 2), 24); // Scale size slightly with event count

        return (
          <CircleMarker
            key={spot.id || `spot-${index}`}
            center={[lat, lon]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              color: '#080c14',
              weight: 1.5,
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div style={{ color: 'var(--text-primary)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                  {spot.junction_name}
                </h4>
                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>
                    Congestion Index: <strong style={{ color: color, fontFamily: 'monospace' }}>{spot.score.toFixed(4)}</strong>
                  </span>
                  <span>
                    Total Events: <strong>{spot.event_count}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}
                  </span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
