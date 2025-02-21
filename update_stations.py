def update_database(stations):
    """Aktualisiere die Supabase Datenbank mit gerundeten Zeitstempeln"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Hole die aktuelle Zeit in Berlin und runde auf die nächste halbe Stunde
    now = datetime.now(BERLIN_TZ)
    minutes = now.minute
    rounded_minutes = 0 if minutes < 30 else 30
    rounded_hour = now.hour + (1 if minutes >= 30 else 0)
    if rounded_hour >= 24:
        rounded_hour = 0
        now = now.replace(day=now.day + 1, hour=0, minute=0, second=0, microsecond=0)
    timestamp = now.replace(hour=rounded_hour, minute=rounded_minutes, second=0, microsecond=0).isoformat()
    
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
            
            # Update Preis-Daten mit gerundetem Zeitstempel
            supabase.table("price_history").upsert({
                "station_id": station["id"],
                "timestamp": timestamp,  # Verwende den gerundeten Zeitstempel
                "diesel": station.get("diesel"),
                "e5": station.get("e5"),
                "e10": station.get("e10"),
                "is_open": station["isOpen"]
            }).execute()
            
            print(f"✅ Aktualisiert: {station['name']} um {timestamp}")
            
        except Exception as e:
            print(f"❌ Fehler bei {station['name']}: {str(e)}")
