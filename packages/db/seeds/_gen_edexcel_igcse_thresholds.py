"""Generate Edexcel IGCSE grade-threshold seed SQL from official Pearson PDFs."""
from __future__ import annotations

import re
from pathlib import Path

import pymupdf as fitz

PDF_DIR = Path(__file__).with_name("pdfs") / "Edexcel"
OUT = Path(__file__).with_name("0022_edexcel_igcse_grade_thresholds.sql")

MIN_YEAR = 2022
MAX_YEAR = 2026

SUBJECTS = {
    "4MA1": ("subj-edx-igcse-maths-a", "Mathematics A"),
    "4MB1": ("subj-edx-igcse-maths-b", "Mathematics B"),
    "4PM1": ("subj-edx-igcse-fmaths", "Further Pure Mathematics"),
    "4PH1": ("subj-edx-igcse-phys", "Physics"),
    "4CH1": ("subj-edx-igcse-chem", "Chemistry"),
    "4BI1": ("subj-edx-igcse-bio", "Biology"),
    "4HB1": ("subj-edx-igcse-human-bio", "Human Biology"),
    "4CP0": ("subj-edx-igcse-cs", "Computer Science"),
    "4IT1": ("subj-edx-igcse-ict", "Information and Communication Technology"),
    "4EB1": ("subj-edx-igcse-eng-b", "English Language B"),
    "4ES1": ("subj-edx-igcse-esl", "English as a Second Language"),
    "4EC1": ("subj-edx-igcse-econ", "Economics"),
    "4BS1": ("subj-edx-igcse-biz", "Business"),
    "4AC1": ("subj-edx-igcse-acc", "Accounting"),
}

# (title, total_marks, duration_minutes)
PAPER_META: dict[str, dict[str, tuple[str, int, int | None]]] = {
    "4MA1": {
        "1F": ("Mathematics A Foundation Paper 1F", 100, 120),
        "2F": ("Mathematics A Foundation Paper 2F", 100, 120),
        "1H": ("Mathematics A Higher Paper 1H", 100, 120),
        "2H": ("Mathematics A Higher Paper 2H", 100, 120),
        "1FR": ("Mathematics A Foundation Paper 1FR", 100, 120),
        "2FR": ("Mathematics A Foundation Paper 2FR", 100, 120),
        "1HR": ("Mathematics A Higher Paper 1HR", 100, 120),
        "2HR": ("Mathematics A Higher Paper 2HR", 100, 120),
    },
    "4MB1": {
        "01": ("Mathematics B Paper 1", 150, 150),
        "02": ("Mathematics B Paper 2", 150, 150),
        "01R": ("Mathematics B Paper 1R", 150, 150),
        "02R": ("Mathematics B Paper 2R", 150, 150),
    },
    "4PM1": {
        "01": ("Further Pure Mathematics Paper 1", 100, 120),
        "02": ("Further Pure Mathematics Paper 2", 100, 120),
        "01R": ("Further Pure Mathematics Paper 1R", 100, 120),
        "02R": ("Further Pure Mathematics Paper 2R", 100, 120),
    },
    "4PH1": {
        "1P": ("Physics Paper 1P", 110, 120),
        "2P": ("Physics Paper 2P", 70, 75),
        "1PR": ("Physics Paper 1PR", 110, 120),
        "2PR": ("Physics Paper 2PR", 70, 75),
    },
    "4CH1": {
        "1C": ("Chemistry Paper 1C", 110, 120),
        "2C": ("Chemistry Paper 2C", 70, 75),
        "1CR": ("Chemistry Paper 1CR", 110, 120),
        "2CR": ("Chemistry Paper 2CR", 70, 75),
    },
    "4BI1": {
        "1B": ("Biology Paper 1B", 110, 120),
        "2B": ("Biology Paper 2B", 70, 75),
        "1BR": ("Biology Paper 1BR", 110, 120),
        "2BR": ("Biology Paper 2BR", 70, 75),
    },
    "4HB1": {
        "01": ("Human Biology Paper 1", 110, 120),
        "02": ("Human Biology Paper 2", 70, 75),
        "01R": ("Human Biology Paper 1R", 110, 120),
        "02R": ("Human Biology Paper 2R", 70, 75),
    },
    "4CP0": {
        "01": ("Computer Science Paper 1", 80, 120),
        "02": ("Computer Science Paper 2", 80, 120),
    },
    "4IT1": {
        "01": ("ICT Paper 1: Written Paper", 100, 90),
        "02": ("ICT Paper 2: Practical Exam", 100, 180),
        "01R": ("ICT Paper 1R: Written Paper", 100, 90),
        "02R": ("ICT Paper 2R: Practical Exam", 100, 180),
    },
    "4EB1": {
        "01": ("English Language B Paper 1", 100, 135),
        "01R": ("English Language B Paper 1R", 100, 135),
    },
    "4ES1": {
        "01": ("English as a Second Language Paper 1", 75, 120),
        "02": ("English as a Second Language Paper 2", 75, 120),
        "03": ("English as a Second Language Paper 3 (Speaking)", 40, 45),
        "01R": ("English as a Second Language Paper 1R", 75, 120),
        "02R": ("English as a Second Language Paper 2R", 75, 120),
    },
    "4EC1": {
        "01": ("Economics Paper 1: Microeconomics and Business Economics", 80, 90),
        "02": ("Economics Paper 2: Macroeconomics and the Global Economy", 80, 90),
        "01R": ("Economics Paper 1R", 80, 90),
        "02R": ("Economics Paper 2R", 80, 90),
        "1C": ("Economics Paper 1C", 80, 90),
        "2C": ("Economics Paper 2C", 80, 90),
        "1CR": ("Economics Paper 1CR", 80, 90),
        "2CR": ("Economics Paper 2CR", 80, 90),
    },
    "4BS1": {
        "01": ("Business Paper 1: Investigating small businesses", 80, 90),
        "02": ("Business Paper 2: Investigating large businesses", 80, 90),
        "01R": ("Business Paper 1R", 80, 90),
        "02R": ("Business Paper 2R", 80, 90),
        "1C": ("Business Paper 1C", 80, 90),
        "2C": ("Business Paper 2C", 80, 90),
        "1CR": ("Business Paper 1CR", 80, 90),
        "2CR": ("Business Paper 2CR", 80, 90),
    },
    "4AC1": {
        "01": ("Accounting Paper 1: Introduction to Bookkeeping & Accounting", 100, 120),
        "02": ("Accounting Paper 2: Financial Statements", 50, 75),
        "01R": ("Accounting Paper 1R", 100, 120),
        "02R": ("Accounting Paper 2R", 50, 75),
    },
}

SERIES_MAP = {
    "January": ("Jan", "j"),
    "June": ("May/June", "s"),
    "November": ("Oct/Nov", "w"),
    "March": ("Feb/March", "m"),
}

GRADES_91 = ["9", "8", "7", "6", "5", "4", "3", "2", "1", "U"]
DASH = re.compile(r"^[\-\u2013\u2014\u2212\ufffd\u00ad•·]+$")


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


def slug(s: str) -> str:
    return re.sub(r"[^0-9A-Za-z]+", "", s)


def series_from_text(text: str, filename: str) -> tuple[str, int] | None:
    m = re.search(r"(January|June|November|March)\s+(\d{4})", text)
    if m:
        return m.group(1), int(m.group(2))
    fn = filename.lower()
    m = re.search(r"(january|june|november|march)[^\d]*(\d{4})", fn)
    if m:
        return m.group(1).capitalize(), int(m.group(2))
    m = re.search(r"(\d{2})(\d{2})[-_]", filename)
    if m:
        yy, mm = int(m.group(1)), int(m.group(2))
        year = 2000 + yy
        month_map = {
            1: "January",
            6: "June",
            11: "November",
            3: "March",
        }
        if mm in month_map:
            return month_map[mm], year
    return None


def is_boundary_pdf(path: Path) -> bool:
    name = path.name.lower()
    if "modular" in name or "timetable" in name or "spec" in name or "ial" in name:
        return False
    return (
        "grade-boundar" in name
        or "subject_grade" in name.lower()
        or re.search(r"\d{4}[-_]intgcse", name) is not None
        or name.startswith(("220", "230", "240", "250", "2511"))
    )


def tokenize_lines(text: str) -> list[str]:
    text = text.replace("\u00a0", " ")
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    return [ln for ln in lines if ln]


def infer_paper_meta(code: str, paper: str, route_total: int, route_papers: list[str]) -> tuple[str, int, int | None]:
    meta = PAPER_META.get(code, {}).get(paper)
    if meta:
        return meta
    share = max(1, route_total // max(1, len(route_papers)))
    return (f"{SUBJECTS[code][1]} Paper {paper}", share, None)


def route_tier(label: str) -> str | None:
    low = label.lower()
    if "foundation" in low:
        return "core"
    if "higher" in low:
        return "extended"
    return None


def route_variant(papers: list[str]) -> str | None:
    if any(p.endswith("R") or "R" in p for p in papers):
        return "R"
    return None


def route_key(papers: list[str]) -> str:
    return "-".join(papers)


def papers_known(code: str, papers: list[str]) -> bool:
    meta = PAPER_META.get(code)
    if not meta:
        return True
    return all(p in meta for p in papers)


def build_bands_91(total: int, thresholds: dict[str, int | None]) -> dict[str, tuple[int, int]]:
    ordered = [g for g in GRADES_91 if thresholds.get(g) is not None]
    cleaned: dict[str, int] = {}
    prev = total + 1
    for g in ordered:
        v = thresholds[g]
        assert v is not None
        if v >= prev:
            v = prev - 1
        if v < 0:
            continue
        cleaned[g] = v
        prev = v
    if not cleaned:
        return {"U": (0, total)}
    bands: dict[str, tuple[int, int]] = {}
    grades = [g for g in GRADES_91 if g in cleaned]
    for idx, g in enumerate(grades):
        mn = cleaned[g]
        mx = total if idx == 0 else cleaned[grades[idx - 1]] - 1
        if mx < mn:
            mx = mn
        bands[g] = (mn, mx)
    lowest = min(cleaned.values())
    u_max = lowest - 1
    if u_max >= 0:
        bands["U"] = (0, u_max)
    return bands


def parse_route_entries(text: str) -> list[dict]:
    lines = tokenize_lines(text)
    entries: list[dict] = []
    i = 0
    while i < len(lines):
        code = lines[i]
        if code not in SUBJECTS:
            i += 1
            continue
        label_parts: list[str] = []
        i += 1
        while i < len(lines) and lines[i] != "Subject":
            label_parts.append(lines[i])
            i += 1
        if i >= len(lines) or lines[i] != "Subject":
            continue
        i += 1
        if i >= len(lines):
            break
        total = parse_num(lines[i])
        if total is None:
            continue
        i += 1
        nums: list[int] = []
        while i < len(lines):
            if lines[i].startswith("Paper(s)"):
                break
            n = parse_num(lines[i])
            if n is None:
                break
            nums.append(n)
            i += 1
        if i >= len(lines) or not lines[i].startswith("Paper(s)"):
            continue
        m = re.search(r"Paper\(s\)\s+(.+)$", lines[i])
        if not m:
            i += 1
            continue
        papers = m.group(1).split()
        i += 1
        if len(nums) < 2 or not papers_known(code, papers):
            continue
        grade_vals = nums[:-1]
        grade_labels = GRADES_91[: len(grade_vals)]
        thresholds = {g: v for g, v in zip(grade_labels, grade_vals)}
        thresholds["U"] = nums[-1]
        label = " ".join(label_parts).strip() or SUBJECTS[code][1]
        entries.append(
            {
                "code": code,
                "label": label,
                "total": total,
                "thresholds": thresholds,
                "papers": papers,
                "tier": route_tier(label),
                "variant": route_variant(papers),
            }
        )
    return entries


def chunked(items: list[str], n: int):
    for i in range(0, len(items), n):
        yield items[i : i + n]


def main():
    sessions: dict[tuple, list[dict]] = {}
    seen_routes: set[tuple] = set()

    for path in sorted(PDF_DIR.glob("*.pdf")):
        if not is_boundary_pdf(path):
            continue
        doc = fitz.open(path)
        text = "".join(doc[i].get_text("text") for i in range(doc.page_count))
        season_year = series_from_text(text, path.name)
        if not season_year:
            continue
        season, year = season_year
        if year < MIN_YEAR or year > MAX_YEAR:
            continue
        if season not in SERIES_MAP:
            continue
        for entry in parse_route_entries(text):
            key = (entry["code"], season, year, route_key(entry["papers"]))
            if key in seen_routes:
                continue
            seen_routes.add(key)
            sessions.setdefault((entry["code"], season, year), []).append(entry)

    papers_sql: list[str] = []
    paper_bounds_sql: list[str] = []
    subject_bounds_sql: list[str] = []
    paper_ids: set[str] = set()
    paper_count = 0
    paper_bound_count = 0
    subject_bound_count = 0

    for (code, season, year) in sorted(sessions.keys(), key=lambda k: (k[0], k[2], k[1])):
        subject_id, subject_name = SUBJECTS[code]
        series_name, series_letter = SERIES_MAP[season]
        series_code = f"{series_letter}{str(year)[2:]}"

        for entry in sessions[(code, season, year)]:
            papers = entry["papers"]
            bands = build_bands_91(entry["total"], entry["thresholds"])
            rk = route_key(papers)

            for paper in papers:
                title, total_marks, duration = infer_paper_meta(code, paper, entry["total"], papers)
                pp_id = f"pp-{code.lower()}-{series_code}-qp-{slug(paper)}"
                if pp_id not in paper_ids:
                    paper_ids.add(pp_id)
                    dur_sql = "NULL" if duration is None else str(duration)
                    papers_sql.append(
                        "("
                        + ", ".join(
                            [
                                sql_str(pp_id),
                                sql_str("Edexcel"),
                                sql_str("IGCSE"),
                                sql_str(subject_name),
                                sql_str(code),
                                sql_str(subject_id),
                                sql_str("curr-edexcel-igcse"),
                                str(year),
                                sql_str(series_name),
                                sql_str(paper),
                                "NULL",
                                sql_str(title),
                                str(total_marks),
                                dur_sql,
                                "strftime('%s', 'now') * 1000",
                            ]
                        )
                        + ")"
                    )
                    paper_count += 1

            tier_sql = "NULL" if entry["tier"] is None else sql_str(entry["tier"])
            variant_sql = "NULL" if entry["variant"] is None else sql_str(entry["variant"])

            target_papers = papers if len(papers) == 1 else papers[:1]

            for g in GRADES_91:
                if g not in bands:
                    continue
                mn, mx = bands[g]
                if mx < mn:
                    continue
                sgb_id = f"sgb-{code.lower()}-{series_code}-{slug(rk)}-{grade_id_suffix(g)}"
                subject_bounds_sql.append(
                    "("
                    + ", ".join(
                        [
                            sql_str(sgb_id),
                            sql_str(subject_id),
                            str(year),
                            sql_str(series_name),
                            variant_sql,
                            tier_sql,
                            sql_str(g),
                            str(mn),
                            str(mx),
                            "strftime('%s', 'now') * 1000",
                        ]
                    )
                    + ")"
                )
                subject_bound_count += 1

            for paper in target_papers:
                pp_id = f"pp-{code.lower()}-{series_code}-qp-{slug(paper)}"
                for g in GRADES_91:
                    if g not in bands:
                        continue
                    mn, mx = bands[g]
                    if mx < mn:
                        continue
                    gb_id = f"gb-{code.lower()}-{series_code}-{slug(paper)}-{grade_id_suffix(g)}"
                    paper_bounds_sql.append(
                        "("
                        + ", ".join(
                            [
                                sql_str(gb_id),
                                sql_str(pp_id),
                                sql_str(g),
                                str(mn),
                                str(mx),
                                "NULL",
                                "NULL",
                                "strftime('%s', 'now') * 1000",
                            ]
                        )
                        + ")"
                    )
                    paper_bound_count += 1

    parts: list[str] = []
    for chunk in chunked(papers_sql, 40):
        parts.append(
            "INSERT OR IGNORE INTO past_papers (id, exam_board, qualification, subject, syllabus_code, subject_id, curriculum_id, year, series, paper_number, variant, title, total_marks, duration_minutes, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )
    for chunk in chunked(paper_bounds_sql, 60):
        parts.append(
            "INSERT OR IGNORE INTO paper_grade_boundaries (id, past_paper_id, grade, min_mark, max_mark, ums_min, ums_max, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )
    for chunk in chunked(subject_bounds_sql, 60):
        parts.append(
            "INSERT OR IGNORE INTO subject_grade_boundaries (id, subject_id, year, series, variant, tier, grade, min_mark, max_mark, created_at) VALUES\n"
            + ",\n".join(chunk)
            + ";\n"
        )

    OUT.write_text("".join(parts), encoding="utf-8")
    size = OUT.stat().st_size
    print(f"Wrote {OUT}")
    print(f"size_bytes={size}")
    print(
        f"papers={paper_count} paper_boundaries={paper_bound_count} "
        f"subject_boundaries={subject_bound_count} routes={len(seen_routes)}"
    )


if __name__ == "__main__":
    main()
