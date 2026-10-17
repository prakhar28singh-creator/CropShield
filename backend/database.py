import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

DB_PATH = Path(os.environ.get("CROPSHIELD_DB_PATH", Path(__file__).parent / "cropshield.db"))


def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS farmers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            password_iterations INTEGER NOT NULL DEFAULT 100000,
            village TEXT DEFAULT '',
            state TEXT DEFAULT '',
            district TEXT DEFAULT '',
            auth_token TEXT,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER,
            farmer_name TEXT NOT NULL,
            crop TEXT NOT NULL,
            variety TEXT,
            quantity_kg REAL NOT NULL,
            harvest_date TEXT NOT NULL,
            location TEXT NOT NULL,
            state TEXT NOT NULL DEFAULT '',
            district TEXT NOT NULL,
            storage_type TEXT NOT NULL,
            temperature_c REAL,
            humidity_pct REAL,
            intended_sell_date TEXT,
            visible_condition TEXT DEFAULT 'fresh',
            created_at TEXT NOT NULL,
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
        )
    """)
    farmer_columns = {row[1] for row in c.execute("PRAGMA table_info(farmers)").fetchall()}
    if "password_iterations" not in farmer_columns:
        c.execute("ALTER TABLE farmers ADD COLUMN password_iterations INTEGER NOT NULL DEFAULT 100000")
    if "state" not in farmer_columns:
        c.execute("ALTER TABLE farmers ADD COLUMN state TEXT DEFAULT ''")

    batch_columns = {row[1] for row in c.execute("PRAGMA table_info(batches)").fetchall()}
    if "farmer_id" not in batch_columns:
        c.execute("ALTER TABLE batches ADD COLUMN farmer_id INTEGER")
    if "state" not in batch_columns:
        c.execute("ALTER TABLE batches ADD COLUMN state TEXT NOT NULL DEFAULT ''")
    c.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            risk_score REAL NOT NULL,
            risk_category TEXT NOT NULL,
            risk_factors TEXT NOT NULL,
            quantity_at_risk_kg REAL NOT NULL,
            recommended_actions TEXT NOT NULL,
            sell_now_return REAL,
            store_return REAL,
            recommendation TEXT NOT NULL,
            recommendation_reason TEXT NOT NULL,
            assumptions TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (batch_id) REFERENCES batches(id)
        )
    """)
    c.execute("PRAGMA foreign_keys = ON")
    c.execute("PRAGMA journal_mode = WAL")
    conn.commit()
    conn.close()
