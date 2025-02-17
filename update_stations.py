import os
import requests
from supabase import create_client
from datetime import datetime

# Supabase URL und Key aus den Umgebungsvariablen
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Tankerkönig API abrufen
API_URL = "https://creativecommons.tankerkoenig.de/json/list.php?lat=52.52&lng=13.405&rad=10&sort=dist&type=all&apikey=DEIN_API_KEY"
response = requests.get(API_URL)
data = response.json()

if "stations" in data:
    stations = [
        {
            "name": station["name"],
            "adresse": f"{station['street']} {station.get('houseNumber', '')}",
            "supere5": station.get("e5", None),
            "supere10": station.get("e10", None),
            "diesel": station.get("diesel", None),
            "lat": station["lat"],
            "lng": station["lng"],
            "datum_und_uhrzeit": datetime.now().isoformat(),
        }
        for station in data["stations"]
    ]

    # Daten in Supabase speichern
    supabase.table("stations").upsert(stations).execute()
    print("Daten aktualisiert")
else:
    print("Fehler: Keine Tankstellen-Daten gefunden.")
