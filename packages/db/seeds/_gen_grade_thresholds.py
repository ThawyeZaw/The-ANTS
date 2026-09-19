"""Generate CAIE IGCSE grade-threshold seed SQL from official Cambridge PDFs."""
from __future__ import annotations

import re
from pathlib import Path
from statistics import mean

import pymupdf as fitz

PDF_DIR = Path(__file__).resolve().parent / "pdfs" / "CIE"
PDFS = [
    PDF_DIR / "GradeBoundaries_IGCSE_2022_March_to_2023_OctNov.pdf",
    PDF_DIR / "GradeBoundaries_IGCSE_2024_March_to_2025_March.pdf",
    PDF_DIR / "GradeBoundaries_IGCSE_2025_June_to_2026_June.pdf",
]

OUT = Path(__file__).with_name("0004_caie_igcse_grade_thresholds.sql")

SUBJECTS = {
    "0580": ("subj-caie-igcse-maths", "Mathematics"),
    "0606": ("subj-caie-igcse-addmaths", "Additional Mathematics"),
    "0610": ("subj-caie-igcse-bio", "Biology"),
    "0417": ("subj-caie-igcse-ict", "Information and Communication Technology"),
    "0450": ("subj-caie-igcse-biz", "Business Studies"),
    "0452": ("subj-caie-igcse-acc", "Accounting"),
    "0625": ("subj-caie-igcse-phys", "Physics"),
    "0620": ("subj-caie-igcse-chem", "Chemistry"),
    "0478": ("subj-caie-igcse-cs", "Computer Science"),
    "0500": ("subj-caie-igcse-eng-first", "First Language English"),
    "0510": ("subj-caie-igcse-esl", "English as a Second Language"),
    "0455": ("subj-caie-igcse-econ", "Economics"),
}

DURATIONS = {
    "0580": {"1": 60, "2": 90, "3": 120, "4": 150, "5": 90},
    "0606": {"1": 120, "2": 120},
    "0610": {"1": 45, "2": 45, "3": 75, "4": 75, "5": 75, "6": 60},
    "0620": {"1": 45, "2": 45, "3": 75, "4": 75, "5": 75, "6": 60},
    "0625": {"1": 45, "2": 45, "3": 75, "4": 75, "5": 75, "6": 60},
    "0478": {"1": 75, "2": 75},
    "0417": {"1": 120, "2": 90, "3": 150},
    "0450": {"1": 90, "2": 90},
    "0452": {"1": 105, "2": 105},
    "0500": {"1": 120, "2": 120, "3": 60, "4": 45},
    "0510": {"1": 120, "2": 120, "3": 45},
    "0455": {"1": 45, "2": 135},
}

PAPER_TITLES = {
    "0580": {
        "1": "Paper 1 (Core)",
        "2": "Paper 2 (Extended)",
        "3": "Paper 3 (Core)",
        "4": "Paper 4 (Extended)",
        "5": "Paper 5",
    },
    "0606": {"1": "Paper 1", "2": "Paper 2"},
    "0610": {
        "1": "Paper 1 Multiple Choice (Core)",
        "2": "Paper 2 Multiple Choice (Extended)",
        "3": "Paper 3 Theory (Core)",
        "4": "Paper 4 Theory (Extended)",
        "5": "Paper 5 Practical Test",
        "6": "Paper 6 Alternative to Practical",
    },
    "0620": {
        "1": "Paper 1 Multiple Choice (Core)",
        "2": "Paper 2 Multiple Choice (Extended)",
        "3": "Paper 3 Theory (Core)",
        "4": "Paper 4 Theory (Extended)",
        "5": "Paper 5 Practical Test",
        "6": "Paper 6 Alternative to Practical",
    },
    "0625": {
        "1": "Paper 1 Multiple Choice (Core)",
        "2": "Paper 2 Multiple Choice (Extended)",
        "3": "Paper 3 Theory (Core)",
        "4": "Paper 4 Theory (Extended)",
        "5": "Paper 5 Practical Test",
        "6": "Paper 6 Alternative to Practical",
    },
    "0478": {
        "1": "Paper 1 Computer Systems",
        "2": "Paper 2 Algorithms, Programming and Logic",
    },
    "0417": {
        "1": "Paper 1 Theory",
        "2": "Paper 2 Document Production, Databases and Presentations",
        "3": "Paper 3 Spreadsheets and Website Authoring",
    },
    "0450": {
        "1": "Paper 1 Short Answer and Data Response",
        "2": "Paper 2 Case Study",
    },
    "0452": {"1": "Paper 1", "2": "Paper 2"},
    "0500": {
        "0": "Component 3 Coursework",
        "1": "Paper 1 Reading",
        "2": "Paper 2 Directed Writing and Composition",
        "3": "Component 3 Coursework",
        "4": "Component 4 Speaking & Listening",
    },
    "0510": {
        "1": "Paper 1 Reading and Writing",
        "2": "Paper 2 Listening",
        "3": "Component 3 Speaking",
    },
    "0455": {
        "1": "Paper 1 Multiple Choice",
        "2": "Paper 2 Structured Questions",
    },
}

SERIES_MAP = {
    "March": ("Feb/March", "m"),
    "June": ("May/June", "s"),
    "November": ("Oct/Nov", "w"),
}

COMP_GRADES = ["A", "B", "C", "D", "E", "F", "G"]
OPT_GRADES = ["A*", "A", "B", "C", "D", "E", "F", "G"]
ALL_GRADES = ["A*", "A", "B", "C", "D", "E", "F", "G", "U"]

DASH = re.compile(r"^[\-\u2013\u2014\u2212\ufffd\u00ad•·]+$")


def parse_num(tok: str):
    tok = tok.strip()
    if not tok or DASH.match(tok):
        return None
    if tok.isdigit():
        return int(tok)
    return None


def series_from_header(text: str):
    m = re.search(
        r"Grade thresholds\s+[^\nA-Za-z0-9]*\s*(March|June|November)\s+(\d{4})",
        text,
    )
    if not m:
        m = re.search(r"(March|June|November)\s+(\d{4})\s+examination", text)
    if not m:
        return None
    return m.group(1), int(m.group(2))


def syllabus_from_header(text: str):
    # Prefer "Syllabus NNNN" — works when the subject title wraps across lines (e.g. 0510).
    m = re.search(r"Syllabus\s+(\d{4})", text)
    if m:
        return m.group(1)
    m = re.search(r"Cambridge IGCSE.{0,160}?\((\d{4})\)", text, re.DOTALL)
    if m:
        return m.group(1)
    return None


def tokenize_lines(text: str):
    text = text.replace("\u00a0", " ")
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    return [ln for ln in lines if ln]


def detect_comp_grade_headers(text: str) -> list[str]:
    """Return A–G style component grade columns. Skip speaking 1–5 endorsement tables."""
    lines = tokenize_lines(text)
    best: list[str] = []
    for i, ln in enumerate(lines):
        if ln != "available" and not ln.startswith("Maximum raw"):
            continue
        grades: list[str] = []
        speaking = False
        for j in range(i + 1, min(i + 12, len(lines))):
            if lines[j] in COMP_GRADES:
                grades.append(lines[j])
            elif lines[j] == "A*":
                continue
            elif lines[j] in {"1", "2", "3", "4", "5"}:
                speaking = True
                break
            elif lines[j].startswith("Component"):
                break
            elif grades:
                break
        if speaking:
            continue
        if grades and grades[0] == "A" and len(grades) >= len(best):
            best = grades
    return best or COMP_GRADES


def extract_component_rows(text: str):
    lines = tokenize_lines(text)
    grade_headers = detect_comp_grade_headers(text)
    expected = 1 + len(grade_headers)  # max + grades
    rows = []
    i = 0
    while i < len(lines):
        m = re.match(r"^Component\s+(\d{2})\s*$", lines[i])
        m2 = re.match(r"^Component\s+(\d{2})\s+(.+)$", lines[i])
        if m or m2:
            comp = m.group(1) if m else m2.group(1)
            # Some components are 2 digits (e.g., 12 means Paper 1, Variant 2)
            # For ICT, sometimes papers are just '02' or '03' indicating Paper 2 or Paper 3.
            if comp.startswith("0"):
                paper = comp[1]
                variant = None
            else:
                paper = comp[0]
                variant = comp[1] if len(comp) > 1 else None

            # Look ahead for grades
            nums: list[str] = []
            if m2:
                nums.extend(m2.group(2).strip().split())
            j = i + 1
            while j < len(lines) and len(nums) < expected:
                if re.match(r"^Component\s+\d{2}", lines[j]):
                    break
                if lines[j].startswith("Grade A*") or lines[j].startswith("The overall"):
                    break
                if lines[j].startswith("Option ") or lines[j] == "Option":
                    break
                if lines[j].startswith("Maximum raw") or lines[j] in (
                    "mark",
                    "available",
                    "Minimum raw mark required for grade:",
                ):
                    j += 1
                    continue
                if lines[j] in COMP_GRADES + OPT_GRADES:
                    j += 1
                    continue
                nums.extend(lines[j].split())
                j += 1
            vals = []
            for p in nums:
                if len(vals) >= expected:
                    break
                if p in COMP_GRADES + OPT_GRADES + ["available", "mark"]:
                    continue
                n = parse_num(p)
                if n is None and not DASH.match(p):
                    continue
                vals.append(n)
            if len(vals) >= expected:
                total = vals[0]
                gmap = {g: None for g in COMP_GRADES}
                for g, v in zip(grade_headers, vals[1:expected]):
                    gmap[g] = v
                if isinstance(total, int):
                    rows.append((comp, total, gmap))
                i = j
                continue
        i += 1
    return rows


def detect_opt_grade_headers(text: str) -> list[str]:
    lines = tokenize_lines(text)
    # Find overall table headers after "Combination of" / "components"
    for i, ln in enumerate(lines):
        if ln == "components" or ln.startswith("Combination of"):
            grades = []
            for j in range(i + 1, min(i + 15, len(lines))):
                tok = lines[j]
                if tok == "A*":
                    grades.append("A*")
                elif tok in COMP_GRADES:
                    grades.append(tok)
                elif grades:
                    break
            if grades and "A*" in grades and "A" in grades:
                return grades
    # Fallback from component scale
    comp = detect_comp_grade_headers(text)
    if comp == ["A", "B", "C", "D", "E"]:
        return ["A*", "A", "B", "C", "D", "E"]
    return OPT_GRADES


def is_option_code(line: str) -> bool:
    if line in COMP_GRADES + OPT_GRADES + ["Option", "available", "mark"]:
        return False
    # AY, BX, Y, AS (A2), BS (B2), P1, etc.
    return bool(re.fullmatch(r"[A-Z]{1,3}\d?(?:\s*\([^)]+\))?", line))


def extract_option_rows(text: str):
    lines = tokenize_lines(text)
    grade_headers = detect_opt_grade_headers(text)
    expected = len(grade_headers)
    rows = []
    i = 0
    while i < len(lines):
        if is_option_code(lines[i]) and i + 2 < len(lines):
            opt = re.split(r"\s*\(", lines[i])[0].strip()
            maxm = parse_num(lines[i + 1])
            comps: list[int] = []
            j = i + 2
            while j < len(lines) and re.match(r"^[\d,/\s]+$", lines[j]):
                comps.extend(int(x) for x in re.findall(r"\d+", lines[j]))
                j += 1
                if j < len(lines) and (parse_num(lines[j]) is not None or DASH.match(lines[j])):
                    break
            if maxm is None or not comps:
                i += 1
                continue
            vals = []
            while j < len(lines) and len(vals) < expected:
                if is_option_code(lines[j]):
                    break
                if lines[j].startswith("Grade") or lines[j].startswith("Learn more"):
                    break
                if lines[j].startswith("Cambridge") or lines[j].startswith("Component"):
                    break
                for p in lines[j].split():
                    if len(vals) >= expected:
                        break
                    if p in OPT_GRADES:
                        continue
                    n = parse_num(p)
                    if n is None and not DASH.match(p):
                        continue
                    vals.append(n)
                j += 1
            if len(vals) == expected:
                gmap = {g: None for g in OPT_GRADES}
                for g, v in zip(grade_headers, vals):
                    gmap[g] = v
                rows.append({"code": opt, "max": maxm, "components": comps, "grades": gmap})
                i = j
                continue
        i += 1
    return rows


def derive_astar(comp_code: str, a_mark: int | None, total: int, options: list) -> int | None:
    """Cambridge does not publish component A*; derive from overall options when possible."""
    code_i = int(comp_code)
    # Sole-component options: use published overall A* directly
    for opt in options:
        if opt["components"] == [code_i] and opt["grades"].get("A*") is not None:
            return opt["grades"]["A*"]
    if a_mark is None:
        return None
    ratios = []
    for opt in options:
        if code_i not in opt["components"]:
            continue
        astar = opt["grades"].get("A*")
        a = opt["grades"].get("A")
        if astar is None or a is None or a == 0:
            continue
        ratios.append(astar / a)
    if not ratios:
        return None
    val = int(round(a_mark * mean(ratios)))
    return min(total, max(a_mark + 1, val))


def build_bands(total: int, published: dict, astar: int | None) -> dict[str, tuple[int, int]]:
    """Build continuous min/max bands for A*..U. Missing grades are omitted."""
    thresholds: dict[str, int] = {}
    if astar is not None:
        thresholds["A*"] = astar
    for g in COMP_GRADES:
        if published.get(g) is not None:
            thresholds[g] = published[g]

    # Ensure monotonic non-increasing thresholds down the grade scale
    ordered = [g for g in ALL_GRADES if g in thresholds]
    cleaned: dict[str, int] = {}
    prev = total + 1
    for g in ordered:
        v = thresholds[g]
        if v >= prev:
            v = prev - 1
        if v < 0:
            continue
        cleaned[g] = v
        prev = v

    if not cleaned:
        return {"U": (0, total)}

    bands: dict[str, tuple[int, int]] = {}
    grades = [g for g in ALL_GRADES if g in cleaned]
    for idx, g in enumerate(grades):
        mn = cleaned[g]
        if idx == 0:
            mx = total
        else:
            mx = cleaned[grades[idx - 1]] - 1
        if mx < mn:
            mx = mn
        bands[g] = (mn, mx)

    lowest = min(cleaned.values())
    u_max = lowest - 1
    if u_max >= 0:
        bands["U"] = (0, u_max)
    elif "U" not in bands:
        # lowest threshold is 0 — U still exists as empty; skip
        pass
    return bands


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def grade_id_suffix(grade: str) -> str:
    return "Astar" if grade == "A*" else grade


def paper_meta(syllabus: str, comp: str):
    paper_number = comp[0]
    variant = comp[1]
    base = PAPER_TITLES.get(syllabus, {}).get(paper_number, f"Paper {paper_number}")
    title = f"{base} Variant {variant}"
    duration = DURATIONS.get(syllabus, {}).get(paper_number)
    return paper_number, variant, title, duration


def main():
    sessions: dict[tuple, dict] = {}

    for path in PDFS:
        doc = fitz.open(path)
        pending = None
        for pi in range(doc.page_count):
            text = doc[pi].get_text()
            cont = "continued" in text.lower() and "grade thresholds" in text.lower()
            season_year = series_from_header(text)
            syllabus = syllabus_from_header(text)
            comps = extract_component_rows(text)
            opts = extract_option_rows(text)

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

    # Sanity check
    sample = sessions.get(("0580", "June", 2023), {}).get("components", {}).get("22")
    print("0580 June 2023 Comp22:", sample)

    papers_sql: list[str] = []
    bounds_sql: list[str] = []
    paper_count = 0
    bound_count = 0

    for (syllabus, season, year) in sorted(sessions.keys(), key=lambda k: (k[0], k[2], k[1])):
        subject_id, subject_name = SUBJECTS[syllabus]
        series_name, series_letter = SERIES_MAP[season]
        series_code = f"{series_letter}{str(year)[2:]}"
        data = sessions[(syllabus, season, year)]

        for comp in sorted(data["components"].keys()):
            info = data["components"][comp]
            total = info["total"]
            published = info["grades"]
            astar = derive_astar(comp, published.get("A"), total, data["options"])
            bands = build_bands(total, published, astar)

            # Emit published (+ derived A*) bands. Skip unpublished Cambridge cells (–)
            # so Core papers omit A*/A/B and Extended Maths omits F/G.
            paper_number, variant, title, duration = paper_meta(syllabus, comp)
            pp_id = f"pp-{syllabus}-{series_code}-qp-{comp}"
            dur_sql = "NULL" if duration is None else str(duration)

            papers_sql.append(
                "("
                + ", ".join(
                    [
                        sql_str(pp_id),
                        sql_str("CAIE"),
                        sql_str("IGCSE"),
                        sql_str(subject_name),
                        sql_str(syllabus),
                        sql_str(subject_id),
                        sql_str("curr-caie-igcse"),
                        str(year),
                        sql_str(series_name),
                        sql_str(paper_number),
                        sql_str(variant),
                        sql_str(title),
                        str(total),
                        dur_sql,
                        "strftime('%s', 'now') * 1000",
                    ]
                )
                + ")"
            )
            paper_count += 1

            for g in ALL_GRADES:
                if g not in bands:
                    continue
                mn, mx = bands[g]
                if mx < mn or mn > total:
                    continue
                gb_id = f"gb-{syllabus}-{series_code}-{comp}-{grade_id_suffix(g)}"
                bounds_sql.append(
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
                bound_count += 1

    def chunked(items: list[str], n: int):
        for i in range(0, len(items), n):
            yield items[i : i + n]

    parts: list[str] = []
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
    print(f"papers={paper_count} boundaries={bound_count} sessions={len(sessions)}")


if __name__ == "__main__":
    main()
