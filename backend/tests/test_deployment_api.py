import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import database
from main import PASSWORD_ITERATIONS, _owns, app


class DeploymentApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path_patch = patch.object(
            database, "DB_PATH", Path(self.temp_dir.name) / "test.sqlite"
        )
        self.db_path_patch.start()
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.db_path_patch.stop()
        self.temp_dir.cleanup()

    def register(self, phone, name="Test Farmer"):
        response = self.client.post(
            "/farmers/register",
            json={
                "name": name,
                "phone": phone,
                "password": "secure-password",
                "state": "Maharashtra",
                "district": "Nashik",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_health_checks_database_and_docs_are_available_in_development(self):
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})
        self.assertEqual(self.client.get("/docs").status_code, 200)

    def test_registration_enforces_password_strength_and_location(self):
        short_password = self.client.post(
            "/farmers/register",
            json={"name": "Test", "phone": "9000000001", "password": "short"},
        )
        self.assertEqual(short_password.status_code, 422)

        invalid_location = self.client.post(
            "/farmers/register",
            json={
                "name": "Test",
                "phone": "9000000002",
                "password": "secure-password",
                "state": "Karnataka",
                "district": "Nashik",
            },
        )
        self.assertEqual(invalid_location.status_code, 422)

    def test_account_batch_access_is_scoped_to_its_owner(self):
        owner = self.register("9000000003")
        other = self.register("9000000004", name="Test Farmer")
        batch = self.client.post(
            "/batches",
            headers={"Authorization": f"Bearer {owner['token']}"},
            json={
                "farmer_name": owner["farmer"]["name"],
                "crop": "tomato",
                "quantity_kg": 250,
                "harvest_date": "2026-10-16",
                "location": "Igatpuri",
                "state": "Maharashtra",
                "district": "Nashik",
                "storage_type": "open_room",
            },
        )
        self.assertEqual(batch.status_code, 200, batch.text)
        batch_id = batch.json()["id"]

        other_headers = {"Authorization": f"Bearer {other['token']}"}
        self.assertEqual(self.client.get("/batches", headers=other_headers).json(), [])
        self.assertEqual(
            self.client.get(f"/batches/{batch_id}", headers=other_headers).status_code,
            403,
        )

    def test_password_iterations_are_stored_for_future_verification(self):
        account = self.register("9000000005")
        login = self.client.post(
            "/farmers/login",
            json={"phone": account["farmer"]["phone"], "password": "secure-password"},
        )
        self.assertEqual(login.status_code, 200)

        conn = database.get_db()
        row = conn.execute(
            "SELECT password_iterations FROM farmers WHERE phone=?",
            (account["farmer"]["phone"],),
        ).fetchone()
        conn.close()
        self.assertEqual(row["password_iterations"], PASSWORD_ITERATIONS)

    def test_unlinked_legacy_batch_is_not_owned_by_name_match(self):
        farmer = {"id": 2, "name": "Test Farmer"}
        self.assertFalse(_owns({"farmer_id": None, "farmer_name": "Test Farmer"}, farmer))
        self.assertFalse(_owns({"farmer_id": 1, "farmer_name": "Test Farmer"}, farmer))
        self.assertFalse(_owns({"farmer_id": None, "farmer_name": "Someone Else"}, farmer))


if __name__ == "__main__":
    unittest.main()
