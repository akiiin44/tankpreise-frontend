import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Lädt Umgebungsvariablen aus .env-Datei

// Supabase Konfiguration
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Tankerkönig API Konfiguration
const TANKER_API_KEY = process.env.TANKER_API_KEY;
const LAT = '51.504333';
const LNG = '7.499020';
const RADIUS = '5';

async function main() {
  try {
    console.log('📡 Starte API-Request...');
    const response = await fetch(
      `https://creativecommons.tankerkoenig.de/json/list.php?apikey=${TANKER_API_KEY}&lat=${LAT}&lng=${LNG}&type=all&rad=${RADIUS}`
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error('❌ API-Request fehlgeschlagen: ' + data.message);
    }

    const timestamp = new Date().toISOString(); // UTC-Format für Konsistenz

    for (const station of data.stations) {
      console.log(`🔄 Aktualisiere Tankstelle: ${station.name} (${station.id})`);

      // 1️⃣ Tankstellen-Daten upsert (einfügen/aktualisieren)
      const { error: stationError } = await supabase
        .from('stations')
        .upsert({
          id: station.id,
          name: station.name,
          brand: station.brand,
          street: station.street,
          house_number: station.houseNumber,
          post_code: station.postCode,
          place: station.place,
          lat: station.lat,
          lng: station.lng
        });

      if (stationError) {
        console.error(`❌ Fehler beim Updaten von ${station.id}:`, stationError);
        continue;
      }

      // 2️⃣ Preis-Daten upsert (wenn bereits vorhanden, kein erneutes Einfügen)
      const { error: priceError } = await supabase
        .from('price_history')
        .upsert({
          station_id: station.id,
          timestamp: timestamp,
          diesel: station.diesel ?? null,
          e5: station.e5 ?? null,
          e10: station.e10 ?? null,
          is_open: station.isOpen
        }, { onConflict: ['station_id', 'timestamp'] }); // Falls Datensatz existiert, aktualisieren

      if (priceError) {
        console.error(`❌ Fehler beim Einfügen von Preisen für ${station.id}:`, priceError);
      }
    }

    console.log(`✅ Erfolgreich ${data.stations.length} Tankstellen aktualisiert!`);

  } catch (error) {
    console.error('❌ Workflow fehlgeschlagen:', error);
    process.exit(1);
  }
}

// Skript ausführen
main();
