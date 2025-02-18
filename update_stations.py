# update_stations.py
import requests
from supabase import create_client, Client
from datetime import datetime
import time

# Konfiguration direkt im Code
SUPABASE_URL = "https://wdeypjuqixmhtgyejlup.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZXlwanVxaXhtaHRneWVqbHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDU3NzEsImV4cCI6MjA1NTI4MTc3MX0.xjdte1Q0QVQ0A_csmm-MBu3o2LRiwdDW5ZrGUpIt8Og"
TANKER_API_KEY = "ccbe6d1e-e1a6-b779-8430-dcaa9cdb5436"  # Hier Ihren API-Key eintragen

# Tankerkönig API Parameter
LAT = "51.504333"
LNG = "7.499020"
RADIUS = "5"

def fetch_gas_stations():
    """Hole Tankstellen-Daten von der Tankerkönig API"""
    url = f"https://creativecommons.tankerkoenig.de/json/list.php"
    params = {
        "lat": LAT,
        "lng": LNG,
        "rad": RADIUS,
        "sort": "dist",
        "type": "all",
        "apikey": TANKER_API_KEY
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if not data.get("ok"):
        raise Exception(f"API-Fehler: {data.get('message')}")
        
    return data["stations"]

def update_database(stations):
    """Aktualisiere die Supabase Datenbank"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    timestamp = datetime.utcnow().isoformat()
    
    for station in stations:
        try:
            # Update Tankstellen-Daten
            supabase.table("stations").upsert({
                "id": station["id"],
                "name": station["name"],
                "brand": station["brand"],
                "street": station["street"],
                "house_number": station["houseNumber"],
                "post_code": station["postCode"],
                "place": station["place"],
                "lat": station["lat"],
                "lng": station["lng"]
            }).execute()
            
            # Update Preis-Daten
            supabase.table("price_history").upsert({
                "station_id": station["id"],
                "timestamp": timestamp,
                "diesel": station.get("diesel"),
                "e5": station.get("e5"),
                "e10": station.get("e10"),
                "is_open": station["isOpen"]
            }).execute()
            
            print(f"✅ Aktualisiert: {station['name']}")
            
        except Exception as e:
            print(f"❌ Fehler bei {station['name']}: {str(e)}")

def main():
    """Hauptfunktion"""
    print("🚀 Starte Update-Prozess...")
    
    try:
        stations = fetch_gas_stations()
        update_database(stations)
        print("✨ Update erfolgreich abgeschlossen!")
        
    except Exception as e:
        print(f"❌ Kritischer Fehler: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()