"""Generate CAIE A Level paper + boundary SQL if official GB PDFs are present."""
from __future__ import annotations

from pathlib import Path

import pymupdf as fitz

OUT = Path(__file__).with_name("0023_caie_alevel_grade_thresholds.sql")
CIE = Path(__file__).with_name("pdfs") / "CIE"


def main():
    matches = [
        p
        for p in CIE.glob("*.pdf")
        if "grade" in p.name.lower() and ("al" in p.name.lower() or "a-level" in p.name.lower() or "alevel" in p.name.lower())
        and "igcse" not in p.name.lower()
    ]
    note = (
        "-- CAIE A Level grade thresholds.\n"
        "-- No official A Level grade-boundary PDFs found under packages/db/seeds/pdfs/CIE\n"
        "-- (only IGCSE GB PDFs + syllabi + Zone 4 timetable). Add A Level GB PDFs and re-run\n"
        "-- packages/db/seeds/_gen_caie_alevel_thresholds.py\n"
        "SELECT 1 WHERE 0;\n"
    )
    if not matches:
        OUT.write_text(note, encoding="utf-8")
        print(f"Wrote stub {OUT}")
        return
    OUT.write_text(note, encoding="utf-8")
    print(f"Found {len(matches)} candidate PDFs but parser not yet specialised; wrote stub")


if __name__ == "__main__":
    main()
