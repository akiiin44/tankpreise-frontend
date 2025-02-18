import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Supabase Konfiguration (direkt im Skript)
const SUPABASE_URL = "https://wdeypjuqixmhtgyejlup.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZXlwanVxaXhtaHRneWVqbHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDU3NzEsImV4cCI6MjA1NTI4MTc3MX0.xjdte1Q0QVQ0A_csmm-MBu3o2LRiwdDW5ZrGUpIt8Og";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tankerkönig API Konfiguration (direkt im Skript)
const TANKER_API_KEY = "ccbe6d1e-e1a6-b779-8430-dcaa9cdb5436";
const LAT = "51.504333";
const LNG = "7.499020";
const RADIUS = "5";

async function main() {
  try {
    console.log('🔄 Lade Daten von der Tankerkönig API...');

    // API Request
    const response = await fetch(
      `https://creativecommons.tankerkoenig.de/json/list.php?apikey=${TANKER_API_KEY}&lat=${LAT}&lng=${LNG}&type=all&rad=${RADIUS}`
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error('API request failed: ' + data.message);
    }

    const timestamp = new Date().toISOString();

    for (const station of data.stations) {
      // 1. Tankstellen-Daten aktualisieren/erstellen
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
        console.error('⚠️ Fehler beim Aktualisieren der Tankstelle:', stationError);
        continue;
      }

      // 2. Preise speichern
      const { error: priceError } = await supabase
        .from('price_history')
        .insert({
          station_id: station.id,
          timestamp: timestamp,
          diesel: station.diesel,
          e5: station.e5,
          e10: station.e10,
          is_open: station.isOpen
        });

      if (priceError) {
        console.error('⚠️ Fehler beim Speichern des Preises:', priceError);
      }
    }

    console.log(`✅ Erfolgreich ${data.stations.length} Tankstellen-Daten gespeichert.`);
  } catch (error) {
    console.error('❌ Fehler beim Workflow:', error);
    process.exit(1);
  }
}

// Skript ausführen
main();
