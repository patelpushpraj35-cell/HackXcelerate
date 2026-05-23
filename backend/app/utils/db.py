import sqlite3
import json
import os
from datetime import datetime
from app.utils.config import settings

DB_PATH = os.path.join(settings.BASE_DIR, "db.sqlite3")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            scan_id TEXT PRIMARY KEY,
            filename TEXT,
            verdict TEXT,
            threat_level TEXT,
            reality_score REAL,
            confidence REAL,
            timestamp TEXT,
            payload TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_scan(scan_id, filename, verdict, threat_level, reality_score, confidence, payload):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ensure scan_id is unique
    cursor.execute("INSERT OR REPLACE INTO scans (scan_id, filename, verdict, threat_level, reality_score, confidence, timestamp, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (
        scan_id,
        filename,
        verdict,
        threat_level,
        float(reality_score),
        float(confidence),
        datetime.now().isoformat(),
        json.dumps(payload)
    ))
    conn.commit()
    conn.close()

def get_all_scans():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    scans = []
    for r in rows:
        scan = dict(r)
        try:
            payload = json.loads(scan["payload"])
            # Merge payload keys, keeping root ones if there are collisions
            for k, v in payload.items():
                if k not in scan:
                    scan[k] = v
        except:
            pass
        scans.append(scan)
    return scans

def get_scan(scan_id):
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans WHERE scan_id = ?", (scan_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    scan = dict(row)
    try:
        payload = json.loads(scan["payload"])
        for k, v in payload.items():
            if k not in scan:
                scan[k] = v
    except:
        pass
    return scan
