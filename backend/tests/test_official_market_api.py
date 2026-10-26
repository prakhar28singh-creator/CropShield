import json
import os
import unittest
from unittest.mock import patch
from urllib.error import URLError

import market_data


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return self.payload


class OfficialMarketApiTests(unittest.TestCase):
    def setUp(self):
        market_data._OFFICIAL_RESPONSE_CACHE.clear()
        self.environment = patch.dict(os.environ, {"DATA_GOV_IN_API_KEY": "test-key"})
        self.environment.start()

    def tearDown(self):
        self.environment.stop()
        market_data._OFFICIAL_RESPONSE_CACHE.clear()

    @staticmethod
    def record(**overrides):
        values = {
            "commodity": "Tomato",
            "state": "Maharashtra",
            "district": "Nashik",
            "market": "Lasalgaon",
            "arrival_date": "16/10/2026",
            "min_price": "1200",
            "max_price": "1800",
            "modal_price": "1500",
        }
        return {**values, **overrides}

    def test_live_feed_rows_are_used_without_synthetic_fallback(self):
        records = [
            self.record(),
            self.record(arrival_date="17/10/2026", min_price="1300", max_price="1900", modal_price="1600"),
        ]
        with patch.object(market_data, "urlopen", return_value=FakeResponse({"records": records})) as request:
            result = market_data.get_market_prices("tomato", state="Maharashtra", district="Nashik")

        self.assertEqual(result["data_source"], "official")
        self.assertFalse(result["is_demo"])
        self.assertEqual(result["markets"][0]["modal_price"], 1600)
        self.assertEqual(result["markets"][0]["price_date"], "2026-10-17")
        self.assertEqual(result["markets"][0]["source"], market_data.OFFICIAL_SOURCE_LABEL)
        self.assertEqual(result["price_history"][0]["min_price"], 1200)
        self.assertEqual(result["price_history"][0]["max_price"], 1900)
        self.assertEqual(result["future_estimates"], {})
        self.assertIn("api-key", request.call_args.args[0])

    def test_successful_empty_feed_returns_no_fake_prices(self):
        with patch.object(market_data, "urlopen", return_value=FakeResponse({"records": []})):
            result = market_data.get_market_prices("tomato", state="Maharashtra")

        self.assertEqual(result["data_source"], "official")
        self.assertEqual(result["markets"], [])
        self.assertEqual(result["price_history"], [])

    def test_request_failure_uses_labeled_prototype_prices(self):
        with patch.object(market_data, "urlopen", side_effect=URLError("offline")):
            result = market_data.get_market_prices("tomato", state="Maharashtra", district="Nashik")

        self.assertEqual(result["data_source"], "demo")
        self.assertTrue(result["is_demo"])
        self.assertTrue(result["markets"])
        self.assertIn("not live or official", result["demo_notice"])

    def test_location_filter_does_not_fill_missing_official_rows_with_samples(self):
        with patch.object(market_data, "urlopen", return_value=FakeResponse({"records": [self.record()]})):
            result = market_data.get_market_prices("tomato", state="Maharashtra", district="Pune")

        self.assertEqual(result["data_source"], "official")
        self.assertEqual(result["markets"], [])

    def test_rice_feed_commodity_alias_is_normalized(self):
        record = self.record(commodity="Paddy(Dhan)(Common)")
        with patch.object(market_data, "urlopen", return_value=FakeResponse({"records": [record]})):
            result = market_data.get_market_prices("rice")

        self.assertEqual(result["data_source"], "official")
        self.assertEqual(result["markets"][0]["modal_price"], 1500)


if __name__ == "__main__":
    unittest.main()
