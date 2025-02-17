import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import { Box, Typography, Card } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix für Leaflet Marker-Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Supabase Client initialisieren
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [stations, setStations] = useState([]);
  const [prices, setPrices] = useState({});

  // Lade Tankstellen beim Start
  useEffect(() => {
    async function loadStations() {
      const { data, error } = await supabase
        .from('stations')
        .select('*');
      
      if (error) {
        console.error('Error loading stations:', error);
        return;
      }
      
      setStations(data || []);
    }
    
    loadStations();
  }, []);

  return (
    <Box sx={{ height: '100vh', width: '100vw' }}>
      <MapContainer 
        center={[51.504333, 7.499020]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map(station => (
          <Marker 
            key={station.id} 
            position={[station.lat, station.lng]}
          >
            <Popup>
              <Card sx={{ p: 1, minWidth: 200 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {station.name}
                </Typography>
                <Typography variant="body2">
                  {station.street} {station.house_number}
                </Typography>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}

export default App;