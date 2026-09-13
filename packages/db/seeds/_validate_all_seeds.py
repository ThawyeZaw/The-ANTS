"""Validate seed SQL against a local SQLite schema clone."""
from __future__ import annotations

import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRIZZLE = ROOT / "drizzle-d1"
SEEDS = ROOT / "seeds"

SEED_ORDER = [
    "0001_exam_data_seed.sql",
    "0002_topics_CAIE_IGCSE_subjects.sql",
    "0003_cleanup_sample_data.sql",
    "0005_subjects_countdown_boards.sql",
    "0004_caie_igcse_grade_thresholds.sql",
    "0006_exams_w26_countdown.sql",
]


def split_sql(text: str) -> list[str]:
    text = text.replace("--> statement-breakpoint", "\n")
    # naive split on semicolons outside of quotes is enough for our seeds
    parts: list[str] = []
    buf: list[str] = []
    in_single = False
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "'" and not in_single:
            in_single = True
            buf.append(ch)
        elif ch == "'" and in_single:
            # escaped '' inside string
            if i + 1 < len(text) and text[i + 1] == "'":
                buf.append("''")
                i += 1
            else:
                in_single = False
                buf.append(ch)
        elif ch == ";" and not in_single:
            stmt = "".join(buf).strip()
            if stmt and not all(line.strip().startswith("--") or not line.strip() for line in stmt.splitlines()):
                # drop comment-only lines
                cleaned = "\n".join(
                    ln for ln in stmt.splitlines() if not ln.strip().startswith("--")
                ).strip()
                if cleaned:
                    parts.append(cleaned)
            buf = []
        else:
            buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        cleaned = "\n".join(ln for ln in tail.splitlines() if not ln.strip().startswith("--")).strip()
        if cleaned:
            parts.append(cleaned)
    return parts


def main():
    con = sqlite3.connect(":memory:")
    con.execute("PRAGMA foreign_keys = ON;")

    for mig in sorted(DRIZZLE.glob("*.sql")):
        sql = mig.read_text(encoding="utf-8")
        for stmt in split_sql(sql):
            try:
                con.execute(stmt)
            except sqlite3.Error as e:
                msg = str(e).lower()
                if "already exists" in msg or "duplicate" in msg:
                    continue
                print(f"SCHEMA FAIL {mig.name}: {e}\nSTMT: {stmt[:300]}")
                raise

    for name in SEED_ORDER:
        path = SEEDS / name
        print(f"Applying {name} ...")
        sql = path.read_text(encoding="utf-8")
        for i, stmt in enumerate(split_sql(sql), 1):
            try:
                con.execute(stmt)
            except sqlite3.Error as e:
                print(f"SEED FAIL {name} stmt#{i}: {e}")
                print(stmt[:500])
                raise
        print(f"  OK {name}")

    checks = {
        "curriculums": "SELECT COUNT(*) FROM curriculums",
        "subjects": "SELECT COUNT(*) FROM subjects",
        "past_papers": "SELECT COUNT(*) FROM past_papers",
        "boundaries": "SELECT COUNT(*) FROM paper_grade_boundaries",
        "exams": "SELECT COUNT(*) FROM exams",
        "topics": "SELECT COUNT(*) FROM topics",
    }
    for label, q in checks.items():
        n = con.execute(q).fetchone()[0]
        print(f"{label}: {n}")

    missing = con.execute(
        """
        SELECT DISTINCT e.subject_id
        FROM exams e
        LEFT JOIN subjects s ON s.id = e.subject_id
        WHERE s.id IS NULL
        """
    ).fetchall()
    assert not missing, f"orphan exam subject_ids: {missing}"

    orphan_pp = con.execute(
        """
        SELECT COUNT(*) FROM past_papers pp
        LEFT JOIN subjects s ON s.id = pp.subject_id
        WHERE pp.subject_id IS NOT NULL AND s.id IS NULL
        """
    ).fetchone()[0]
    assert orphan_pp == 0, f"orphan past_paper subject_ids: {orphan_pp}"

    codes = [r[0] for r in con.execute("SELECT DISTINCT syllabus_code FROM past_papers ORDER BY 1").fetchall()]
    print("past_paper codes:", codes)
    print("VALIDATION OK")


if __name__ == "__main__":
    main()
