import os
import sqlite3
import uuid
import math
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuration
USE_LOCAL_DB = os.getenv("USE_LOCAL_DB", "true").lower() == "true"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Auto-fallback to local DB if credentials are not configured
if not SUPABASE_URL or not SUPABASE_KEY:
    USE_LOCAL_DB = True

# Initialize Supabase client
supabase_client = None
if not USE_LOCAL_DB or True:  # Initialize it anyway so we can sync in the background
    try:
        from supabase import create_client
        if SUPABASE_URL and SUPABASE_KEY:
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("[DB] Connected to Supabase successfully.")
    except Exception as e:
        print(f"[DB] Error connecting to Supabase: {e}.")

DB_FILE = "gridlock_local.db"

SEED_OFFICERS = [
    {"name": "Officer Ramesh Gowda", "latitude": 12.9176, "longitude": 77.6244}, # Silk Board
    {"name": "Officer Suresh Kumar", "latitude": 12.9190, "longitude": 77.6220}, # Silk Board
    {"name": "Officer Ananya Hegde", "latitude": 13.0358, "longitude": 77.5970}, # Hebbal
    {"name": "Officer Deepa Rao", "latitude": 13.0370, "longitude": 77.5990},    # Hebbal
    {"name": "Officer Vijay M.", "latitude": 12.9779, "longitude": 77.5724},     # Majestic
    {"name": "Officer Karthik N.", "latitude": 12.9790, "longitude": 77.5710},   # Majestic
    {"name": "Officer Priya Sharma", "latitude": 12.9719, "longitude": 77.6412},  # Indiranagar
    {"name": "Officer Vinay Reddy", "latitude": 12.9730, "longitude": 77.6400},   # Indiranagar
    {"name": "Officer Sandeep Patil", "latitude": 12.9732, "longitude": 77.6170}, # Trinity
    {"name": "Officer Rupa Devi", "latitude": 12.9740, "longitude": 77.6190},     # Trinity
    {"name": "Officer Lingaraju K.", "latitude": 13.0040, "longitude": 77.6780},  # KR Puram
    {"name": "Officer Swetha P.", "latitude": 13.0060, "longitude": 77.6790},     # KR Puram
    {"name": "Officer Harish Raj", "latitude": 12.9250, "longitude": 77.5938},    # Jayanagar
    {"name": "Officer Nandini S.", "latitude": 12.9260, "longitude": 77.5950},   # Jayanagar
    {"name": "Officer Manoj Kumar", "latitude": 12.982847, "longitude": 77.589460}, # CBD
    {"name": "Officer Divya K.", "latitude": 12.9850, "longitude": 77.5910},      # CBD
]

SEED_DEPOTS = [
    {"depot_name": "Silk Board Traffic Depot", "latitude": 12.9176, "longitude": 77.6244, "total_quantity": 100},
    {"depot_name": "Hebbal Traffic Depot", "latitude": 13.0358, "longitude": 77.5970, "total_quantity": 100},
    {"depot_name": "Majestic Central Depot", "latitude": 12.9779, "longitude": 77.5724, "total_quantity": 150},
    {"depot_name": "KR Puram Traffic Depot", "latitude": 13.0040, "longitude": 77.6780, "total_quantity": 100},
]

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates geodetic distance in kilometers between two coordinates."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def init_db():
    """Initializes local SQLite database tables and seeds mock resources if needed."""
    # Always initialize local SQLite database to enable local fallback & background sync
    print(f"[DB] Initializing local SQLite database: {DB_FILE}")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        event_type TEXT,
        event_cause TEXT,
        requires_road_closure INTEGER,
        veh_type TEXT,
        corridor TEXT,
        zone TEXT,
        junction TEXT,
        latitude REAL,
        longitude REAL,
        start_datetime TEXT,
        closed_datetime TEXT,
        duration_minutes REAL,
        synced INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)
    
    # 2. Predictions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        predicted_impact_level TEXT,
        impact_score REAL,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events (id)
    )
    """)
    
    # 3. Resource Plans Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resource_plans (
        id TEXT PRIMARY KEY,
        prediction_id TEXT,
        police_required INTEGER,
        barricades_required INTEGER,
        diversion_strategy TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (prediction_id) REFERENCES predictions (id)
    )
    """)
    
    # 4. Hotspot Scores Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hotspot_scores (
        id TEXT PRIMARY KEY,
        junction_name TEXT UNIQUE,
        score REAL,
        event_count INTEGER,
        latitude REAL,
        longitude REAL,
        synced INTEGER DEFAULT 0,
        last_updated TEXT
    )
    """)
    
    # 5. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT,
        details TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT
    )
    """)

    # 6. Officers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS officers (
        id TEXT PRIMARY KEY,
        name TEXT,
        latitude REAL,
        longitude REAL,
        status TEXT,
        synced INTEGER DEFAULT 0,
        last_updated TEXT
    )
    """)

    # 7. Barricades Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS barricades (
        id TEXT PRIMARY KEY,
        depot_name TEXT,
        latitude REAL,
        longitude REAL,
        total_quantity INTEGER,
        available_quantity INTEGER,
        synced INTEGER DEFAULT 0,
        last_updated TEXT
    )
    """)

    # 8. Event Officers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_officers (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        officer_id TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (officer_id) REFERENCES officers (id)
    )
    """)

    # 9. Event Barricades Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_barricades (
        id TEXT PRIMARY KEY,
        event_id TEXT,
        barricade_id TEXT,
        quantity_dispatched INTEGER,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (barricade_id) REFERENCES barricades (id)
    )
    """)
    
    conn.commit()

    # Seed local database resources if empty
    cursor.execute("SELECT COUNT(*) FROM officers")
    if cursor.fetchone()[0] == 0:
        print("[DB] Seeding SQLite officers list...")
        now_str = datetime.utcnow().isoformat()
        for officer in SEED_OFFICERS:
            cursor.execute(
                "INSERT INTO officers (id, name, latitude, longitude, status, last_updated) VALUES (?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), officer["name"], officer["latitude"], officer["longitude"], "available", now_str)
            )
        conn.commit()

    cursor.execute("SELECT COUNT(*) FROM barricades")
    if cursor.fetchone()[0] == 0:
        print("[DB] Seeding SQLite barricade depots...")
        now_str = datetime.utcnow().isoformat()
        for depot in SEED_DEPOTS:
            cursor.execute(
                "INSERT INTO barricades (id, depot_name, latitude, longitude, total_quantity, available_quantity, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), depot["depot_name"], depot["latitude"], depot["longitude"], depot["total_quantity"], depot["total_quantity"], now_str)
            )
        conn.commit()

    conn.close()
    print("[DB] Local SQLite tables initialized successfully.")

    # Seed remote Supabase DB if client is active and tables are empty
    if supabase_client is not None:
        try:
            # Check if officers table is seeded in Supabase
            off_res = supabase_client.table("officers").select("id", count="exact").limit(1).execute()
            if off_res.count == 0:
                print("[DB] Seeding Supabase officers list...")
                sb_officers = [
                    {
                        "name": o["name"],
                        "latitude": o["latitude"],
                        "longitude": o["longitude"],
                        "status": "available",
                    }
                    for o in SEED_OFFICERS
                ]
                supabase_client.table("officers").insert(sb_officers).execute()

            # Check if barricades table is seeded in Supabase
            bar_res = supabase_client.table("barricades").select("id", count="exact").limit(1).execute()
            if bar_res.count == 0:
                print("[DB] Seeding Supabase barricade depots...")
                sb_depots = [
                    {
                        "depot_name": d["depot_name"],
                        "latitude": d["latitude"],
                        "longitude": d["longitude"],
                        "total_quantity": d["total_quantity"],
                        "available_quantity": d["total_quantity"],
                    }
                    for d in SEED_DEPOTS
                ]
                supabase_client.table("barricades").insert(sb_depots).execute()
            print("[DB] Remote database seeded successfully.")
        except Exception as e:
            print(f"[DB WARN] Failed seeding Supabase (might be schema is not created yet): {e}")

def save_simulation(event_data, prediction_data, resource_plan_data):
    """
    Saves a simulation transaction: event, prediction, resource plan, 
    allocates nearby resources using Haversine distance, updates hotspot scores.
    Falls back to SQLite if Supabase connection or queries fail.
    """
    event_id = str(uuid.uuid4())
    pred_id = str(uuid.uuid4())
    plan_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()

    impact_score = float(prediction_data.get("impact_score", 0.0))
    junction = event_data.get("junction", "Unknown")
    lat = float(event_data.get("latitude", 12.97))
    lon = float(event_data.get("longitude", 77.59))

    police_required = int(resource_plan_data.get("police_required", 0))
    barricades_required = int(resource_plan_data.get("barricades_required", 0))

    dispatched_officers = []
    dispatched_barricades = []

    use_sqlite = USE_LOCAL_DB

    # Supabase Proximity Allocation & Insertion
    if not use_sqlite:
        try:
            # 1. Fetch available officers from Supabase
            off_res = supabase_client.table("officers").select("*").eq("status", "available").execute()
            available_officers = off_res.data or []

            # Reset logic for remote officers
            if len(available_officers) < max(police_required, 2):
                supabase_client.table("officers").update({"status": "available"}).neq("status", "available").execute()
                off_res = supabase_client.table("officers").select("*").eq("status", "available").execute()
                available_officers = off_res.data or []

            for off in available_officers:
                off["distance"] = haversine_distance(lat, lon, float(off["latitude"]), float(off["longitude"]))
            available_officers.sort(key=lambda x: x["distance"])

            to_dispatch_officers = available_officers[:police_required]
            for off in to_dispatch_officers:
                dispatched_officers.append({
                    "id": off["id"],
                    "name": off["name"],
                    "latitude": float(off["latitude"]),
                    "longitude": float(off["longitude"])
                })
                supabase_client.table("officers").update({"status": "dispatched", "last_updated": now_str}).eq("id", off["id"]).execute()
                supabase_client.table("event_officers").insert({
                    "event_id": event_id,
                    "officer_id": off["id"]
                }).execute()

            # 2. Fetch depots from Supabase
            depot_res = supabase_client.table("barricades").select("*").gt("available_quantity", 0).execute()
            depots = depot_res.data or []

            total_avail = sum(int(d["available_quantity"]) for d in depots)
            if total_avail < barricades_required:
                # Reset quantities
                depot_all = supabase_client.table("barricades").select("*").execute()
                for d in (depot_all.data or []):
                    supabase_client.table("barricades").update({"available_quantity": d["total_quantity"]}).eq("id", d["id"]).execute()
                depot_res = supabase_client.table("barricades").select("*").gt("available_quantity", 0).execute()
                depots = depot_res.data or []

            for d in depots:
                d["distance"] = haversine_distance(lat, lon, float(d["latitude"]), float(d["longitude"]))
            depots.sort(key=lambda x: x["distance"])

            needed_barricades = barricades_required
            for d in depots:
                if needed_barricades <= 0:
                    break
                avail = int(d["available_quantity"])
                take = min(avail, needed_barricades)
                dispatched_barricades.append({
                    "id": d["id"],
                    "depot_name": d["depot_name"],
                    "latitude": float(d["latitude"]),
                    "longitude": float(d["longitude"]),
                    "quantity": take
                })
                supabase_client.table("barricades").update({
                    "available_quantity": avail - take,
                    "last_updated": now_str
                }).eq("id", d["id"]).execute()
                supabase_client.table("event_barricades").insert({
                    "event_id": event_id,
                    "barricade_id": d["id"],
                    "quantity_dispatched": take
                }).execute()
                needed_barricades -= take

            # Insert Event, Prediction, Resource Plan to Supabase
            supabase_client.table("events").insert({
                "id": event_id,
                "event_type": event_data.get("event_type", "unplanned"),
                "event_cause": event_data.get("event_cause", "others"),
                "requires_road_closure": bool(event_data.get("requires_road_closure")),
                "veh_type": event_data.get("veh_type", "others"),
                "corridor": event_data.get("corridor", "Non-corridor"),
                "zone": event_data.get("zone", "Unknown"),
                "junction": junction,
                "latitude": lat,
                "longitude": lon,
                "start_datetime": event_data.get("start_datetime", now_str),
                "closed_datetime": event_data.get("closed_datetime"),
                "duration_minutes": event_data.get("duration_minutes")
            }).execute()
            
            supabase_client.table("predictions").insert({
                "id": pred_id,
                "event_id": event_id,
                "predicted_impact_level": prediction_data.get("predicted_impact_level", "Medium"),
                "impact_score": impact_score
            }).execute()
            
            supabase_client.table("resource_plans").insert({
                "id": plan_id,
                "prediction_id": pred_id,
                "police_required": police_required,
                "barricades_required": barricades_required,
                "diversion_strategy": resource_plan_data.get("diversion_strategy", "No")
            }).execute()
            print("[DB] Simulation saved to Supabase remote DB.")
        except Exception as e:
            print(f"[DB WARN] Supabase transaction failed ({e}). Falling back to local SQLite.")
            use_sqlite = True

    # SQLite Proximity Allocation
    if use_sqlite:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        try:
            # 1. Fetch available officers
            cursor.execute("SELECT id, name, latitude, longitude FROM officers WHERE status = 'available'")
            available_officers = [dict(r) for r in cursor.fetchall()]

            # Reset logic: If officers run low, release all back to 'available' to maintain operations
            if len(available_officers) < max(police_required, 2):
                cursor.execute("UPDATE officers SET status = 'available'")
                cursor.execute("SELECT id, name, latitude, longitude FROM officers WHERE status = 'available'")
                available_officers = [dict(r) for r in cursor.fetchall()]
                print("[DB] Resetting officer availability statuses.")

            # Calculate distances and sort
            for off in available_officers:
                off["distance"] = haversine_distance(lat, lon, off["latitude"], off["longitude"])
            available_officers.sort(key=lambda x: x["distance"])

            # Select and dispatch closest
            to_dispatch_officers = available_officers[:police_required]
            dispatched_officers = []
            for off in to_dispatch_officers:
                dispatched_officers.append({
                    "id": off["id"],
                    "name": off["name"],
                    "latitude": off["latitude"],
                    "longitude": off["longitude"]
                })
                cursor.execute(
                    "UPDATE officers SET status = 'dispatched', last_updated = ? WHERE id = ?",
                    (now_str, off["id"])
                )
                cursor.execute(
                    "INSERT INTO event_officers (id, event_id, officer_id, created_at) VALUES (?, ?, ?, ?)",
                    (str(uuid.uuid4()), event_id, off["id"], now_str)
                )

            # 2. Fetch barricades depots
            cursor.execute("SELECT id, depot_name, latitude, longitude, available_quantity FROM barricades WHERE available_quantity > 0")
            depots = [dict(r) for r in cursor.fetchall()]

            # Reset logic for barricades if quantities run low
            total_avail = sum(d["available_quantity"] for d in depots)
            if total_avail < barricades_required:
                cursor.execute("UPDATE barricades SET available_quantity = total_quantity")
                cursor.execute("SELECT id, depot_name, latitude, longitude, available_quantity FROM barricades WHERE available_quantity > 0")
                depots = [dict(r) for r in cursor.fetchall()]
                print("[DB] Resetting barricade depot available quantities.")

            for d in depots:
                d["distance"] = haversine_distance(lat, lon, d["latitude"], d["longitude"])
            depots.sort(key=lambda x: x["distance"])

            needed_barricades = barricades_required
            dispatched_barricades = []
            for d in depots:
                if needed_barricades <= 0:
                    break
                take = min(d["available_quantity"], needed_barricades)
                dispatched_barricades.append({
                    "id": d["id"],
                    "depot_name": d["depot_name"],
                    "latitude": d["latitude"],
                    "longitude": d["longitude"],
                    "quantity": take
                })
                cursor.execute(
                    "UPDATE barricades SET available_quantity = available_quantity - ?, last_updated = ? WHERE id = ?",
                    (take, now_str, d["id"])
                )
                cursor.execute(
                    "INSERT INTO event_barricades (id, event_id, barricade_id, quantity_dispatched, created_at) VALUES (?, ?, ?, ?, ?)",
                    (str(uuid.uuid4()), event_id, d["id"], take, now_str)
                )
                needed_barricades -= take

            # Save Event, Prediction, Resource Plan to local SQLite
            cursor.execute("""
                INSERT INTO events (id, event_type, event_cause, requires_road_closure, veh_type, corridor, zone, junction, latitude, longitude, start_datetime, closed_datetime, duration_minutes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                event_data.get("event_type", "unplanned"),
                event_data.get("event_cause", "others"),
                1 if event_data.get("requires_road_closure") else 0,
                event_data.get("veh_type", "others"),
                event_data.get("corridor", "Non-corridor"),
                event_data.get("zone", "Unknown"),
                junction,
                lat,
                lon,
                event_data.get("start_datetime", now_str),
                event_data.get("closed_datetime"),
                event_data.get("duration_minutes"),
                now_str
            ))
            
            cursor.execute("""
                INSERT INTO predictions (id, event_id, predicted_impact_level, impact_score, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                pred_id,
                event_id,
                prediction_data.get("predicted_impact_level", "Medium"),
                impact_score,
                now_str
            ))
            
            cursor.execute("""
                INSERT INTO resource_plans (id, prediction_id, police_required, barricades_required, diversion_strategy, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                plan_id,
                pred_id,
                police_required,
                barricades_required,
                resource_plan_data.get("diversion_strategy", "No"),
                now_str
            ))
            
            conn.commit()
            print("[DB] Simulation saved to SQLite local fallback DB.")
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    # Update dynamic hotspot score
    update_hotspot_score(junction, impact_score, lat, lon)
    
    # Audit log
    log_audit("SIMULATION_RUN", f"Simulated event at {junction}. Predicted Level: {prediction_data.get('predicted_impact_level')}")

    return {
        "event_id": event_id,
        "prediction_id": pred_id,
        "resource_plan_id": plan_id,
        "dispatched_resources": {
            "officers": dispatched_officers,
            "barricades": dispatched_barricades
        }
    }

def update_hotspot_score(junction_name, score, latitude, longitude):
    """Dynamic computation of traffic hotspots based on incident severity."""
    now_str = datetime.utcnow().isoformat()
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT score, event_count FROM hotspot_scores WHERE junction_name = ?", (junction_name,))
        row = cursor.fetchone()
        if row:
            curr_score, count = row
            new_count = count + 1
            new_score = (curr_score * count + score) / new_count
            cursor.execute("""
                UPDATE hotspot_scores 
                SET score = ?, event_count = ?, last_updated = ?, latitude = ?, longitude = ?, synced = 0
                WHERE junction_name = ?
            """, (new_score, new_count, now_str, latitude, longitude, junction_name))
        else:
            cursor.execute("""
                INSERT INTO hotspot_scores (id, junction_name, score, event_count, latitude, longitude, last_updated, synced)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """, (str(uuid.uuid4()), junction_name, score, 1, latitude, longitude, now_str))
        conn.commit()
        conn.close()
    else:
        try:
            res = supabase_client.table("hotspot_scores").select("score", "event_count").eq("junction_name", junction_name).execute()
            if res.data and len(res.data) > 0:
                curr_score = float(res.data[0]["score"])
                count = int(res.data[0]["event_count"])
                new_count = count + 1
                new_score = (curr_score * count + score) / new_count
                supabase_client.table("hotspot_scores").update({
                    "score": new_score,
                    "event_count": new_count,
                    "latitude": latitude,
                    "longitude": longitude,
                    "last_updated": now_str
                }).eq("junction_name", junction_name).execute()
            else:
                supabase_client.table("hotspot_scores").insert({
                    "junction_name": junction_name,
                    "score": score,
                    "event_count": 1,
                    "latitude": latitude,
                    "longitude": longitude,
                    "last_updated": now_str
                }).execute()
        except Exception as e:
            print(f"[DB ERROR] Update hotspot failed: {e}")

def log_audit(action, details=None):
    """Saves action log details for administrator review."""
    log_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (id, action, details, created_at, synced)
            VALUES (?, ?, ?, ?, 0)
        """, (log_id, action, details, now_str))
        conn.commit()
        conn.close()
    else:
        try:
            supabase_client.table("audit_logs").insert({
                "id": log_id,
                "action": action,
                "details": details,
                "created_at": now_str
            }).execute()
        except Exception as e:
            print(f"[DB ERROR] Audit logging failed: {e}")

def get_history(limit=50):
    """Fetches combined list of past events and prediction outcomes."""
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.*, p.predicted_impact_level, p.impact_score, r.police_required, r.barricades_required, r.diversion_strategy
            FROM events e
            JOIN predictions p ON e.id = p.event_id
            JOIN resource_plans r ON p.id = r.prediction_id
            ORDER BY e.created_at DESC
            LIMIT ?
        """, (limit,))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows
    else:
        try:
            # Using Supabase relation query
            res = supabase_client.table("events").select(
                "*, predictions(*, resource_plans(*))"
            ).order("created_at", desc=True).limit(limit).execute()
            
            # Flatten to match SQLite output format
            flattened = []
            for item in res.data:
                pred = item.get("predictions", [{}])
                if isinstance(pred, list) and len(pred) > 0:
                    pred = pred[0]
                elif not isinstance(pred, dict):
                    pred = {}
                
                plan = pred.get("resource_plans", [{}])
                if isinstance(plan, list) and len(plan) > 0:
                    plan = plan[0]
                elif not isinstance(plan, dict):
                    plan = {}
                
                flattened.append({
                    "id": item.get("id"),
                    "event_type": item.get("event_type"),
                    "event_cause": item.get("event_cause"),
                    "requires_road_closure": item.get("requires_road_closure"),
                    "veh_type": item.get("veh_type"),
                    "corridor": item.get("corridor"),
                    "zone": item.get("zone"),
                    "junction": item.get("junction"),
                    "latitude": float(item.get("latitude")),
                    "longitude": float(item.get("longitude")),
                    "start_datetime": item.get("start_datetime"),
                    "closed_datetime": item.get("closed_datetime"),
                    "duration_minutes": float(item.get("duration_minutes")) if item.get("duration_minutes") else None,
                    "created_at": item.get("created_at"),
                    "predicted_impact_level": pred.get("predicted_impact_level", "Unknown"),
                    "impact_score": float(pred.get("impact_score", 0.0)) if pred.get("impact_score") else 0.0,
                    "police_required": plan.get("police_required", 0),
                    "barricades_required": plan.get("barricades_required", 0),
                    "diversion_strategy": plan.get("diversion_strategy", "No")
                })
            return flattened
        except Exception as e:
            print(f"[DB ERROR] History fetch failed: {e}")
            return []

def get_hotspots(limit=100):
    """Fetches list of hotspot locations with computed severity indices."""
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM hotspot_scores ORDER BY score DESC LIMIT ?", (limit,))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows
    else:
        try:
            res = supabase_client.table("hotspot_scores").select("*").order("score", desc=True).limit(limit).execute()
            return res.data
        except Exception as e:
            print(f"[DB ERROR] Hotspots fetch failed: {e}")
            return []

def get_audit_logs(limit=100):
    """Fetches action history log entries."""
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows
    else:
        try:
            res = supabase_client.table("audit_logs").select("*").order("created_at", desc=True).limit(limit).execute()
            return res.data
        except Exception as e:
            print(f"[DB ERROR] Audit fetch failed: {e}")
            return []

def get_analytics():
    """Computes aggregated dashboard stats: total events, category distributions, average scores."""
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Total counts
        cursor.execute("SELECT COUNT(*) FROM events")
        total_events = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*), SUM(police_required), SUM(barricades_required) FROM resource_plans")
        res_stats = cursor.fetchone()
        allocated_police = res_stats[1] or 0
        allocated_barricades = res_stats[2] or 0
        
        # Severity Level counts
        cursor.execute("SELECT predicted_impact_level, COUNT(*) FROM predictions GROUP BY predicted_impact_level")
        severity_dist = dict(cursor.fetchall())
        
        # Hourly Distribution
        cursor.execute("SELECT CAST(strftime('%H', created_at) AS INTEGER) as hr, COUNT(*) FROM events GROUP BY hr ORDER BY hr")
        hourly_dist = dict(cursor.fetchall())
        
        # Cause Distribution
        cursor.execute("SELECT event_cause, COUNT(*) FROM events GROUP BY event_cause ORDER BY COUNT(*) DESC LIMIT 8")
        cause_dist = dict(cursor.fetchall())
        
        # Average duration
        cursor.execute("SELECT AVG(duration_minutes) FROM events WHERE duration_minutes > 0")
        avg_duration = cursor.fetchone()[0] or 0.0
        
        conn.close()
        
        return {
            "total_events": total_events,
            "allocated_police": allocated_police,
            "allocated_barricades": allocated_barricades,
            "avg_duration": round(avg_duration, 2),
            "severity_distribution": severity_dist,
            "hourly_distribution": hourly_dist,
            "cause_distribution": cause_dist
        }
    else:
        try:
            # Supabase analytics
            total_res = supabase_client.table("events").select("id", count="exact").execute()
            total_events = total_res.count or 0
            
            plans_res = supabase_client.table("resource_plans").select("police_required", "barricades_required").execute()
            allocated_police = sum(int(x["police_required"]) for x in plans_res.data) if plans_res.data else 0
            allocated_barricades = sum(int(x["barricades_required"]) for x in plans_res.data) if plans_res.data else 0
            
            pred_res = supabase_client.table("predictions").select("predicted_impact_level").execute()
            severity_dist = {}
            for row in pred_res.data:
                level = row["predicted_impact_level"]
                severity_dist[level] = severity_dist.get(level, 0) + 1
            
            evt_details = supabase_client.table("events").select("event_cause", "duration_minutes", "created_at").execute()
            cause_dist = {}
            durations = []
            hourly_dist = {}
            
            for row in evt_details.data:
                cause = row["event_cause"]
                cause_dist[cause] = cause_dist.get(cause, 0) + 1
                
                dur = row.get("duration_minutes")
                if dur:
                    durations.append(float(dur))
                
                created_str = row.get("created_at")
                if created_str:
                    try:
                        # Standard ISO parsing
                        dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                        hr = dt.hour
                        hourly_dist[hr] = hourly_dist.get(hr, 0) + 1
                    except Exception:
                        pass
            
            avg_duration = sum(durations) / len(durations) if durations else 0.0
            
            # Sort cause distribution
            sorted_causes = dict(sorted(cause_dist.items(), key=lambda item: item[1], reverse=True)[:8])
            
            return {
                "total_events": total_events,
                "allocated_police": allocated_police,
                "allocated_barricades": allocated_barricades,
                "avg_duration": round(avg_duration, 2),
                "severity_distribution": severity_dist,
                "hourly_distribution": hourly_dist,
                "cause_distribution": sorted_causes
            }
        except Exception as e:
            print(f"[DB ERROR] Analytics compilation failed: {e}")
            return {
                "total_events": 0,
                "allocated_police": 0,
                "allocated_barricades": 0,
                "avg_duration": 0.0,
                "severity_distribution": {},
                "hourly_distribution": {},
                "cause_distribution": {}
            }

def get_resources():
    """Fetches all officer and barricade statuses and coordinates from active database."""
    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, latitude, longitude, status, last_updated FROM officers")
        officers = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT id, depot_name, latitude, longitude, total_quantity, available_quantity, last_updated FROM barricades")
        barricades = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"officers": officers, "barricades": barricades}
    else:
        try:
            off_res = supabase_client.table("officers").select("*").execute()
            bar_res = supabase_client.table("barricades").select("*").execute()
            return {"officers": off_res.data or [], "barricades": bar_res.data or []}
        except Exception as e:
            print(f"[DB ERROR] Resources fetch failed: {e}")
            return {"officers": [], "barricades": []}

def sync_local_db_to_supabase():
    """Syncs unsynced local SQLite records to remote Supabase instance when connection is available."""
    global supabase_client
    if supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            return False
        try:
            from supabase import create_client
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("[SYNC WORKER] Connected to Supabase client.")
        except Exception as e:
            print(f"[SYNC WORKER] Connection failed: {e}")
            return False

    if not os.path.exists(DB_FILE):
        return True

    print("[SYNC WORKER] Starting background synchronization checks...")
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # We will sync table-by-table inside separate try-except blocks to ensure maximum resilience.
    sync_errors = []

    # 1. Sync Events, Predictions, Resource Plans
    try:
        cursor.execute("SELECT * FROM events WHERE synced = 0")
        unsynced_events = [dict(row) for row in cursor.fetchall()]

        if unsynced_events:
            print(f"[SYNC WORKER] Syncing {len(unsynced_events)} events to Supabase...")
            for event in unsynced_events:
                event_id = event["id"]
                sb_event = {k: v for k, v in event.items() if k != "synced"}
                sb_event["requires_road_closure"] = bool(sb_event["requires_road_closure"])
                
                # Upload event
                supabase_client.table("events").upsert(sb_event).execute()
                
                # Upload corresponding predictions
                cursor.execute("SELECT * FROM predictions WHERE event_id = ?", (event_id,))
                predictions = [dict(r) for r in cursor.fetchall()]
                for pred in predictions:
                    sb_pred = {k: v for k, v in pred.items() if k != "synced"}
                    supabase_client.table("predictions").upsert(sb_pred).execute()
                    
                # Upload corresponding resource plans
                for pred in predictions:
                    cursor.execute("SELECT * FROM resource_plans WHERE prediction_id = ?", (pred["id"],))
                    plans = [dict(r) for r in cursor.fetchall()]
                    for plan in plans:
                        sb_plan = {k: v for k, v in plan.items() if k != "synced"}
                        supabase_client.table("resource_plans").upsert(sb_plan).execute()

                # Update sync states in SQLite
                cursor.execute("UPDATE events SET synced = 1 WHERE id = ?", (event_id,))
                cursor.execute("UPDATE predictions SET synced = 1 WHERE event_id = ?", (event_id,))
                for pred in predictions:
                    cursor.execute("UPDATE resource_plans SET synced = 1 WHERE prediction_id = ?", (pred["id"],))
            conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[SYNC WORKER WARN] Events/Predictions sync block failed: {e}")
        sync_errors.append(e)

    # 2. Sync Event Officers & Event Barricades (depends on dynamic resources schema)
    try:
        cursor.execute("SELECT * FROM events")
        all_event_ids = [row["id"] for row in cursor.fetchall()]
        
        for event_id in all_event_ids:
            # Sync event_officers
            cursor.execute("SELECT * FROM event_officers WHERE event_id = ? AND synced = 0", (event_id,))
            eo_list = [dict(r) for r in cursor.fetchall()]
            for eo in eo_list:
                sb_eo = {k: v for k, v in eo.items() if k != "synced"}
                supabase_client.table("event_officers").upsert(sb_eo).execute()
                cursor.execute("UPDATE event_officers SET synced = 1 WHERE id = ?", (eo["id"],))

            # Sync event_barricades
            cursor.execute("SELECT * FROM event_barricades WHERE event_id = ? AND synced = 0", (event_id,))
            eb_list = [dict(r) for r in cursor.fetchall()]
            for eb in eb_list:
                sb_eb = {k: v for k, v in eb.items() if k != "synced"}
                supabase_client.table("event_barricades").upsert(sb_eb).execute()
                cursor.execute("UPDATE event_barricades SET synced = 1 WHERE id = ?", (eb["id"],))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[SYNC WORKER WARN] Event resources mappings sync block failed: {e}")
        sync_errors.append(e)

    # 3. Sync hotspots
    try:
        cursor.execute("SELECT * FROM hotspot_scores WHERE synced = 0")
        unsynced_hotspots = [dict(row) for row in cursor.fetchall()]
        if unsynced_hotspots:
            for hs in unsynced_hotspots:
                sb_hs = {k: v for k, v in hs.items() if k != "synced"}
                supabase_client.table("hotspot_scores").upsert(sb_hs, on_conflict="junction_name").execute()
                cursor.execute("UPDATE hotspot_scores SET synced = 1 WHERE id = ?", (hs["id"],))
            conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[SYNC WORKER WARN] Hotspots sync block failed: {e}")
        sync_errors.append(e)

    # 4. Sync audit logs
    try:
        cursor.execute("SELECT * FROM audit_logs WHERE synced = 0")
        unsynced_audits = [dict(row) for row in cursor.fetchall()]
        if unsynced_audits:
            for audit in unsynced_audits:
                sb_audit = {k: v for k, v in audit.items() if k != "synced"}
                supabase_client.table("audit_logs").upsert(sb_audit).execute()
                cursor.execute("UPDATE audit_logs SET synced = 1 WHERE id = ?", (audit["id"],))
            conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[SYNC WORKER WARN] Audit logs sync block failed: {e}")
        sync_errors.append(e)

    # 5. Sync officer and barricade statuses (push updates)
    try:
        cursor.execute("SELECT * FROM officers WHERE synced = 0")
        unsynced_officers = [dict(row) for row in cursor.fetchall()]
        if unsynced_officers:
            for off in unsynced_officers:
                sb_off = {k: v for k, v in off.items() if k != "synced"}
                supabase_client.table("officers").upsert(sb_off).execute()
                cursor.execute("UPDATE officers SET synced = 1 WHERE id = ?", (off["id"],))
            conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[SYNC WORKER WARN] Officers status sync block failed: {e}")
        sync_errors.append(e)

    try:
        cursor.execute("SELECT * FROM barricades WHERE synced = 0")
        unsynced_barricades = [dict(row) for row in cursor.fetchall()]
        if unsynced_barricades:
            for bar in unsynced_barricades:
                sb_bar = {k: v for k, v in bar.items() if k != "synced"}
                supabase_client.table("barricades").upsert(sb_bar).execute()
                cursor.execute("UPDATE barricades SET synced = 1 WHERE id = ?", (bar["id"],))
            conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[SYNC WORKER WARN] Barricades status sync block failed: {e}")
        sync_errors.append(e)

    conn.close()
    
    if len(sync_errors) > 0:
        print(f"[SYNC WORKER] Completed with {len(sync_errors)} warnings (some tables were not synced, potentially missing remote tables).")
    else:
        print("[SYNC WORKER SUCCESS] SQLite offline records synchronized to Supabase remote instance.")
        
    return True
