"""Generate CAIE A Level subject-level composite thresholds from official PDFs."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "0030_caie_alevel_subject_composites.sql"

spec = importlib.util.spec_from_file_location("caie_al_gb", ROOT / "_gen_caie_alevel_thresholds.py")
assert spec and spec.loader
al_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(al_mod)

spec2 = importlib.util.spec_from_file_location("caie_gb", ROOT / "_gen_grade_thresholds.py")
assert spec2 and spec2.loader
mod = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(mod)


def write_stub(reason: str) -> None:
    note = (
        "-- CAIE A Level syllabus-level composite thresholds.\n"
        f"-- {reason}\n"
        "-- Re-run after A Level GB PDFs are added:\n"
        "--   python packages/db/seeds/_gen_caie_alevel_composites.py\n"
        "SELECT 1 WHERE 0;\n"
    )
    OUT.write_text(note, encoding="utf-8")
    print(f"Wrote stub {OUT}")


def main() -> None:
    pdfs = al_mod.discover_pdfs()
    if not pdfs:
        write_stub("No official A Level grade-boundary PDFs found.")
        return

    sessions: dict[tuple, dict] = {}
    for path in pdfs:
        doc = mod.fitz.open(path)
        pending = None
        for pi in range(doc.page_count):
            text = doc[pi].get_text()
            cont = "continued" in text.lower() and "grade thresholds" in text.lower()
            season_year = mod.series_from_header(text)
            syllabus = al_mod.syllabus_from_header(text)
            opts = mod.extract_option_rows(text)
            if cont and pending:
                if not syllabus:
                    syllabus = pending[0]
                if not season_year:
                    season_year = (pending[1], pending[2])
            if not syllabus or syllabus not in al_mod.SUBJECTS:
                continue
            if not season_year:
                if pending and syllabus == pending[0]:
                    season_year = (pending[1], pending[2])
                else:
                    continue
            season, year = season_year
            key = (syllabus, season, year)
            bucket = sessions.setdefault(key, {"options": []})
            existing = {(o["code"], tuple(o["components"])) for o in bucket["options"]}
            for o in opts:
                sig = (o["code"], tuple(o["components"]))
                if sig not in existing:
                    bucket["options"].append(o)
                    existing.add(sig)
            pending = (syllabus, season, year)

    if not sessions:
        write_stub(f"Found {len(pdfs)} candidate PDF(s) but no parseable option tables.")
        return

    rows: list[str] = []
    for (syllabus, season, year) in sorted(sessions.keys(), key=lambda k: (k[0], k[2], k[1])):
        subject_id, _ = al_mod.SUBJECTS[syllabus]
        series_name, series_letter = mod.SERIES_MAP[season]
        series_code = f"{series_letter}{str(year)[2:]}"
        data = sessions[(syllabus, season, year)]
        for opt in data["options"]:
            total = opt["max"]
            published = {g: v for g, v in opt["grades"].items() if v is not None}
            if not published:
                continue
            astar = published.get("A*")
            bands = mod.build_bands(total, {g: published.get(g) for g in mod.COMP_GRADES}, astar)
            opt_slug = "".join(ch for ch in str(opt["code"]) if ch.isalnum())
            comps = "-".join(str(c) for c in opt["components"][:8])
            variant = None
            for c in opt["components"]:
                s = str(c)
                if len(s) >= 2 and s[0] != "0":
                    variant = s[-1]
                    break
            for g, (mn, mx) in bands.items():
                gid = f"sgb-{syllabus}-{series_code}-{opt_slug}-{comps}-{mod.grade_id_suffix(g)}"
                rows.append(
                    "("
                    + ", ".join(
                        [
                            mod.sql_str(gid),
                            mod.sql_str(subject_id),
                            str(year),
                            mod.sql_str(series_name),
                            "NULL" if variant is None else mod.sql_str(variant),
                            "NULL",
                            mod.sql_str(g),
                            str(mn),
                            str(mx),
                            "strftime('%s', 'now') * 1000",
                        ]
                    )
                    + ")"
                )

    if not rows:
        write_stub("Option tables parsed but no composite rows emitted.")
        return

    parts = [
        "-- CAIE A Level syllabus-level composite thresholds (option tables from official PDFs).\n"
    ]
    for i in range(0, len(rows), 60):
        chunk = rows[i : i + 60]
        parts.append(
            "INSERT OR IGNORE INTO subject_grade_boundaries (id, subject_id, year, series, variant, tier, grade, min_mark, max_mark, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )
    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"Wrote {OUT} rows={len(rows)}")


if __name__ == "__main__":
    main()
