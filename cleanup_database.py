# cleanup_database.py
from supabase import create_client, Client
from datetime import datetime, timedelta

# Supabase Konfiguration
SUPABASE_URL = "https://wdeypjuqixmhtgyejlup.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZXlwanVxaXhtaHRneWVqbHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MDU3NzEsImV4cCI6MjA1NTI4MTc3MX0.xjdte1Q0QVQ0A_csmm-MBu3o2LRiwdDW5ZrGUpIt8Og"

# Datenbank-Management Konfiguration
STORAGE_THRESHOLD = 450  # Schwellenwert in MB (bei 500MB Gesamtspeicher)

def get_database_size(supabase: Client) -> float:
    """
    Ermittelt die aktuelle Größe der price_history Tabelle in MB
    """
    try:
        query = """
        SELECT pg_total_relation_size('price_history') / (1024 * 1024.0) as size_mb;
        """
        response = supabase.rpc('get_table_size').execute()
        return float(response.data[0]['size_mb'])
    except Exception as e:
        print(f"⚠️ Warnung: Konnte Datenbankgröße nicht ermitteln: {str(e)}")
        return 0

def cleanup_database():
    """
    Hauptfunktion zum Aufräumen der Datenbank
    """
    print("🔍 Starte Datenbank-Cleanup...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Aktuelle Datenbankgröße prüfen
        current_size = get_database_size(supabase)
        print(f"📊 Aktuelle Datenbankgröße: {current_size:.2f} MB")
        
        if current_size > STORAGE_THRESHOLD:
            print("⚠️ Speicherplatz wird knapp, lösche älteste Daten...")
            
            # Finde das älteste Datum in der Datenbank
            response = supabase.table('price_history') \
                             .select('timestamp') \
                             .order('timestamp', desc=False) \
                             .limit(1) \
                             .execute()
            
            if response.data:
                oldest_date = datetime.fromisoformat(response.data[0]['timestamp'].replace('Z', '+00:00'))
                oldest_date_end = oldest_date + timedelta(days=1)
                
                # Lösche alle Einträge des ältesten Tages
                supabase.table('price_history') \
                        .delete() \
                        .gte('timestamp', oldest_date.isoformat()) \
                        .lt('timestamp', oldest_date_end.isoformat()) \
                        .execute()
                
                print(f"🗑️ Daten vom {oldest_date.strftime('%Y-%m-%d')} wurden gelöscht")
                
                # Prüfe neue Größe
                new_size = get_database_size(supabase)
                print(f"📊 Neue Datenbankgröße: {new_size:.2f} MB")
                return True
        else:
            print("✅ Speicherplatz ist ausreichend, keine Aktion erforderlich")
            return False
            
    except Exception as e:
        print(f"❌ Fehler beim Aufräumen der Datenbank: {str(e)}")
        return False

if __name__ == "__main__":
    cleanup_database()