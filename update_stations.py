import os
import requests
from datetime import datetime
from supabase import create_client

# Supabase Verbindung herstellen
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

API_KEY = "ccbe6d1e-e1a6-b779-8430-dcaa9cdb5436"  # Ersetze durch deinen echten Tankerkönig API-Key
API_URL = "https://api.tankerkoenig.de/json/prices.php"

# Alle gültigen Station-IDs aus der Datenbank abrufen
def get_valid_station_ids():
    response = supabase.table("stations").select("id").execute()
    if response.data:
        return [station["id"] for station in response.data]  # Liste der IDs
    return []

# Preisdaten abrufen
def fetch_prices(station_ids):
    if not station_ids:
        print("Keine Tankstellen-IDs gefunden.")
        return {}

    params = {
        "apikey": API_KEY,
        "ids": ",".join(station_ids)  # IDs in URL einfügen
    }
    
    try:
        response = requests.get(API_URL, params=params)
        response.raise_for_status()  # Fehlerhafte API-Anfragen abfangen
        return response.json().get("prices", {})
    except requests.exceptions.RequestException as e:
        print(f"Fehler bei der API-Anfrage: {e}")
        return {}

# Preisdaten in die Datenbank speichern
def save_prices(price_data, valid_station_ids):
    price_entries = []

    for station_id, prices in price_data.items():
        if station_id in valid_station_ids:
            price_entries.append({
                "station_id": station_id,
                "timestamp": datetime.utcnow().isoformat(),
                "diesel": prices.get("diesel"),
                "e5": prices.get("e5"),
                "e10": prices.get("e10"),
                "is_open": prices.get("isOpen", False),
            })

    if price_entries:
        supabase.table("price_history").insert(price_entries).execute()
        print(f"Eingefügte Einträge: {len(price_entries)}")
    else:
        print("Keine gültigen Preise zum Einfügen gefunden.")

if __name__ == "__main__":
    station_ids = get_valid_station_ids()
    price_data = fetch_prices(station_ids)
    save_prices(price_data, station_ids)
