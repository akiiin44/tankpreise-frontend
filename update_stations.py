import os
import requests
from supabase import create_client
from datetime import datetime

# Supabase-Verbindung herstellen
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Tankerkönig API abrufen (ersetze 'DEIN_API_KEY' mit deinem tatsächlichen API-Key)
API_URL = "https://creativecommons.tankerkoenig.de/json/list.php?lat=52.52&lng=13.405&rad=5&sort=dist&type=all&apikey=ccbe6d1e-e1a6-b779-8430-dcaa9cdb5436"
response = requests.get(API_URL)
data = response.json()

if "stations" in data:
    price_entries = []

    for station in data["stations"]:
        station_id = station["id"]  # ID der Tankstelle aus der API

        price_entries.append({
            "station_id": station_id,
            "timestamp": datetime.now().isoformat(),
            "diesel": station.get("diesel", None),
            "e5": station.get("e5", None),
            "e10": station.get("e10", None),
            "is_open": station.get("isOpen", None)
        })

    # Daten in Supabase speichern
    supabase.table("price_history").insert(price_entries).execute()
    print(f"{len(price_entries)} Preise aktualisiert.")
else:
    print("Fehler: Keine Tankstellen-Daten gefunden.")
