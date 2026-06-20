from fastapi import FastAPI, HTTPException, Query
from datetime import datetime, timedelta
from jinja2 import Environment, BaseLoader
from offline_data import OFFLINE_GUIDANCE
import networkx as nx
from cryptography.fernet import Fernet
import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
import numpy as np
import joblib
import threading
from collections import deque
from typing import List, Dict

app = FastAPI()

# Configuration
MAX_TIMELINE_SIZE = 10000  # Max in-memory events
TIMELINE_RETENTION_HOURS = 24  # Auto-cleanup older than 24 hours
MODEL_PATH = "risk_model.pkl"
KEY_FILE = "vault.key"
TEMPLATE_CACHE = {}

# Initialize in-memory timeline with fixed size
timeline = deque(maxlen=MAX_TIMELINE_SIZE)
timeline_lock = threading.Lock()

# Pre-compile Jinja2 template environment
template_env = Environment(loader=BaseLoader())
AFFIDEVIT_TEMPLATE = template_env.from_string(
    "AFFIDAVIT OF {{name}}\n\nFACTS: {{facts}}\n\nJURISDICTION: {{jurisdiction}}"
)

# Initialize encryption (lazy-loaded on first use)
cipher = None

def get_cipher():
    """Lazy-load cipher on first use"""
    global cipher
    if cipher is not None:
        return cipher
    
    if not os.path.exists(KEY_FILE):
        with open(KEY_FILE, "wb") as f:
            f.write(Fernet.generate_key())
    
    with open(KEY_FILE, "rb") as f:
        key = f.read()
    cipher = Fernet(key)
    return cipher

# Load or train model once at startup
def load_or_train_model():
    """Load serialized model or train if not exists"""
    if os.path.exists(MODEL_PATH):
        print(f"Loading pre-trained model from {MODEL_PATH}")
        return joblib.load(MODEL_PATH)
    else:
        print("Training new risk prediction model...")
        X = np.array([[1, 0], [0, 1], [1, 1], [0, 0]])
        y = np.array([1, 0, 1, 0])
        model = LogisticRegression(max_iter=100)
        model.fit(X, y)
        joblib.dump(model, MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")
        return model

model = load_or_train_model()

# Initialize case graph
case_graph = nx.Graph()

def cleanup_old_timeline():
    """Remove timeline entries older than TIMELINE_RETENTION_HOURS"""
    cutoff_time = datetime.now() - timedelta(hours=TIMELINE_RETENTION_HOURS)
    with timeline_lock:
        # Note: deque doesn't support efficient filtering, so we recreate it
        # This is called periodically, not on every request
        temp_timeline = [entry for entry in timeline if 
                        datetime.fromisoformat(entry["time"]) > cutoff_time]
        timeline.clear()
        timeline.extend(temp_timeline)

# Validate input
def validate_stage(stage: str) -> bool:
    """Validate police mode stage parameter"""
    valid_stages = {"initial", "arrest"}
    return stage in valid_stages

def validate_situation(situation: str) -> bool:
    """Validate offline guidance situation"""
    return situation in OFFLINE_GUIDANCE

@app.post("/police-mode")
def police(stage: str):
    """Return police interaction guidance"""
    if not validate_stage(stage):
        raise HTTPException(status_code=400, detail=f"Invalid stage: {stage}. Use 'initial' or 'arrest'.")
    
    steps = {
        "initial": ["Stay calm", "Hands visible", "Ask if detained", "Do not consent search"],
        "arrest": ["Do not resist", "Ask for lawyer", "Remain silent"]
    }
    return {"guidance": steps.get(stage, [])}

@app.get("/offline")
def offline(situation: str):
    """Return offline guidance for situations"""
    if not validate_situation(situation):
        raise HTTPException(status_code=400, detail=f"Unknown situation: {situation}")
    
    return {"steps": OFFLINE_GUIDANCE.get(situation, [])}

@app.post("/record-event")
def record(event: str):
    """Record event with timestamp in bounded timeline"""
    if not event or len(event) > 1000:
        raise HTTPException(status_code=400, detail="Event must be non-empty and < 1000 chars")
    
    entry = {"time": datetime.now().isoformat(), "event": event}
    with timeline_lock:
        timeline.append(entry)
    return entry

@app.get("/timeline")
def get_timeline(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0)):
    """Get paginated timeline entries"""
    with timeline_lock:
        total = len(timeline)
        entries = list(timeline)[offset:offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "entries": entries
    }

@app.post("/draft")
def draft(name: str, facts: str, jurisdiction: str):
    """Draft affidavit using pre-compiled template"""
    # Validate inputs
    if not all([name, facts, jurisdiction]) or any(len(s) > 500 for s in [name, facts, jurisdiction]):
        raise HTTPException(status_code=400, detail="Invalid input parameters")
    
    # Use pre-compiled template (cached)
    doc = AFFIDAVIT_TEMPLATE.render(name=name, facts=facts, jurisdiction=jurisdiction)
    return {"doc": doc}

@app.post("/risk-predict")
def risk(a: int, b: int):
    """Predict risk based on two factors"""
    if not isinstance(a, int) or not isinstance(b, int):
        raise HTTPException(status_code=400, detail="Parameters must be integers")
    
    r = model.predict([[a, b]])
    return {"risk": "HIGH" if r[0] == 1 else "LOW"}

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
