import sys
import os

# Include current directory in python path
sys.path.append(os.path.dirname(__file__))

from model_handler import predict_traffic_impact

# Test event payload matching Bengaluru's geography and training categories
sample_event = {
    "event_type": "unplanned",
    "event_cause": "accident",
    "requires_road_closure": True,
    "veh_type": "heavy_vehicle",
    "corridor": "Hosur Road",
    "zone": "South Zone 1",
    "junction": "SilkBoardJunc",
    "latitude": 12.9176,
    "longitude": 77.6244,
    "start_datetime": "2026-06-21T17:00:00"
}

try:
    print("[TEST] Running model prediction for sample event...")
    result = predict_traffic_impact(sample_event)
    
    print("\n[TEST SUCCESS] Model Inference completed successfully!")
    print(f" - Predicted Impact Level: {result['predicted_impact_level']}")
    print(f" - Computed Impact Score: {result['impact_score']}")
    print(" - Probability Breakdown:")
    for level, prob in result["probabilities"].items():
        print(f"    * {level}: {(prob * 100):.2f}%")
        
except Exception as e:
    print(f"\n[TEST FAILED] Error during model evaluation: {e}")
    sys.exit(1)
