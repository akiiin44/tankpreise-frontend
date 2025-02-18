import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { createClient } from "@supabase/supabase-js";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix für Leaflet Marker-Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Supabase Client initialisieren
const supabase = createClient(
  "https://wdeypjuqixmhtgyejlup.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZXlwanVxaXhtaHRneWVqbHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDU3NzEsImV4cCI6MjA1NTI4MTc3MX0.xjdte1Q0QVQ0A_csmm-MBu3o2LRiwdDW5ZrGUpIt8Og"
);

function App() {
  const [stations, setStations] = useState([]);
  const [allPrices, setAllPrices] = useState([]);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    async function loadStations() {
      const { data, error } = await supabase.from("stations").select("*");
      if (error) {
        console.error("Fehler beim Laden der Stationen:", error);
        return;
      }
      setStations(data || []);
    }
    loadStations();
  }, []);

  useEffect(() => {
    async function loadAllPrices() {
      const { data, error } = await supabase.from("price_history").select("*");
      if (error) {
        console.error("Fehler beim Laden der Preise:", error);
        return;
      }
      setAllPrices(data || []);
    }
    loadAllPrices();
  }, []);

  const filteredPriceMap = {};
  allPrices.forEach((priceItem) => {
    const date = new Date(priceItem.timestamp).toISOString().split("T")[0];
    const hour = new Date(priceItem.timestamp).getHours();
    if (date === selectedDate && hour === selectedHour) {
      filteredPriceMap[priceItem.station_id] = priceItem;
    }
  });

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <MapContainer center={[51.504333, 7.49902]} zoom={13} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((station) => {
          const priceForStation = filteredPriceMap[station.id];
          return (
            <Marker key={station.id} position={[station.lat, station.lng]}>
              <Popup>
                <div>
                  <h4>{station.name}</h4>
                  <p>{station.street} {station.house_number}</p>
                  {priceForStation ? (
                    <div>
                      <p>Diesel: {priceForStation.diesel ?? "N/A"}</p>
                      <p>E5: {priceForStation.e5 ?? "N/A"}</p>
                      <p>E10: {priceForStation.e10 ?? "N/A"}</p>
                    </div>
                  ) : (
                    <p>Keine Preisdaten für {selectedHour}:00 Uhr</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
        width: "80%", maxWidth: 500, background: "rgba(255, 255, 255, 0.9)", padding: "15px", borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)", textAlign: "center"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "black" }}>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ flex: 1, textAlign: "center" }}>{i % 6 === 0 ? `${i}:00` : "|"}</span>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max="23"
          value={selectedHour}
          onChange={(e) => setSelectedHour(Number(e.target.value))}
          style={{ width: "100%", marginTop: "8px" }}
        />
        <div style={{ marginTop: "10px" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
