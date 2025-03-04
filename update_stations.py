from datetime import datetime
import pytz
from supabase import create_client, Client
import requests

# Deine Konfiguration
TANKERKOENIG_API_URL = "https://creativecommons.tankerkoenig.de/json/list.php"
TANKERKOENIG_API_KEY = "ccbe6d1e-e1a6-b779-8430-dcaa9cdb5436"

SUPABASE_URL = "https://wdeypjuqixmhtgyejlup.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZXlwanVxaXhtaHRneWVqbHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDU3NzEsImV4cCI6MjA1NTI4MTc3MX0.xjdte1Q0QVQ0A_csmm-MBu3o2LRiwdDW5ZrGUpIt8Og"  # Dein Key

LAT = 51.504333
LNG = 7.499020
RADIUS = 5

BERLIN_TZ = pytz.timezone("Europe/Berlin")


def fetch_stations_by_location(lat, lng, radius):
    params = {
        "apikey": TANKERKOENIG_API_KEY,
        "lat": lat,
        "lng": lng,
        "rad": radius,
        "type": "all",
        "sort": "dist",
    }
    print(f"🔍 Rufe Tankerkoenig-Daten ab: lat={lat}, lng={lng}, rad={radius}km")
    response = requests.get(TANKERKOENIG_API_URL, params=params)
    data = response.json()
    
    if not data.get("ok", False):
        raise Exception(f"Tankerkoenig error: {data}")
    
    stations = data.get("stations", [])
    print(f"🔍 Empfangen: {len(stations)} Tankstellen")
    return stations


def update_database(stations):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Runden auf XX:00 oder XX:30
    now = datetime.now(BERLIN_TZ)
    if now.minute < 30:
        now = now.replace(minute=0, second=0, microsecond=0)
    else:
        now = now.replace(minute=30, second=0, microsecond=0)
    
    timestamp = now.isoformat()
    print(f"🔍 Gerundeter Zeitstempel: {timestamp}")
    
    for station in stations:
        try:
            # Stammdaten
            station_upsert = supabase.table("stations").upsert({
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
            
            # Überprüfe das Ergebnis der Stations-Upsert
            if hasattr(station_upsert, 'data'):
                print(f"✅ Stations-Upsert für {station['name']}: Erfolgreich")
            else:
                print(f"❌ Stations-Upsert für {station['name']} fehlgeschlagen")
            
            # Preisdaten
            price_upsert = supabase.table("price_history").upsert({
                "station_id": station["id"],
                "timestamp": timestamp,
                "diesel": station.get("diesel"),
                "e5": station.get("e5"),
                "e10": station.get("e10"),
                "is_open": station.get("isOpen", False)
            }).execute()
            
            # Überprüfe das Ergebnis der Price History-Upsert
            if hasattr(price_upsert, 'data'):
                print(f"✅ PriceHistory-Upsert für {station['name']}: Erfolgreich")
            else:
                print(f"❌ PriceHistory-Upsert für {station['name']} fehlgeschlagen")
            
        except Exception as e:
            print(f"❌ Fehler bei {station.get('name','Unbekannt')} (ID: {station.get('id','???')}): {str(e)}")


def main():
    stations = fetch_stations_by_location(LAT, LNG, RADIUS)
    if stations:
        update_database(stations)
    else:
        print("⚠️ Keine Tankstellen empfangen.")


if __name__ == "__main__":
    main()
