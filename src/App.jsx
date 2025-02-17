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

// Supabase Client initialisieren (ersetze URL und KEY mit deinen Daten)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [stations, setStations] = useState([]);
  const [allPrices, setAllPrices] = useState([]); // Alle Price-History-Einträge
  const [selectedHour, setSelectedHour] = useState(12); // Standardstunde 12 Uhr

  // 1) Stationen laden
  useEffect(() => {
    async function loadStations() {
      const { data, error } = await supabase
        .from("stations")
        .select("*");
      if (error) {
        console.error("Fehler beim Laden der Stationen:", error);
        return;
      }
      setStations(data || []);
    }
    loadStations();
  }, []);

  // 2) Alle Preise laden (nur einmal)
  useEffect(() => {
    async function loadAllPrices() {
      const { data, error } = await supabase
        .from("price_history")
        .select("*");
      if (error) {
        console.error("Fehler beim Laden der Preise:", error);
        return;
      }
      setAllPrices(data || []);
    }
    loadAllPrices();
  }, []);

  // 3) Clientseitiger Filter: Nur die Preise für `selectedHour`
  //    -> Wir basteln uns eine Map "station_id -> Price-Objekt"
  const filteredPriceMap = {};
  allPrices.forEach((priceItem) => {
    const hour = new Date(priceItem.timestamp).getHours();
    if (hour === selectedHour) {
      filteredPriceMap[priceItem.station_id] = priceItem;
    }
  });

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* --- KARTE FÜLLT DEN HINTERGRUND --- */}
      <MapContainer
        center={[51.504333, 7.49902]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
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
                  <p>
                    {station.street} {station.house_number}
                  </p>
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

      {/* --- SLIDER schwebt unten über der Karte --- */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          width: "80%",
          maxWidth: 400,
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px 20px",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: "bold" }}>
          Gewählte Stunde: {selectedHour}:00
        </div>
        <input
          type="range"
          min="0"
          max="23"
          value={selectedHour}
          onChange={(e) => setSelectedHour(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export default App;
