"""Generate CAIE IGCSE subject-level composite thresholds from official PDFs."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("caie_gb", ROOT / "_gen_grade_thresholds.py")
assert spec and spec.loader
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

OUT = ROOT / "0025_caie_igcse_subject_composites.sql"


def main():
    sessions: dict[tuple, dict] = {}
    for path in mod.PDFS:
        if not Path(path).exists():
            alt = ROOT / "pdfs" / "CIE" / Path(path).name
            path = alt if alt.exists() else path
        if not Path(path).exists():
            continue
        doc = mod.fitz.open(path)
        pending = None
        for pi in range(doc.page_count):
            text = doc[pi].get_text()
            cont = "continued" in text.lower() and "grade thresholds" in text.lower()
            season_year = mod.series_from_header(text)
            syllabus = mod.syllabus_from_header(text)
            opts = mod.extract_option_rows(text)
            if cont and pending:
                if not syllabus:
                    syllabus = pending[0]
                if not season_year:
                    season_year = (pending[1], pending[2])
            if not syllabus or syllabus not in mod.SUBJECTS:
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

    rows: list[str] = []
    for (syllabus, season, year) in sorted(sessions.keys(), key=lambda k: (k[0], k[2], k[1])):
        subject_id, _ = mod.SUBJECTS[syllabus]
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
            comps = "-".join(
                (str(c).zfill(2) if str(c).isdigit() else str(c)) for c in opt["components"][:6]
            )
            variant = None
            for c in opt["components"]:
                s = str(c).zfill(2) if str(c).isdigit() else str(c)
                if len(s) >= 2 and s[0] != "0":
                    variant = s[-1]
                    break
            tier = None
            if syllabus in ("0580", "0610", "0620", "0625"):
                bases = {
                    (str(c).zfill(2) if str(c).isdigit() else str(c))[:1]
                    for c in opt["components"]
                    if (str(c).zfill(2) if str(c).isdigit() else str(c))[:1] in "1234"
                }
                if bases & {"1", "3"}:
                    tier = "core"
                elif bases & {"2", "4"}:
                    tier = "extended"
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
                            "NULL" if tier is None else mod.sql_str(tier),
                            mod.sql_str(g),
                            str(mn),
                            str(mx),
                            "strftime('%s', 'now') * 1000",
                        ]
                    )
                    + ")"
                )

    parts = [
        "-- CAIE IGCSE syllabus-level composite thresholds (option tables from official PDFs).\n"
        "-- Overall A*–G are weighted syllabus marks, not raw paper totals.\n"
        "-- Re-run: python packages/db/seeds/_gen_caie_igcse_composites.py\n"
        "DELETE FROM subject_grade_boundaries WHERE subject_id LIKE 'subj-caie-igcse-%';\n"
    ]
    for i in range(0, len(rows), 60):
        chunk = rows[i : i + 60]
        parts.append(
            "INSERT OR IGNORE INTO subject_grade_boundaries (id, subject_id, year, series, variant, tier, grade, min_mark, max_mark, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )
    OUT.write_text("".join(parts) if len(parts) > 1 else parts[0] + "SELECT 1 WHERE 0;\n", encoding="utf-8")
    print(f"Wrote {OUT} rows={len(rows)}")


if __name__ == "__main__":
    main()
