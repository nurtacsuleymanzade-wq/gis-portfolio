import unittest
from etl_pipeline import transform

class TestETL(unittest.TestCase):
    def test_dedup_and_threshold(self):
        rows = [
            {"id":"A","value":"42","name":"North"},
            {"id":"A","value":"42","name":"North"},
            {"id":"B","value":"18","name":"South"},
            {"id":"C","value":"85","name":"West"},
            {"id":"D","value":"60","name":""},
        ]
        clean, audit = transform(rows)
        self.assertEqual([x["id"] for x in clean], ["A", "C"])
        self.assertEqual(audit["rejected"], {"missing":1,"duplicate":1,"invalid":0,"threshold":1})

    def test_non_numeric_and_nonfinite(self):
        clean, audit = transform([{"id":"X","value":"oops"},{"id":"Y","value":"NaN"},{"id":"Z","value":"40"}])
        self.assertEqual(len(clean),1)
        self.assertEqual(audit["rejected"]["invalid"],2)

    def test_missing_schema(self):
        with self.assertRaises(ValueError):
            transform([{"other":"12"}])

if __name__ == "__main__":
    unittest.main()
