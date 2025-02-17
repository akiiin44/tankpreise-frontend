import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Supabase Konfiguration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Tankerkönig API Konfiguration
const TANKER_API_KEY = 'ccbe6d1e-e1a6-b779-8430-dcaa9cdb5436'
const LAT = '51.504333'
const LNG = '7.499020'
const RADIUS = '5'

async function main() {
  try {
    // API Request
    const response = await fetch(
      `https://creativecommons.tankerkoenig.de/json/list.php?apikey=${TANKER_API_KEY}&lat=${LAT}&lng=${LNG}&type=all&rad=${RADIUS}`
    )
    
    const data = await response.json()
    
    if (!data.ok) {
      throw new Error('API request failed: ' + data.message)
    }
    
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
    
    // Daten in Supabase speichern
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
        })
      
      if (stationError) {
        console.error('Error updating station:', stationError)
        continue
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
        })
      
      if (priceError) {
        console.error('Error inserting price:', priceError)
      }
    }
    
    // Erfolg loggen
    console.log(`Successfully processed ${data.stations.length} stations`)
    
  } catch (error) {
    console.error('Workflow failed:', error)
    process.exit(1)
  }
}

// Skript ausführen
main()