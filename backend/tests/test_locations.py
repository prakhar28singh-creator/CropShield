import sqlite3
import tempfile
import unittest
import os
from pathlib import Path
from unittest.mock import patch

import database
from market_data import get_market_meta, get_market_prices, is_valid_location
from risk_engine import CROP_PROFILES


class LocationDataTests(unittest.TestCase):
    def setUp(self):
        self.api_key_patch = patch.dict(os.environ, {"DATA_GOV_IN_API_KEY": ""})
        self.api_key_patch.start()

    def tearDown(self):
        self.api_key_patch.stop()

    def test_metadata_contains_all_states_and_union_territories(self):
        states = get_market_meta()["states"]

        self.assertEqual(len(states), 36)
        self.assertEqual(
            [state["name"] for state in states],
            sorted((state["name"] for state in states), key=str.casefold),
        )
        self.assertEqual(sum(len(state["districts"]) for state in states), 784)
        self.assertTrue(all(state["districts"] for state in states))

    def test_districts_are_valid_only_for_their_state(self):
        self.assertTrue(is_valid_location("Maharashtra", "Nashik"))
        self.assertFalse(is_valid_location("Karnataka", "Nashik"))

    def test_demo_market_results_respect_selected_state_and_district(self):
        result = get_market_prices("tomato", district="Dhemaji", state="Assam")

        self.assertTrue(result["markets"])
        self.assertTrue(all(market["state"] == "Assam" for market in result["markets"]))
        self.assertTrue(all(market["district"] == "Dhemaji" for market in result["markets"]))
        self.assertTrue(all("Sample data" in market["source"] for market in result["markets"]))
        self.assertIn("DEMO", result["demo_notice"])

    def test_crop_catalogue_has_profiles_and_sample_prices_for_every_crop(self):
        crops = get_market_meta()["crops"]

        self.assertGreaterEqual(len(crops), 10)
        self.assertEqual({crop["key"] for crop in crops}, set(CROP_PROFILES))
        for crop in crops:
            with self.subTest(crop=crop["key"]):
                result = get_market_prices(crop["key"], district="Nashik", state="Maharashtra")
                self.assertTrue(result["markets"])
                self.assertTrue(all("Sample data" in market["source"] for market in result["markets"]))
                self.assertIn("DEMO", result["demo_notice"])
                self.assertEqual(len(result["price_history"]), 5)
                self.assertEqual(
                    [point["date"][:7] for point in result["price_history"]],
                    ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"],
                )
                for point in result["price_history"]:
                    self.assertLessEqual(point["min_price"], point["modal_price"])
                    self.assertLessEqual(point["modal_price"], point["max_price"])

    def test_existing_database_migrates_location_columns(self):
        original_db_path = database.DB_PATH
        with tempfile.TemporaryDirectory() as temp_dir:
            database.DB_PATH = Path(temp_dir) / "legacy.sqlite"
            conn = sqlite3.connect(database.DB_PATH)
            conn.executescript("""
                CREATE TABLE farmers (
                    id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL,
                    password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
                    village TEXT DEFAULT '', district TEXT DEFAULT '',
                    auth_token TEXT, created_at TEXT NOT NULL
                );
                CREATE TABLE batches (
                    id INTEGER PRIMARY KEY, farmer_name TEXT NOT NULL, crop TEXT NOT NULL,
                    variety TEXT, quantity_kg REAL NOT NULL, harvest_date TEXT NOT NULL,
                    location TEXT NOT NULL, district TEXT NOT NULL, storage_type TEXT NOT NULL,
                    temperature_c REAL, humidity_pct REAL, intended_sell_date TEXT,
                    visible_condition TEXT DEFAULT 'fresh', created_at TEXT NOT NULL
                );
            """)
            conn.close()
            try:
                database.init_db()
                conn = database.get_db()
                farmer_columns = {row[1] for row in conn.execute("PRAGMA table_info(farmers)")}
                batch_columns = {row[1] for row in conn.execute("PRAGMA table_info(batches)")}
                conn.close()
            finally:
                database.DB_PATH = original_db_path

        self.assertIn("state", farmer_columns)
        self.assertIn("password_iterations", farmer_columns)
        self.assertIn("state", batch_columns)
        self.assertIn("farmer_id", batch_columns)


if __name__ == "__main__":
    unittest.main()
