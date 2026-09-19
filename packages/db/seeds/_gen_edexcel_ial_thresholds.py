"""Generate Edexcel IAL past-paper + UMS boundary seed SQL from official Pearson PDFs."""
from __future__ import annotations

import re
from pathlib import Path

import pymupdf as fitz

PDF_DIR = Path(__file__).with_name("pdfs") / "Edexcel"
OUT = Path(__file__).with_name("0024_edexcel_ial_grade_thresholds.sql")

MIN_YEAR = 2022
MAX_YEAR = 2026

UNITS: dict[str, tuple[str, str]] = {
    "WMA11": ("subj-edx-ial-pure1", "Pure Mathematics 1"),
    "WMA12": ("subj-edx-ial-pure2", "Pure Mathematics 2"),
    "WMA13": ("subj-edx-ial-pure3", "Pure Mathematics 3"),
    "WMA14": ("subj-edx-ial-pure4", "Pure Mathematics 4"),
    "WME01": ("subj-edx-ial-mech1", "Mechanics M1"),
    "WME02": ("subj-edx-ial-mech2", "Mechanics M2"),
    "WME03": ("subj-edx-ial-mech3", "Mechanics M3"),
    "WST01": ("subj-edx-ial-stat1", "Statistics S1"),
    "WST02": ("subj-edx-ial-stat2", "Statistics S2"),
    "WST03": ("subj-edx-ial-stat3", "Statistics S3"),
    "WFM01": ("subj-edx-ial-fmath1", "Further Pure F1"),
    "WFM02": ("subj-edx-ial-fmath2", "Further Pure F2"),
    "WFM03": ("subj-edx-ial-fmath3", "Further Pure F3"),
    "WDM11": ("subj-edx-ial-dec1", "Decision Mathematics D1"),
    "WPH11": ("subj-edx-ial-phys1", "Physics Unit 1"),
    "WPH12": ("subj-edx-ial-phys2", "Physics Unit 2"),
    "WPH13": ("subj-edx-ial-phys3", "Physics Unit 3"),
    "WPH14": ("subj-edx-ial-phys4", "Physics Unit 4"),
    "WPH15": ("subj-edx-ial-phys5", "Physics Unit 5"),
    "WPH16": ("subj-edx-ial-phys6", "Physics Unit 6"),
    "WCH11": ("subj-edx-ial-chem1", "Chemistry Unit 1"),
    "WCH12": ("subj-edx-ial-chem2", "Chemistry Unit 2"),
    "WCH13": ("subj-edx-ial-chem3", "Chemistry Unit 3"),
    "WCH14": ("subj-edx-ial-chem4", "Chemistry Unit 4"),
    "WCH15": ("subj-edx-ial-chem5", "Chemistry Unit 5"),
    "WCH16": ("subj-edx-ial-chem6", "Chemistry Unit 6"),
    "WBI11": ("subj-edx-ial-bio1", "Biology Unit 1"),
    "WBI12": ("subj-edx-ial-bio2", "Biology Unit 2"),
    "WBI13": ("subj-edx-ial-bio3", "Biology Unit 3"),
    "WBI14": ("subj-edx-ial-bio4", "Biology Unit 4"),
    "WBI15": ("subj-edx-ial-bio5", "Biology Unit 5"),
    "WBI16": ("subj-edx-ial-bio6", "Biology Unit 6"),
    "WEC11": ("subj-edx-ial-econ1", "Economics Unit 1"),
    "WEC12": ("subj-edx-ial-econ2", "Economics Unit 2"),
    "WEC13": ("subj-edx-ial-econ3", "Economics Unit 3"),
    "WEC14": ("subj-edx-ial-econ4", "Economics Unit 4"),
    "WBS11": ("subj-edx-ial-biz1", "Business Unit 1"),
    "WBS12": ("subj-edx-ial-biz2", "Business Unit 2"),
    "WBS13": ("subj-edx-ial-biz3", "Business Unit 3"),
    "WBS14": ("subj-edx-ial-biz4", "Business Unit 4"),
    "WAC11": ("subj-edx-ial-acc1", "Accounting Unit 1"),
    "WAC12": ("subj-edx-ial-acc2", "Accounting Unit 2"),
    "WPS01": ("subj-edx-ial-psych1", "Psychology Unit 1"),
    "WPS02": ("subj-edx-ial-psych2", "Psychology Unit 2"),
    "WPS03": ("subj-edx-ial-psych3", "Psychology Unit 3"),
    "WPS04": ("subj-edx-ial-psych4", "Psychology Unit 4"),
    "WIT11": ("subj-edx-ial-it1", "IT Unit 1"),
    "WIT12": ("subj-edx-ial-it2", "IT Unit 2"),
    "WIT13": ("subj-edx-ial-it3", "IT Unit 3"),
    "WIT14": ("subj-edx-ial-it4", "IT Unit 4"),
    "WCP01": ("subj-edx-ial-cs1", "Computer Science Unit 1"),
    "WCP02": ("subj-edx-ial-cs2", "Computer Science Unit 2"),
    "WCP03": ("subj-edx-ial-cs3", "Computer Science Unit 3"),
    "WCP04": ("subj-edx-ial-cs4", "Computer Science Unit 4"),
    "WEN01": ("subj-edx-ial-eng1", "English Language Unit 1"),
    "WEN02": ("subj-edx-ial-eng2", "English Language Unit 2"),
    "WEN03": ("subj-edx-ial-eng3", "English Language Unit 3"),
    "WEN04": ("subj-edx-ial-eng4", "English Language Unit 4"),
    "WET01": ("subj-edx-ial-lit1", "English Literature Unit 1"),
    "WET02": ("subj-edx-ial-lit2", "English Literature Unit 2"),
    "WET03": ("subj-edx-ial-lit3", "English Literature Unit 3"),
    "WET04": ("subj-edx-ial-lit4", "English Literature Unit 4"),
}

SERIES_MAP = {
    "January": ("Jan", "j"),
    "June": ("May/June", "s"),
    "October": ("Oct/Nov", "w"),
    "November": ("Oct/Nov", "w"),
}

DASH = re.compile(r"^[\-\u2013\u2014\u2212\ufffd\u00ad•·]+$")
UNIT_RE = re.compile(r"^(W[A-Z]{2}\d{2})$")


def parse_num(tok: str) -> int | None:
    tok = tok.strip()
    if not tok or DASH.match(tok):
        return None
    if tok.isdigit():
        return int(tok)
    return None


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def grade_id_suffix(grade: str) -> str:
    return "Astar" if grade == "A*" else grade


def is_ial_pdf(path: Path) -> bool:
    name = path.name.lower()
    if "intgcse" in name or "int-gcse" in name or "international-gcse" in name:
        return False
    if "modular" in name and "ial" not in name:
        return False
    return "ial" in name or "international-advanced" in name or "international as" in name


def series_from_text(text: str, filename: str) -> tuple[str, int] | None:
    m = re.search(r"(January|June|October|November)\s+(\d{4})", text)
    if m:
        return m.group(1), int(m.group(2))
    fn = filename.lower()
    m = re.search(r"(january|june|october|november)[^\d]*(\d{4})", fn)
    if m:
        return m.group(1).capitalize(), int(m.group(2))
    m = re.search(r"(\d{2})(\d{2})[-_]", filename)
    if m:
        yy, mm = int(m.group(1)), int(m.group(2))
        year = 2000 + yy
        month_map = {1: "January", 6: "June", 10: "October", 11: "November"}
        if mm in month_map:
            return month_map[mm], year
    return None


def tokenize_lines(text: str) -> list[str]:
    text = text.replace("\u00a0", " ")
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    return [ln for ln in lines if ln]


def parse_unit_blocks(text: str) -> list[dict]:
    lines = tokenize_lines(text)
    out: list[dict] = []
    i = 0
    while i < len(lines):
        m = UNIT_RE.match(lines[i])
        if not m:
            i += 1
            continue
        code = m.group(1)
        if code not in UNITS:
            i += 1
            continue
        title = lines[i + 1] if i + 1 < len(lines) else ""
        if re.search(r"Unit\s+\d+A\b", title):
            i += 1
            continue
        j = i + 1
        raw_nums: list[int] = []
        ums_nums: list[int] = []
        while j < len(lines) and lines[j] != "Raw":
            if UNIT_RE.match(lines[j]) or lines[j].startswith("Cash-in"):
                break
            j += 1
        if j >= len(lines) or lines[j] != "Raw":
            i += 1
            continue
        j += 1
        while j < len(lines):
            n = parse_num(lines[j])
            if n is None:
                break
            raw_nums.append(n)
            j += 1
        if j >= len(lines) or lines[j] != "UMS":
            i += 1
            continue
        j += 1
        while j < len(lines):
            n = parse_num(lines[j])
            if n is None:
                break
            ums_nums.append(n)
            j += 1
        if len(raw_nums) < 6 or len(ums_nums) != len(raw_nums):
            i += 1
            continue
        raw_max = raw_nums[0]
        ums_max = ums_nums[0]
        raw_bounds = raw_nums[1:]
        ums_bounds = ums_nums[1:]
        if len(raw_bounds) == 6:
            grades = ["A*", "A", "B", "C", "D", "E", "U"]
            # AS units publish a–e–u only; insert a theoretical A* = A
            grades = ["A", "B", "C", "D", "E", "U"]
        elif len(raw_bounds) == 7:
            grades = ["A*", "A", "B", "C", "D", "E", "U"]
        else:
            i += 1
            continue
        bands = []
        for idx, g in enumerate(grades):
            mn = raw_bounds[idx]
            ums_min = ums_bounds[idx]
            if idx == 0:
                mx = raw_max
                ums_hi = ums_max
            else:
                mx = raw_bounds[idx - 1] - 1
                ums_hi = ums_bounds[idx - 1] - 1
            if mx < mn:
                mx = mn
            if ums_hi < ums_min:
                ums_hi = ums_min
            bands.append((g, mn, mx, ums_min, ums_hi))
        out.append(
            {
                "code": code,
                "title": title or UNITS[code][1],
                "raw_max": raw_max,
                "ums_max": ums_max,
                "bands": bands,
            }
        )
        i = j
    return out


def chunked(items: list[str], n: int):
    for i in range(0, len(items), n):
        yield items[i : i + n]


def main():
    seen: set[tuple] = set()
    papers_sql: list[str] = []
    bounds_sql: list[str] = []
    paper_count = 0
    bound_count = 0

    for path in sorted(PDF_DIR.glob("*.pdf")):
        if not is_ial_pdf(path):
            continue
        doc = fitz.open(path)
        text = "".join(doc[i].get_text("text") for i in range(doc.page_count))
        season_year = series_from_text(text, path.name)
        if not season_year:
            continue
        season, year = season_year
        if year < MIN_YEAR or year > MAX_YEAR or season not in SERIES_MAP:
            continue
        series_name, series_letter = SERIES_MAP[season]
        series_code = f"{series_letter}{str(year)[2:]}"
        for unit in parse_unit_blocks(text):
            key = (unit["code"], series_code)
            if key in seen:
                continue
            seen.add(key)
            subject_id, subject_name = UNITS[unit["code"]]
            code = unit["code"]
            pp_id = f"pp-{code.lower()}-{series_code}-qp-01"
            papers_sql.append(
                "("
                + ", ".join(
                    [
                        sql_str(pp_id),
                        sql_str("Edexcel"),
                        sql_str("IAL"),
                        sql_str(subject_name),
                        sql_str(code),
                        sql_str(subject_id),
                        sql_str("curr-edexcel-ial"),
                        str(year),
                        sql_str(series_name),
                        sql_str("01"),
                        "NULL",
                        sql_str(unit["title"] or subject_name),
                        str(unit["raw_max"]),
                        "NULL",
                        "strftime('%s', 'now') * 1000",
                    ]
                )
                + ")"
            )
            paper_count += 1
            for g, mn, mx, ums_min, ums_max in unit["bands"]:
                gb_id = f"gb-{code.lower()}-{series_code}-01-{grade_id_suffix(g)}"
                bounds_sql.append(
                    "("
                    + ", ".join(
                        [
                            sql_str(gb_id),
                            sql_str(pp_id),
                            sql_str(g),
                            str(mn),
                            str(mx),
                            str(ums_min),
                            str(ums_max),
                            "strftime('%s', 'now') * 1000",
                        ]
                    )
                    + ")"
                )
                bound_count += 1

    parts: list[str] = [
        "-- Edexcel IAL unit papers + UMS boundaries (official Pearson PDFs).\n",
    ]
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
    print(f"Wrote {OUT} papers={paper_count} boundaries={bound_count} units={len(seen)}")


if __name__ == "__main__":
    main()
