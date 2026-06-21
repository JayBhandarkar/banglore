import os
import pandas as pd
import numpy as np
from datetime import datetime
from catboost import CatBoostClassifier

MODEL_FILE = "remediated_traffic_model.cbm"

# Search paths for the model file
model_path = MODEL_FILE
if not os.path.exists(model_path):
    model_path = os.path.join(os.path.dirname(__file__), MODEL_FILE)
if not os.path.exists(model_path):
    model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), MODEL_FILE)

model = None

# Dataset stats (for fallbacks)
MEDIAN_LATITUDE = 12.982847
MEDIAN_LONGITUDE = 77.589460

def load_model():
    """Lazily loads the CatBoost classifier model from disk."""
    global model
    if model is not None:
        return model
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"CatBoost model file '{MODEL_FILE}' not found. "
            f"Searched current directory, '{os.path.dirname(__file__)}', and parent directory."
        )
    
    model = CatBoostClassifier()
    model.load_model(model_path)
    print(f"[Model] CatBoost Model loaded successfully from: {model_path}")
    return model

def predict_traffic_impact(input_data: dict) -> dict:
    """
    Preprocesses raw simulation features and runs model prediction.
    Calculates dynamic impact scores based on probability distributions.
    """
    # 1. Load the model
    cb_model = load_model()
    
    # 2. Parse times & calculate time features
    start_dt_str = input_data.get("start_datetime")
    closed_dt_str = input_data.get("closed_datetime")
    
    if not start_dt_str:
        start_dt_str = datetime.utcnow().isoformat()
        
    try:
        start_dt = datetime.fromisoformat(start_dt_str.replace("Z", "+00:00"))
    except Exception:
        start_dt = datetime.utcnow()
        
    duration_min = 60.0  # Default fallback duration (1 hour)
    if closed_dt_str:
        try:
            closed_dt = datetime.fromisoformat(closed_dt_str.replace("Z", "+00:00"))
            duration_min = (closed_dt - start_dt).total_seconds() / 60.0
            if duration_min <= 0:
                duration_min = 60.0
        except Exception:
            pass
    
    hour = start_dt.hour
    dayofweek = start_dt.weekday()
    month = start_dt.month
    is_weekend = 1 if dayofweek >= 5 else 0
    
    # 3. Coordinate parsing & fallback
    try:
        lat = float(input_data.get("latitude", MEDIAN_LATITUDE))
    except (ValueError, TypeError):
        lat = MEDIAN_LATITUDE
        
    try:
        lon = float(input_data.get("longitude", MEDIAN_LONGITUDE))
    except (ValueError, TypeError):
        lon = MEDIAN_LONGITUDE
        
    # 4. Format road closure category
    road_closure = "True" if input_data.get("requires_road_closure") else "False"
    
    # 5. Build input row matching training schema
    # Features must match: cat_features + num_features
    row = {
        'event_type': str(input_data.get("event_type", "unplanned")).lower(),
        'event_cause': str(input_data.get("event_cause", "others")).lower(),
        'requires_road_closure': road_closure,
        'veh_type': str(input_data.get("veh_type", "others")).lower(),
        'corridor': str(input_data.get("corridor", "Non-corridor")),
        'zone': str(input_data.get("zone", "Unknown")),
        'junction': str(input_data.get("junction", "Unknown")),
        'latitude': lat,
        'longitude': lon,
        'hour': float(hour),
        'dayofweek': float(dayofweek),
        'month': float(month),
        'is_weekend': float(is_weekend)
    }
    
    df_row = pd.DataFrame([row])
    
    # Ensure exact string formatting for categoricals
    cat_features = ['event_type', 'event_cause', 'requires_road_closure', 'veh_type', 'corridor', 'zone', 'junction']
    for col in cat_features:
        df_row[col] = df_row[col].astype(str).fillna('Unknown').replace('nan', 'Unknown')
        
    # 6. Execute CatBoost Inference
    pred_level = cb_model.predict(df_row)[0][0]
    
    # 7. Dynamic Continuous Impact Score based on prediction probabilities
    probs = cb_model.predict_proba(df_row)[0]
    classes = cb_model.classes_
    
    # Mathematical weights for scoring
    class_weights = {'Low': 0.15, 'Medium': 0.45, 'High': 0.75, 'Critical': 0.95}
    impact_score = 0.0
    for idx, c in enumerate(classes):
        prob = probs[idx]
        impact_score += prob * class_weights.get(c, 0.5)
        
    return {
        "predicted_impact_level": pred_level,
        "impact_score": round(impact_score, 4),
        "duration_minutes": round(duration_min, 2),
        "probabilities": {classes[i]: round(float(probs[i]), 4) for i in range(len(classes))}
    }
