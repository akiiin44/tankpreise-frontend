from datetime import datetime
import pytz
from supabase import create_client, Client

# Deine Supabase-Zugangsdaten (ersetzen!)
SUPABASE_URL = "https://wdeypjuqixmhtgyejlup.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZXlwanVxaXhtaHRneWVqbHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDU3NzEsImV4cCI6MjA1NTI4MTc3MX0.xjdte1Q0QVQ0A_csmm-MBu3o2LRiwdDW5ZrGUpIt8Og"

BERLIN_TZ = pytz.timezone("Europe/Berlin")

def update_database(stations):
    """Aktualisiert die Supabase-Datenbank mit gerundeten Zeitstempeln"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Hole die aktuelle Zeit in Berlin und runde auf die nächste halbe Stunde
    now = datetime.now(BERLIN_TZ)
    if now.minute < 30:
        now = now.replace(minute=0, second=0, microsecond=0)
    else:
        now = now.replace(minute=30, second=0, microsecond=0)
    
    timestamp = now.isoformat()  # z.B. "2025-03-04T07:00:00+01:00"
    
    for station in stations:
        try:
            # Stammdaten der Tankstelle aktualisieren
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
            
            # Preis-Daten mit gerundetem Zeitstempel speichern
            supabase.table("price_history").upsert({
                "station_id": station["id"],
                "timestamp": timestamp,
                "diesel": station.get("diesel"),
                "e5": station.get("e5"),
                "e10": station.get("e10"),
                "is_open": station["isOpen"]
            }).execute()
            
            print(f"✅ Aktualisiert: {station['name']} um {timestamp}")
            
        except Exception as e:
            print(f"❌ Fehler bei {station['name']}: {str(e)}")
