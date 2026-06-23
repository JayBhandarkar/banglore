import os
import json
import asyncio
import threading
import time
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db_client
import model_handler

app = FastAPI(
    title="Gridlock Traffic Remediation API",
    description="Backend API serving CatBoost predictions and resources plans.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Resource Map config
RESOURCE_MAP_FILE = "resource_map.json"
resource_map_path = RESOURCE_MAP_FILE

if not os.path.exists(resource_map_path):
    resource_map_path = os.path.join(os.path.dirname(__file__), RESOURCE_MAP_FILE)
if not os.path.exists(resource_map_path):
    resource_map_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), RESOURCE_MAP_FILE)

try:
    with open(resource_map_path, "r") as f:
        RESOURCE_MAP = json.load(f)
    print(f"[API] Resource map loaded from {resource_map_path}")
except Exception as e:
    print(f"[API] Error loading resource map file, using defaults: {e}")
    RESOURCE_MAP = {
        "Low": {"police": 2, "barricades": 4, "diversion": "No"},
        "Medium": {"police": 5, "barricades": 10, "diversion": "Partial"},
        "High": {"police": 10, "barricades": 20, "diversion": "Required"},
        "Critical": {"police": 20, "barricades": 40, "diversion": "Mandatory"}
    }

class SimulationInput(BaseModel):
    event_type: str = "unplanned"
    event_cause: str = "others"
    requires_road_closure: bool = False
    veh_type: str = "others"
    corridor: str = "Non-corridor"
    zone: str = "Unknown"
    junction: str = "Unknown"
    latitude: float = 12.982847
    longitude: float = 77.589460
    start_datetime: Optional[str] = None
    closed_datetime: Optional[str] = None

def db_sync_loop():
    """Background loop checking and syncing local offline database events to remote cloud."""
    print("[Background Sync] Periodic synchronization worker initialized.")
    while True:
        try:
            db_client.sync_local_db_to_supabase()
        except Exception as e:
            print(f"[Background Sync Error] Execution failed: {e}")
        time.sleep(30)

@app.on_event("startup")
def startup_event():
    # Pre-initialize Database
    db_client.init_db()
    # Start periodic DB sync thread
    threading.Thread(target=db_sync_loop, daemon=True).start()
    # Pre-load CatBoost Model
    try:
        model_handler.load_model()
    except Exception as e:
        print(f"[API WARN] Failed to pre-load CatBoost model. It will lazy load on request: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Gridlock Traffic Prediction Backend",
        "database": "Local SQLite fallback" if db_client.USE_LOCAL_DB else "Remote Supabase"
    }

@app.post("/api/predict")
async def run_simulation(payload: SimulationInput):
    """
    Ingests traffic incident attributes, executes prediction, computes resource 
    recommendations using proximity-based dispatch, saves to database, and writes audit record.
    """
    input_data = payload.dict()
    
    # 1. Generate model prediction asynchronously in thread pool to prevent event loop blocking
    try:
        prediction = await asyncio.to_thread(model_handler.predict_traffic_impact, input_data)
    except Exception as e:
        db_client.log_audit("PREDICTION_ERROR", f"Prediction execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")
        
    predicted_level = prediction["predicted_impact_level"]
    impact_score = prediction["impact_score"]
    
    # 2. Get resource mappings
    allocation = RESOURCE_MAP.get(predicted_level, {"police": 5, "barricades": 10, "diversion": "Partial"})
    
    resource_plan = {
        "police_required": allocation.get("police", 5),
        "barricades_required": allocation.get("barricades", 10),
        "diversion_strategy": allocation.get("diversion", "Partial")
    }
    
    # 3. Synchronize database insertion and proximity dispatch
    try:
        db_ids = db_client.save_simulation(
            event_data={**input_data, "duration_minutes": prediction["duration_minutes"]},
            prediction_data={"predicted_impact_level": predicted_level, "impact_score": impact_score},
            resource_plan_data=resource_plan
        )
        dispatched_resources = db_ids.pop("dispatched_resources", {"officers": [], "barricades": []})
    except Exception as e:
        db_client.log_audit("DATABASE_SYNC_ERROR", f"Failed saving simulation outputs: {str(e)}")
        # Continue and return predictions even if saving fails (graceful degradation)
        db_ids = {"event_id": None, "prediction_id": None, "resource_plan_id": None}
        dispatched_resources = {"officers": [], "barricades": []}
        print(f"[API ERROR] Failed to save simulation: {e}")
        
    return {
        "success": True,
        "prediction": {
            "predicted_impact_level": predicted_level,
            "impact_score": impact_score,
            "probabilities": prediction["probabilities"]
        },
        "recommendation": {
            **resource_plan,
            "dispatched_resources": dispatched_resources
        },
        "database_records": db_ids
    }

@app.get("/api/history")
def get_prediction_history(limit: int = 50):
    """Retrieves list of past simulated events."""
    data = db_client.get_history(limit)
    return {
        "success": True,
        "count": len(data),
        "data": data
    }

@app.get("/api/hotspots")
def get_hotspot_locations(limit: int = 100):
    """Retrieves hotspot severity rankings and mapping coordinates."""
    data = db_client.get_hotspots(limit)
    return {
        "success": True,
        "count": len(data),
        "data": data
    }

@app.get("/api/analytics")
def get_aggregated_dashboard_stats():
    """Retrieves overall KPIs and chart coordinates for frontend dashboards."""
    data = db_client.get_analytics()
    return {
        "success": True,
        "data": data
    }

@app.get("/api/audit-logs")
def get_system_audit_logs(limit: int = 100):
    """Retrieves backend audit records."""
    data = db_client.get_audit_logs(limit)
    return {
        "success": True,
        "count": len(data),
        "data": data
    }

@app.get("/api/resources")
def get_system_resources():
    """Retrieves active positions and availability status of officers and barricade depots."""
    data = db_client.get_resources()
    return {
        "success": True,
        "data": data
    }
