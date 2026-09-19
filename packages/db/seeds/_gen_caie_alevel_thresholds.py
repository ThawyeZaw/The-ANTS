"""Generate CAIE A Level paper + boundary seed SQL from official Cambridge PDFs."""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CIE = ROOT / "pdfs" / "CIE"
OUT = ROOT / "0023_caie_alevel_grade_thresholds.sql"

spec = importlib.util.spec_from_file_location("caie_gb", ROOT / "_gen_grade_thresholds.py")
assert spec and spec.loader
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

SUBJECTS = {
    "9709": ("subj-caie-al-maths", "Mathematics"),
    "9231": ("subj-caie-al-fmaths", "Further Mathematics"),
    "9702": ("subj-caie-al-phys", "Physics"),
    "9701": ("subj-caie-al-chem", "Chemistry"),
    "9700": ("subj-caie-al-bio", "Biology"),
    "9618": ("subj-caie-al-cs", "Computer Science"),
    "9626": ("subj-caie-al-it", "Information Technology"),
    "9708": ("subj-caie-al-econ", "Economics"),
    "9609": ("subj-caie-al-biz", "Business"),
    "9706": ("subj-caie-al-acc", "Accounting"),
    "9093": ("subj-caie-al-eng-lang", "English Language"),
    "9695": ("subj-caie-al-lit", "Literature in English"),
}

DURATIONS: dict[str, dict[str, int]] = {
    "9709": {"1": 75, "2": 75, "3": 75, "4": 75, "5": 75},
    "9702": {"1": 60, "2": 75, "3": 120, "4": 60, "5": 75},
    "9701": {"1": 60, "2": 75, "3": 120, "4": 60, "5": 75},
    "9700": {"1": 60, "2": 75, "3": 120, "4": 60, "5": 75},
    "9618": {"1": 75, "2": 75, "3": 75, "4": 75},
    "9626": {"1": 105, "2": 105, "3": 105, "4": 105},
}

PAPER_TITLES: dict[str, dict[str, str]] = {
    "9709": {
        "1": "Paper 1 Pure Mathematics 1",
        "2": "Paper 2 Pure Mathematics 2",
        "3": "Paper 3 Pure Mathematics 3",
        "4": "Paper 4 Mechanics",
        "5": "Paper 5 Probability & Statistics 1",
    },
    "9702": {
        "1": "Paper 1 Multiple Choice",
        "2": "Paper 2 AS Structured Questions",
        "3": "Paper 3 Advanced Practical Skills",
        "4": "Paper 4 A Level Structured Questions",
        "5": "Paper 5 Planning, Analysis and Evaluation",
    },
    "9701": {
        "1": "Paper 1 Multiple Choice",
        "2": "Paper 2 AS Structured Questions",
        "3": "Paper 3 Advanced Practical Skills",
        "4": "Paper 4 A Level Structured Questions",
        "5": "Paper 5 Planning, Analysis and Evaluation",
    },
    "9700": {
        "1": "Paper 1 Multiple Choice",
        "2": "Paper 2 AS Structured Questions",
        "3": "Paper 3 Advanced Practical Skills",
        "4": "Paper 4 A Level Structured Questions",
        "5": "Paper 5 Planning, Analysis and Evaluation",
    },
    "9618": {
        "1": "Paper 1 Theory Fundamentals",
        "2": "Paper 2 Fundamental Problem-solving",
        "3": "Paper 3 Advanced Theory",
        "4": "Paper 4 Practical",
    },
    "9626": {
        "1": "Paper 1 Theory",
        "2": "Paper 2 Practical",
        "3": "Paper 3 Advanced Theory",
        "4": "Paper 4 Advanced Practical",
    },
}


def discover_pdfs() -> list[Path]:
    matches: list[Path] = []
    for path in sorted(CIE.glob("*.pdf")):
        name = path.name.lower()
        if "igcse" in name or "syllabus" in name or "timetable" in name:
            continue
        if "grade" in name and any(token in name for token in ("al", "a-level", "alevel", "as-a")):
            matches.append(path)
        elif "gradeboundaries" in name.replace("_", "") and "igcse" not in name:
            matches.append(path)
    return matches


def syllabus_from_header(text: str) -> str | None:
    m = re.search(r"Syllabus\s+(\d{4})", text)
    if m:
        return m.group(1)
    m = re.search(
        r"Cambridge International AS & A Level.{0,200}?\((\d{4})\)",
        text,
        re.DOTALL,
    )
    if m:
        return m.group(1)
    m = re.search(
        r"Cambridge International A Level.{0,200}?\((\d{4})\)",
        text,
        re.DOTALL,
    )
    return m.group(1) if m else None


def paper_meta(syllabus: str, comp: str):
    paper_number = comp[0]
    variant = comp[1] if len(comp) > 1 else None
    base = PAPER_TITLES.get(syllabus, {}).get(paper_number, f"Paper {paper_number}")
    title = f"{base} Variant {variant}" if variant else base
    duration = DURATIONS.get(syllabus, {}).get(paper_number)
    return paper_number, variant, title, duration


def write_stub(reason: str) -> None:
    note = (
        "-- CAIE A Level grade thresholds.\n"
        f"-- {reason}\n"
        "-- Add official A Level grade-boundary PDFs under packages/db/seeds/pdfs/CIE/\n"
        "-- (e.g. GradeBoundaries_AL_2024_March_to_2025_March.pdf) and re-run:\n"
        "--   python packages/db/seeds/_gen_caie_alevel_thresholds.py\n"
        "SELECT 1 WHERE 0;\n"
    )
    OUT.write_text(note, encoding="utf-8")
    print(f"Wrote stub {OUT}")


def main() -> None:
    pdfs = discover_pdfs()
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
            syllabus = syllabus_from_header(text)
            comps = mod.extract_component_rows(text)
            opts = mod.extract_option_rows(text)

            if cont and pending:
                if not syllabus:
                    syllabus = pending[0]
                if not season_year:
                    season_year = (pending[1], pending[2])

            if not syllabus or syllabus not in SUBJECTS:
                continue
            if not season_year:
                if pending and syllabus == pending[0]:
                    season_year = (pending[1], pending[2])
                else:
                    continue

            season, year = season_year
            key = (syllabus, season, year)
            bucket = sessions.setdefault(key, {"components": {}, "options": []})
            for code, total, gmap in comps:
                bucket["components"][code] = {"total": total, "grades": gmap}
            existing = {(o["code"], tuple(o["components"])) for o in bucket["options"]}
            for o in opts:
                sig = (o["code"], tuple(o["components"]))
                if sig not in existing:
                    bucket["options"].append(o)
                    existing.add(sig)
            pending = (syllabus, season, year)

    if not sessions:
        write_stub(f"Found {len(pdfs)} candidate PDF(s) but no parseable A Level sessions.")
        return

    papers_sql: list[str] = []
    bounds_sql: list[str] = []
    paper_count = 0
    bound_count = 0

    for (syllabus, season, year) in sorted(sessions.keys(), key=lambda k: (k[0], k[2], k[1])):
        subject_id, subject_name = SUBJECTS[syllabus]
        series_name, series_letter = mod.SERIES_MAP[season]
        series_code = f"{series_letter}{str(year)[2:]}"
        data = sessions[(syllabus, season, year)]

        for comp in sorted(data["components"].keys()):
            info = data["components"][comp]
            total = info["total"]
            published = info["grades"]
            astar = mod.derive_astar(comp, published.get("A"), total, data["options"])
            bands = mod.build_bands(total, published, astar)

            paper_number, variant, title, duration = paper_meta(syllabus, comp)
            pp_id = f"pp-{syllabus}-{series_code}-qp-{comp}"
            dur_sql = "NULL" if duration is None else str(duration)

            papers_sql.append(
                "("
                + ", ".join(
                    [
                        mod.sql_str(pp_id),
                        mod.sql_str("CAIE"),
                        mod.sql_str("A Level"),
                        mod.sql_str(subject_name),
                        mod.sql_str(syllabus),
                        mod.sql_str(subject_id),
                        mod.sql_str("curr-caie-alevel"),
                        str(year),
                        mod.sql_str(series_name),
                        mod.sql_str(paper_number),
                        mod.sql_str(variant) if variant else "NULL",
                        mod.sql_str(title),
                        str(total),
                        dur_sql,
                        "strftime('%s', 'now') * 1000",
                    ]
                )
                + ")"
            )
            paper_count += 1

            for g in mod.ALL_GRADES:
                if g not in bands:
                    continue
                mn, mx = bands[g]
                if mx < mn or mn > total:
                    continue
                gb_id = f"gb-{syllabus}-{series_code}-{comp}-{mod.grade_id_suffix(g)}"
                bounds_sql.append(
                    "("
                    + ", ".join(
                        [
                            mod.sql_str(gb_id),
                            mod.sql_str(pp_id),
                            mod.sql_str(g),
                            str(mn),
                            str(mx),
                            "NULL",
                            "NULL",
                            "strftime('%s', 'now') * 1000",
                        ]
                    )
                    + ")"
                )
                bound_count += 1

    def chunked(items: list[str], n: int):
        for i in range(0, len(items), n):
            yield items[i : i + n]

    parts: list[str] = ["-- CAIE A Level per-paper thresholds (generated from official PDFs).\n"]
    for chunk in chunked(papers_sql, 40):
        parts.append(
            "INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )
    for chunk in chunked(bounds_sql, 60):
        parts.append(
            "INSERT OR IGNORE INTO paper_grade_boundaries (id, past_paper_id, grade, min_mark, max_mark, ums_min, ums_max, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )

    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"papers={paper_count} boundaries={bound_count} sessions={len(sessions)} pdfs={len(pdfs)}")


if __name__ == "__main__":
    main()
