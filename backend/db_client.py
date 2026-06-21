import os
import sqlite3
import uuid
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
if not USE_LOCAL_DB:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[DB] Connected to Supabase successfully.")
    except Exception as e:
        print(f"[DB] Error connecting to Supabase: {e}. Falling back to local SQLite.")
        USE_LOCAL_DB = True

DB_FILE = "gridlock_local.db"

def init_db():
    """Initializes local SQLite database tables if using local database."""
    if not USE_LOCAL_DB:
        print("[DB] Using Supabase remote database. Schema should be created using schema.sql.")
        return
    
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
        last_updated TEXT
    )
    """)
    
    # 5. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT,
        details TEXT,
        created_at TEXT
    )
    """)
    
    conn.commit()
    conn.close()
    print("[DB] Local SQLite tables initialized successfully.")

def save_simulation(event_data, prediction_data, resource_plan_data):
    """
    Saves a simulation transaction: event, prediction, resource plan, 
    updates hotspot score, and logs audit action.
    """
    event_id = str(uuid.uuid4())
    pred_id = str(uuid.uuid4())
    plan_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()

    # Calculate default score for mapping hotspot
    impact_score = float(prediction_data.get("impact_score", 0.0))
    junction = event_data.get("junction", "Unknown")
    lat = float(event_data.get("latitude", 12.97))
    lon = float(event_data.get("longitude", 77.59))

    if USE_LOCAL_DB:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        try:
            # Insert Event
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
            
            # Insert Prediction
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
            
            # Insert Resource Plan
            cursor.execute("""
                INSERT INTO resource_plans (id, prediction_id, police_required, barricades_required, diversion_strategy, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                plan_id,
                pred_id,
                int(resource_plan_data.get("police_required", 0)),
                int(resource_plan_data.get("barricades_required", 0)),
                resource_plan_data.get("diversion_strategy", "No"),
                now_str
            ))
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    else:
        # Supabase Remote DB Inserts
        # Event insert
        evt_res = supabase_client.table("events").insert({
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
        
        # Prediction insert
        pred_res = supabase_client.table("predictions").insert({
            "id": pred_id,
            "event_id": event_id,
            "predicted_impact_level": prediction_data.get("predicted_impact_level", "Medium"),
            "impact_score": impact_score
        }).execute()
        
        # Resource Plan insert
        plan_res = supabase_client.table("resource_plans").insert({
            "id": plan_id,
            "prediction_id": pred_id,
            "police_required": int(resource_plan_data.get("police_required", 0)),
            "barricades_required": int(resource_plan_data.get("barricades_required", 0)),
            "diversion_strategy": resource_plan_data.get("diversion_strategy", "No")
        }).execute()

    # Update dynamic hotspot score
    update_hotspot_score(junction, impact_score, lat, lon)
    
    # Audit log
    log_audit("SIMULATION_RUN", f"Simulated event at {junction}. Predicted Level: {prediction_data.get('predicted_impact_level')}")

    return {
        "event_id": event_id,
        "prediction_id": pred_id,
        "resource_plan_id": plan_id
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
            # Running average of severity scores
            new_score = (curr_score * count + score) / new_count
            cursor.execute("""
                UPDATE hotspot_scores 
                SET score = ?, event_count = ?, last_updated = ?, latitude = ?, longitude = ?
                WHERE junction_name = ?
            """, (new_score, new_count, now_str, latitude, longitude, junction_name))
        else:
            cursor.execute("""
                INSERT INTO hotspot_scores (id, junction_name, score, event_count, latitude, longitude, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
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
            INSERT INTO audit_logs (id, action, details, created_at)
            VALUES (?, ?, ?, ?)
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
