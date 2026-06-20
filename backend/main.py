from fastapi import FastAPI
from datetime import datetime
from jinja2 import Template
from offline_data import OFFLINE_GUIDANCE
import networkx as nx
from cryptography.fernet import Fernet
import os
import pandas as pd
from sklearn.linear_model import LogisticRegression
import numpy as np

app = FastAPI()
timeline = []
case_graph = nx.Graph()
judge_db = []

KEY_FILE = "vault.key"
if not os.path.exists(KEY_FILE):
    open(KEY_FILE, "wb").write(Fernet.generate_key())
key = open(KEY_FILE, "rb").read()
cipher = Fernet(key)

@app.post("/police-mode")
def police(stage: str):
    steps = {"initial": ["Stay calm", "Hands visible", "Ask if detained", "Do not consent search"], "arrest": ["Do not resist", "Ask for lawyer", "Remain silent"]}
    return {"guidance": steps.get(stage, [])}

@app.get("/offline")
def offline(situation: str):
    return {"steps": OFFLINE_GUIDANCE.get(situation, [])}

@app.post("/record-event")
def record(event: str):
    entry = {"time": datetime.now().isoformat(), "event": event}
    timeline.append(entry)
    return entry

@app.get("/timeline")
def gettimeline():
    return timeline

@app.post("/draft")
def draft(name: str, facts: str, jurisdiction: str):
    t = Template("AFFIDAVIT OF {{name}} {{facts}} {{jurisdiction}}")
    return {"doc": t.render(name=name, facts=facts, jurisdiction=jurisdiction)}

X = np.array([[1,0], [0,1], [1,1], [0,0]])
y = np.array([1, 0, 1, 0])
model = LogisticRegression()
model.fit(X, y)

@app.post("/risk-predict")
def risk(a: int, b: int):
    r = model.predict([[a, b]])
    return {"risk": "HIGH" if r[0] == 1 else "LOW"}
