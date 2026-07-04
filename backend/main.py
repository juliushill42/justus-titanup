# JustUs AI — FastAPI Backend
# Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from jinja2 import Environment, BaseLoader
from offline_data import OFFLINE_GUIDANCE
import os
import threading
import secrets
import hashlib
from collections import deque
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, EmailStr

app = FastAPI(title="JustUs AI", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────
MAX_TIMELINE   = 10_000
RETENTION_HRS  = 24

# ── In-memory stores (sovereign — no external DB required) ─
timeline      = deque(maxlen=MAX_TIMELINE)
timeline_lock = threading.Lock()
users: Dict[str, dict] = {}          # email -> {name, pw_hash, token}
sessions: Dict[str, str] = {}        # token -> email
ws_sessions: Dict[str, list] = {}    # session_id -> [WebSocket]
ws_lock = threading.Lock()

# ── Jinja2 templates ──────────────────────────────────────
template_env = Environment(loader=BaseLoader())
BRIEF_TEMPLATES = {
    "affidavit":  template_env.from_string(
        "AFFIDAVIT\n\nJURISDICTION: {{jurisdiction}}\nDATE: {{date}}\n\n"
        "I, {{name}}, declare under penalty of perjury:\n\n{{facts}}\n\n"
        "{{relief}}\n\nExecuted: {{date}}\n_____________________\n{{name}}"
    ),
    "complaint":  template_env.from_string(
        "42 U.S.C. § 1983 CIVIL RIGHTS COMPLAINT\n\nJURISDICTION: {{jurisdiction}}\nDATE: {{date}}\n\n"
        "PLAINTIFF: {{name}}\n\nSTATEMENT OF FACTS:\n{{facts}}\n\nRELIEF REQUESTED:\n{{relief}}\n\n"
        "_____________________\n{{name}}"
    ),
    "motion":     template_env.from_string(
        "MOTION TO SUPPRESS EVIDENCE\n\nJURISDICTION: {{jurisdiction}}\nDATE: {{date}}\n\n"
        "DEFENDANT: {{name}}\n\nGROUNDS:\nPursuant to the Fourth Amendment and Fed. R. Crim. P. 12(b)(3)(C):\n\n"
        "{{facts}}\n\nRELIEF:\n{{relief}}\n\n_____________________\n{{name}}"
    ),
    "habeas":     template_env.from_string(
        "PETITION FOR WRIT OF HABEAS CORPUS\n28 U.S.C. § 2254 / § 2255\n\n"
        "JURISDICTION: {{jurisdiction}}\nDATE: {{date}}\n\nPETITIONER: {{name}}\n\n"
        "GROUNDS FOR RELIEF:\n{{facts}}\n\nRELIEF REQUESTED:\n{{relief}}\n\n_____________________\n{{name}}"
    ),
    "injunction": template_env.from_string(
        "MOTION FOR TEMPORARY RESTRAINING ORDER / PRELIMINARY INJUNCTION\n"
        "Fed. R. Civ. P. 65\n\nJURISDICTION: {{jurisdiction}}\nDATE: {{date}}\n\n"
        "MOVANT: {{name}}\n\nFACTS AND IRREPARABLE HARM:\n{{facts}}\n\n"
        "RELIEF REQUESTED:\n{{relief}}\n\n_____________________\n{{name}}"
    ),
}

# ── Helpers ───────────────────────────────────────────────
def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

def get_user_by_token(token: str) -> Optional[dict]:
    email = sessions.get(token)
    if email:
        return users.get(email)
    return None

# ── Pydantic models ───────────────────────────────────────
class LoginBody(BaseModel):
    email: str
    password: str

class RegisterBody(BaseModel):
    email: str
    password: str
    name: str = ""

class ChatBody(BaseModel):
    message: str

class DraftBody(BaseModel):
    name: str
    facts: str
    jurisdiction: str
    type: str = "affidavit"
    relief: str = ""

class EventBody(BaseModel):
    event: str

class RiskBody(BaseModel):
    violations: List[str] = []
    weaponDrawn: bool = False
    witnesses: bool = False
    bodycam: str = "unknown"
    injured: bool = False
    narrative: str = ""
    location: str = ""
    officerBadge: str = ""

# ── Auth endpoints ────────────────────────────────────────
@app.post("/auth/register")
def register(body: RegisterBody):
    if body.email in users:
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    token = make_token()
    users[body.email] = {"email": body.email, "name": body.name, "pw_hash": hash_pw(body.password)}
    sessions[token] = body.email
    return {"token": token, "email": body.email, "name": body.name}

@app.post("/auth/login")
def login(body: LoginBody):
    user = users.get(body.email)
    if not user or user["pw_hash"] != hash_pw(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token()
    sessions[token] = body.email
    return {"token": token, "email": body.email, "name": user.get("name", "")}

# ── Chat ──────────────────────────────────────────────────
CHAT_RESPONSES = {
    "miranda":     "Miranda Rights (5th Amendment): You have the right to remain silent. Anything you say can be used against you. You have the right to an attorney. If you cannot afford one, one will be appointed for you.",
    "silent":      "Invoking silence: clearly state 'I am invoking my right to remain silent' — then say nothing more until your attorney arrives.",
    "stop":        "Terry Stop (4th Amendment): Police need reasonable articulable suspicion to detain you. Ask: 'Am I being detained or am I free to go?'",
    "detained":    "If detained: 'I am invoking my right to remain silent and my right to counsel.' Do not consent to any searches.",
    "search":      "4th Amendment: Clearly state 'I do not consent to this search.' This cannot be used against you. Ask if they have a warrant.",
    "arrest":      "If arrested: Do not resist. Invoke your right to remain silent. Immediately request an attorney. Do not answer questions without counsel.",
    "1983":        "42 U.S.C. § 1983: Allows civil suits against state actors who violate constitutional rights under color of law. Document badge numbers, time, location, witnesses.",
    "warrant":     "A warrant must be signed by a judge, describe the place to be searched, and specify items to be seized. You may ask to see it.",
    "attorney":    "You have a 6th Amendment right to an attorney. If you cannot afford one, the state must provide one. Request one clearly and stop all questioning.",
    "record":      "You have a First Amendment right to record police performing official duties in public. Do not interfere with their duties while recording.",
}

@app.post("/chat")
def chat(body: ChatBody):
    msg = body.message.lower()
    for keyword, response in CHAT_RESPONSES.items():
        if keyword in msg:
            return {"response": response}
    return {
        "response": (
            "I can advise on: Miranda rights, Terry stops, 4th/5th/6th Amendment rights, "
            "§1983 civil rights claims, police accountability, warrants, and recording rights. "
            "What specific situation are you facing?"
        )
    }

# ── Document drafting ──────────────────────────────────────
@app.post("/draft")
def draft(body: DraftBody):
    if not body.name or not body.facts:
        raise HTTPException(status_code=400, detail="Name and facts are required")
    tmpl = BRIEF_TEMPLATES.get(body.type, BRIEF_TEMPLATES["affidavit"])
    doc = tmpl.render(
        name=body.name,
        facts=body.facts,
        jurisdiction=body.jurisdiction,
        relief=body.relief or "Relief as the Court deems just and proper.",
        date=datetime.now().strftime("%B %d, %Y %H:%M %Z"),
    )
    return {"doc": doc + "\n\n[Generated by JustUs AI | Titan Universal AI LLC | JCH-2026]\n[DRAFT — Consult licensed counsel before filing]"}

# ── Timeline ───────────────────────────────────────────────
@app.post("/record-event")
def record(body: EventBody):
    if not body.event or len(body.event) > 2000:
        raise HTTPException(status_code=400, detail="Event must be non-empty and < 2000 chars")
    entry = {"time": datetime.now().isoformat(), "event": body.event}
    with timeline_lock:
        timeline.append(entry)
    return entry

@app.get("/timeline")
def get_timeline(limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0)):
    with timeline_lock:
        total   = len(timeline)
        entries = list(timeline)[offset:offset + limit]
    return {"total": total, "limit": limit, "offset": offset, "entries": entries}

# ── Risk prediction ────────────────────────────────────────
@app.post("/risk-predict")
def risk_predict(body: RiskBody):
    score = 0
    flags = []

    if "Excessive Force" in body.violations:        score += 3; flags.append("Excessive force — document injuries immediately")
    if "False Arrest" in body.violations:           score += 2; flags.append("False arrest — invoke right to remain silent")
    if "Racial Profiling" in body.violations:       score += 2; flags.append("Racial profiling — document officer demographics")
    if "Denial of Medical Care" in body.violations: score += 3; flags.append("Medical denial — seek care immediately")
    if body.weaponDrawn:                            score += 2; flags.append("Weapon drawn — prioritize safety")
    if body.witnesses:                              score -= 1; flags.append("Witnesses present — collect contact info")
    if body.bodycam == "no":                        score += 1; flags.append("No body camera — your documentation is primary")
    if body.officerBadge:                           flags.append(f"Badge #{body.officerBadge} logged — file FOIA request")

    level = "HIGH" if score >= 5 else "MEDIUM" if score >= 3 else "LOW"
    return {"risk_level": level, "score": score, "flags": flags}

# ── WebSocket Witness Mesh ────────────────────────────────
@app.websocket("/ws/witness/{session_id}")
async def witness_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    with ws_lock:
        if session_id not in ws_sessions:
            ws_sessions[session_id] = []
        ws_sessions[session_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            with ws_lock:
                peers = ws_sessions.get(session_id, [])
                for peer in peers:
                    if peer != websocket:
                        try:
                            await peer.send_json(data)
                        except Exception:
                            pass
    except WebSocketDisconnect:
        pass
    finally:
        with ws_lock:
            if session_id in ws_sessions:
                ws_sessions[session_id] = [s for s in ws_sessions[session_id] if s != websocket]

# ── Offline guidance ───────────────────────────────────────
@app.get("/offline")
def offline(situation: str):
    if situation not in OFFLINE_GUIDANCE:
        raise HTTPException(status_code=400, detail=f"Unknown situation: {situation}")
    return {"steps": OFFLINE_GUIDANCE[situation]}

@app.post("/police-mode")
def police(stage: str):
    steps = {
        "initial": ["Stay calm", "Keep hands visible", "Ask if detained", "Do not consent to search"],
        "arrest":  ["Do not resist", "Request attorney", "Remain silent"],
    }
    if stage not in steps:
        raise HTTPException(status_code=400, detail=f"Invalid stage: {stage}")
    return {"guidance": steps[stage]}

@app.get("/health")
def health():
    return {"status": "healthy", "version": "3.0.0", "timestamp": datetime.now().isoformat()}
