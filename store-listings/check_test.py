"""Checks the store listing drafts: locale sets and store length limits.

Run: python3 -m pytest store-listings/check_test.py  (or python3 store-listings/check_test.py)
"""
import os
import unittest

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))

PLAY_LOCALES = {"cs-CZ", "el-GR", "es-US", "iw-IL", "nl-NL", "pt-PT", "ru-RU",
                "sv-SE", "sw", "uk", "zh-HK", "zh-TW"}
ASC_LOCALES = {"ar-SA", "cs", "de-DE", "el", "es-ES", "es-MX", "fr-FR", "he", "hi",
               "id", "it", "ja", "ko", "nl-NL", "pl", "pt-BR", "pt-PT", "ru", "sv",
               "th", "uk", "vi", "zh-Hans", "zh-Hant"}


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return yaml.safe_load(f)


class PlayTest(unittest.TestCase):
    def test_play(self):
        d = load("play.yaml")
        self.assertEqual(set(d["listings"]), PLAY_LOCALES)
        for loc, l in d["listings"].items():
            self.assertEqual(set(l), {"title", "shortDescription", "fullDescription"}, loc)
            self.assertTrue(0 < len(l["title"]) <= 30, loc)
            self.assertTrue(0 < len(l["shortDescription"]) <= 80, loc)
            self.assertTrue(0 < len(l["fullDescription"]) <= 4000, loc)
            self.assertIn("URnetwork", l["fullDescription"], loc)
            self.assertIn("Solana", l["fullDescription"], loc)


class TestFlightTest(unittest.TestCase):
    def test_testflight(self):
        d = load("testflight.yaml")
        src = d["source"]
        self.assertEqual(set(d["localizations"]), ASC_LOCALES)
        for loc, l in d["localizations"].items():
            self.assertTrue(0 < len(l["description"]) <= 4000, loc)
            self.assertIn("URnetwork", l["description"], loc)
            for k in ("feedbackEmail", "marketingUrl", "privacyPolicyUrl"):
                self.assertEqual(l[k], src[k], (loc, k))


if __name__ == "__main__":
    unittest.main()
