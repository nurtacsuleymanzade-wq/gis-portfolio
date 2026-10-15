import argparse
import csv
import json
from pathlib import Path

def transform(rows, key="id", numeric="value", minimum=30):
    rows = list(rows)
    if not rows:
        raise ValueError("No records")
    fields = list(rows[0])
    if key not in fields or numeric not in fields:
        raise ValueError("Missing required columns")
    seen, clean = set(), []
    removed = {"missing": 0, "duplicate": 0, "invalid": 0, "threshold": 0}
    for row in rows:
        if None in row or any(not (v or "").strip() for v in row.values()):
            removed["missing"] += 1
            continue
        try:
            number = float(row[numeric])
        except ValueError:
            removed["invalid"] += 1
            continue
        if not -float("inf") < number < float("inf"):
            removed["invalid"] += 1
            continue
        if row[key] in seen:
            removed["duplicate"] += 1
            continue
        seen.add(row[key])
        if number < minimum:
            removed["threshold"] += 1
            continue
        clean.append(row)
    return clean, {"input": len(rows), "output": len(clean), "rejected": removed}

def run(src, dst, audit):
    with open(src, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        if not fields:
            raise ValueError("Missing header")
        clean, summary = transform(reader)
    with open(dst, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(clean)
    Path(audit).write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return summary

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("--output", default="cleaned.csv")
    p.add_argument("--audit", default="audit.json")
    args = p.parse_args()
    print(json.dumps(run(args.input, args.output, args.audit), indent=2))
