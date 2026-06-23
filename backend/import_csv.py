import os
import sys
import uuid
import json
import sqlite3
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# Add backend directory to sys.path so we can import model_handler and db_client
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

import model_handler
import db_client

# Find CSV path
csv_filename = "Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv"
csv_path = csv_filename
if not os.path.exists(csv_path):
    csv_path = os.path.join("..", csv_filename)
if not os.path.exists(csv_path):
    csv_path = os.path.join(backend_dir, csv_filename)
if not os.path.exists(csv_path):
    csv_path = os.path.join(os.path.dirname(backend_dir), csv_filename)

if not os.path.exists(csv_path):
    print(f"Error: CSV file '{csv_filename}' not found. Checked current directory, parent directory, and script directory.")
    sys.exit(1)

def standardize_datetime(dt_val):
    if pd.isna(dt_val) or not dt_val:
        return None
    dt_str = str(dt_val).strip()
    try:
        dt = pd.to_datetime(dt_str)
        # Convert to timezone aware UTC ISO string
        if dt.tzinfo is None:
            dt = dt.tz_localize('UTC')
        return dt.isoformat()
    except Exception:
        return dt_str

def main():
    print("[Import] Loading CatBoost model...")
    model_handler.load_model()

    print(f"[Import] Loading CSV dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"[Import] Found {len(df)} total records to process.")

    # Fill NaNs with model-compatible defaults
    df['event_type'] = df['event_type'].fillna('unplanned').astype(str)
    df['event_cause'] = df['event_cause'].fillna('others').astype(str)
    df['requires_road_closure'] = df['requires_road_closure'].fillna(False).astype(bool)
    df['veh_type'] = df['veh_type'].fillna('others').astype(str)
    df['corridor'] = df['corridor'].fillna('Non-corridor').astype(str)
    df['zone'] = df['zone'].fillna('Unknown').astype(str)
    df['junction'] = df['junction'].fillna('Unknown').astype(str)
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce').fillna(12.982847)
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce').fillna(77.589460)

    # Standardize end time from any of the end/closed date columns
    resolved_col = None
    for col in ['closed_datetime', 'resolved_datetime', 'end_datetime']:
        if col in df.columns:
            if resolved_col is None:
                resolved_col = df[col]
            else:
                resolved_col = resolved_col.fillna(df[col])

    df['resolved_time_parsed'] = resolved_col

    print("[Import] Standardizing timestamps...")
    df['start_datetime_clean'] = df['start_datetime'].apply(standardize_datetime)
    df['closed_datetime_clean'] = df['resolved_time_parsed'].apply(standardize_datetime)

    now_iso = datetime.utcnow().isoformat() + "Z"
    df['start_datetime_clean'] = df['start_datetime_clean'].fillna(now_iso)

    # Prepare features for CatBoost
    cat_features = ['event_type', 'event_cause', 'requires_road_closure', 'veh_type', 'corridor', 'zone', 'junction']

    print("[Import] Generating time features...")
    cb_rows = []
    for idx, row in df.iterrows():
        start_dt_str = row['start_datetime_clean']
        closed_dt_str = row['closed_datetime_clean']
        
        try:
            start_dt = pd.to_datetime(start_dt_str)
        except Exception:
            start_dt = datetime.utcnow()
            
        duration_min = 60.0
        if closed_dt_str:
            try:
                closed_dt = pd.to_datetime(closed_dt_str)
                duration_min = (closed_dt - start_dt).total_seconds() / 60.0
                if duration_min <= 0:
                    duration_min = 60.0
            except Exception:
                pass
                
        hour = start_dt.hour
        dayofweek = start_dt.weekday()
        month = start_dt.month
        is_weekend = 1 if dayofweek >= 5 else 0
        
        road_closure = "True" if row['requires_road_closure'] else "False"
        
        cb_rows.append({
            'event_type': str(row['event_type']).lower(),
            'event_cause': str(row['event_cause']).lower(),
            'requires_road_closure': road_closure,
            'veh_type': str(row['veh_type']).lower(),
            'corridor': str(row['corridor']),
            'zone': str(row['zone']),
            'junction': str(row['junction']),
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude']),
            'hour': float(hour),
            'dayofweek': float(dayofweek),
            'month': float(month),
            'is_weekend': float(is_weekend),
            'duration_minutes': duration_min
        })

    df_cb = pd.DataFrame(cb_rows)

    # Ensure clean string casting
    for col in cat_features:
        df_cb[col] = df_cb[col].astype(str).fillna('Unknown').replace('nan', 'Unknown')

    # Run batch predictions
    cb_model = model_handler.load_model()
    print("[Import] Running model batch predictions...")
    preds = cb_model.predict(df_cb.drop(columns=['duration_minutes']))
    probs_all = cb_model.predict_proba(df_cb.drop(columns=['duration_minutes']))
    classes = cb_model.classes_

    class_weights = {'Low': 0.15, 'Medium': 0.45, 'High': 0.75, 'Critical': 0.95}

    events_to_insert = []
    predictions_to_insert = []
    resource_plans_to_insert = []
    hotspots_agg = {}

    # Load resource configurations
    resource_map_path = os.path.join(backend_dir, "resource_map.json")
    if os.path.exists(resource_map_path):
        with open(resource_map_path, "r") as f:
            RESOURCE_MAP = json.load(f)
    else:
        RESOURCE_MAP = {
            "Low": {"police": 2, "barricades": 4, "diversion": "No"},
            "Medium": {"police": 5, "barricades": 10, "diversion": "Partial"},
            "High": {"police": 10, "barricades": 20, "diversion": "Required"},
            "Critical": {"police": 20, "barricades": 40, "diversion": "Mandatory"}
        }

    print("[Import] Building database records in memory...")
    for idx, row in df.iterrows():
        # Ensure idempotent valid UUIDs
        csv_id = str(row['id']) if not pd.isna(row['id']) else f"ROW_{idx}"
        event_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, csv_id))
        pred_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, csv_id + "_pred"))
        plan_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, csv_id + "_plan"))
        
        pred_level = preds[idx][0]
        probs = probs_all[idx]
        
        # Calculate impact score
        impact_score = 0.0
        for c_idx, c in enumerate(classes):
            prob = probs[c_idx]
            impact_score += prob * class_weights.get(c, 0.5)
        impact_score = round(impact_score, 4)
        
        duration_min = df_cb.loc[idx, 'duration_minutes']
        
        junction = str(row['junction'])
        lat = float(row['latitude'])
        lon = float(row['longitude'])

        # Build hotspot aggregate counts
        if junction and junction != 'Unknown' and not pd.isna(row['junction']):
            if junction not in hotspots_agg:
                hotspots_agg[junction] = {
                    'score_sum': 0.0,
                    'event_count': 0,
                    'latitude': lat,
                    'longitude': lon
                }
            hotspots_agg[junction]['score_sum'] += impact_score
            hotspots_agg[junction]['event_count'] += 1
            hotspots_agg[junction]['latitude'] = lat
            hotspots_agg[junction]['longitude'] = lon

        # Resource plan recommendations
        alloc = RESOURCE_MAP.get(pred_level, {"police": 5, "barricades": 10, "diversion": "Partial"})
        police = alloc.get("police", 5)
        barricades = alloc.get("barricades", 10)
        diversion = alloc.get("diversion", "Partial")
        
        created_at_val = row['start_datetime_clean']

        events_to_insert.append({
            'id': event_id,
            'event_type': str(row['event_type']).lower(),
            'event_cause': str(row['event_cause']).lower(),
            'requires_road_closure': bool(row['requires_road_closure']),
            'veh_type': str(row['veh_type']).lower(),
            'corridor': str(row['corridor']),
            'zone': str(row['zone']),
            'junction': junction,
            'latitude': lat,
            'longitude': lon,
            'start_datetime': created_at_val,
            'closed_datetime': row['closed_datetime_clean'] if not pd.isna(row['closed_datetime_clean']) else None,
            'duration_minutes': float(duration_min),
            'created_at': created_at_val
        })

        predictions_to_insert.append({
            'id': pred_id,
            'event_id': event_id,
            'predicted_impact_level': pred_level,
            'impact_score': impact_score,
            'created_at': created_at_val
        })

        resource_plans_to_insert.append({
            'id': plan_id,
            'prediction_id': pred_id,
            'police_required': int(police),
            'barricades_required': int(barricades),
            'diversion_strategy': diversion,
            'created_at': created_at_val
        })

    # Prepare hotspot records for insert
    hotspot_records = []
    for j_name, data in hotspots_agg.items():
        avg_score = data['score_sum'] / data['event_count']
        hotspot_records.append({
            'id': str(uuid.uuid5(uuid.NAMESPACE_DNS, f"hotspot_{j_name}")),
            'junction_name': j_name,
            'score': round(avg_score, 4),
            'event_count': data['event_count'],
            'latitude': data['latitude'],
            'longitude': data['longitude'],
            'last_updated': datetime.utcnow().isoformat() + "Z"
        })

    # Perform DB insertion based on config
    if db_client.USE_LOCAL_DB:
        print(f"[Import] Writing to local SQLite file: {db_client.DB_FILE}...")
        conn = sqlite3.connect(db_client.DB_FILE)
        cursor = conn.cursor()
        try:
            print("  Inserting events...")
            cursor.executemany("""
                INSERT OR REPLACE INTO events (id, event_type, event_cause, requires_road_closure, veh_type, corridor, zone, junction, latitude, longitude, start_datetime, closed_datetime, duration_minutes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                (e['id'], e['event_type'], e['event_cause'], 1 if e['requires_road_closure'] else 0, e['veh_type'], e['corridor'], e['zone'], e['junction'], e['latitude'], e['longitude'], e['start_datetime'], e['closed_datetime'], e['duration_minutes'], e['created_at'])
                for e in events_to_insert
            ])

            print("  Inserting predictions...")
            cursor.executemany("""
                INSERT OR REPLACE INTO predictions (id, event_id, predicted_impact_level, impact_score, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, [
                (p['id'], p['event_id'], p['predicted_impact_level'], p['impact_score'], p['created_at'])
                for p in predictions_to_insert
            ])

            print("  Inserting resource plans...")
            cursor.executemany("""
                INSERT OR REPLACE INTO resource_plans (id, prediction_id, police_required, barricades_required, diversion_strategy, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                (r['id'], r['prediction_id'], r['police_required'], r['barricades_required'], r['diversion_strategy'], r['created_at'])
                for r in resource_plans_to_insert
            ])

            print("  Inserting hotspot scores...")
            cursor.executemany("""
                INSERT OR REPLACE INTO hotspot_scores (id, junction_name, score, event_count, latitude, longitude, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                (h['id'], h['junction_name'], h['score'], h['event_count'], h['latitude'], h['longitude'], h['last_updated'])
                for h in hotspot_records
            ])

            conn.commit()
            print("[Import SUCCESS] Loaded all records into SQLite database.")
        except Exception as e:
            conn.rollback()
            print(f"[Import ERROR] SQLite commit failed: {e}")
            raise e
        finally:
            conn.close()
    else:
        print("[Import] Writing to remote Supabase instance...")
        from supabase import create_client
        supabase = create_client(db_client.SUPABASE_URL, db_client.SUPABASE_KEY)
        
        chunk_size = 500
        
        print(f"  Uploading {len(events_to_insert)} events (chunks of {chunk_size})...")
        for i in range(0, len(events_to_insert), chunk_size):
            chunk = events_to_insert[i:i+chunk_size]
            supabase.table("events").upsert(chunk).execute()
        
        print(f"  Uploading {len(predictions_to_insert)} predictions...")
        for i in range(0, len(predictions_to_insert), chunk_size):
            chunk = predictions_to_insert[i:i+chunk_size]
            supabase.table("predictions").upsert(chunk).execute()
            
        print(f"  Uploading {len(resource_plans_to_insert)} resource plans...")
        for i in range(0, len(resource_plans_to_insert), chunk_size):
            chunk = resource_plans_to_insert[i:i+chunk_size]
            supabase.table("resource_plans").upsert(chunk).execute()

        print(f"  Uploading {len(hotspot_records)} hotspot scores...")
        for i in range(0, len(hotspot_records), chunk_size):
            chunk = hotspot_records[i:i+chunk_size]
            supabase.table("hotspot_scores").upsert(chunk, on_conflict="junction_name").execute()

        print("[Import SUCCESS] Loaded all records into Supabase.")

    # Log audit entry
    try:
        db_client.log_audit("CSV_BATCH_IMPORT", f"Imported {len(events_to_insert)} historical events from CSV.")
    except Exception:
        pass

if __name__ == "__main__":
    main()
