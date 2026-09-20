"""Generate official exam countdown seed from Pearson / Cambridge PDFs.

Times are stored as epoch ms for the Myanmar sitting clock:
  AM / Morning / Window -> 09:00 Asia/Yangon
  PM / Afternoon        -> 13:30 Asia/Yangon
  EV / Evening          -> 16:00 Asia/Yangon
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "0035_exams_countdown_official.sql"
CREATED = "strftime('%s', 'now') * 1000"
MMT = timezone(timedelta(hours=6, minutes=30))

MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}
WEEKDAYS = "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday"
MONTH_ALT = "|".join(m.title() for m in MONTHS)
DATE_LINE = re.compile(
    rf"^({WEEKDAYS})\s+(\d{{1,2}})\s+({MONTH_ALT})(?:\s+(\d{{4}}))?$",
    re.I,
)
CODE_CAIE = re.compile(r"^(\d{4})/(\d{2})$")
CODE_EDX = re.compile(r"^([A-Z0-9]{4,6})\s+([A-Z0-9]{2,4})$")
DURATION = re.compile(r"^(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$", re.I)
SESSION = re.compile(r"^(AM|PM|EV|Morning|Afternoon|Evening|Window)$", re.I)

# syllabus -> (subject_id, curriculum_id, board, qualification)
SUBJECTS: dict[str, tuple[str, str, str, str]] = {
    "0580": ("subj-caie-igcse-maths", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0606": ("subj-caie-igcse-addmaths", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0625": ("subj-caie-igcse-phys", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0620": ("subj-caie-igcse-chem", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0610": ("subj-caie-igcse-bio", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0478": ("subj-caie-igcse-cs", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0417": ("subj-caie-igcse-ict", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0500": ("subj-caie-igcse-eng-first", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0510": ("subj-caie-igcse-esl", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0455": ("subj-caie-igcse-econ", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0450": ("subj-caie-igcse-biz", "curr-caie-igcse", "CAIE", "IGCSE"),
    "0452": ("subj-caie-igcse-acc", "curr-caie-igcse", "CAIE", "IGCSE"),
    "9709": ("subj-caie-al-maths", "curr-caie-alevel", "CAIE", "A Level"),
    "9231": ("subj-caie-al-fmaths", "curr-caie-alevel", "CAIE", "A Level"),
    "9702": ("subj-caie-al-phys", "curr-caie-alevel", "CAIE", "A Level"),
    "9701": ("subj-caie-al-chem", "curr-caie-alevel", "CAIE", "A Level"),
    "9700": ("subj-caie-al-bio", "curr-caie-alevel", "CAIE", "A Level"),
    "9618": ("subj-caie-al-cs", "curr-caie-alevel", "CAIE", "A Level"),
    "9626": ("subj-caie-al-it", "curr-caie-alevel", "CAIE", "A Level"),
    "9708": ("subj-caie-al-econ", "curr-caie-alevel", "CAIE", "A Level"),
    "9609": ("subj-caie-al-biz", "curr-caie-alevel", "CAIE", "A Level"),
    "9706": ("subj-caie-al-acc", "curr-caie-alevel", "CAIE", "A Level"),
    "9093": ("subj-caie-al-eng-lang", "curr-caie-alevel", "CAIE", "A Level"),
    "9695": ("subj-caie-al-lit", "curr-caie-alevel", "CAIE", "A Level"),
    "4MA1": ("subj-edx-igcse-maths-a", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4MB1": ("subj-edx-igcse-maths-b", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4PM1": ("subj-edx-igcse-fmaths", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4PH1": ("subj-edx-igcse-phys", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4CH1": ("subj-edx-igcse-chem", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4BI1": ("subj-edx-igcse-bio", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4HB1": ("subj-edx-igcse-human-bio", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4CP0": ("subj-edx-igcse-cs", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4IT1": ("subj-edx-igcse-ict", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4EB1": ("subj-edx-igcse-eng-b", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4ES1": ("subj-edx-igcse-esl", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4EC1": ("subj-edx-igcse-econ", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4BS1": ("subj-edx-igcse-biz", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "4AC1": ("subj-edx-igcse-acc", "curr-edexcel-igcse", "Edexcel", "IGCSE"),
    "WMA11": ("subj-edx-ial-pure1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WMA12": ("subj-edx-ial-pure2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WMA13": ("subj-edx-ial-pure3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WMA14": ("subj-edx-ial-pure4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WME01": ("subj-edx-ial-mech1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WME02": ("subj-edx-ial-mech2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WME03": ("subj-edx-ial-mech3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WST01": ("subj-edx-ial-stat1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WST02": ("subj-edx-ial-stat2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WST03": ("subj-edx-ial-stat3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WFM01": ("subj-edx-ial-fmath1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WFM02": ("subj-edx-ial-fmath2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WFM03": ("subj-edx-ial-fmath3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WDM11": ("subj-edx-ial-dec1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPH11": ("subj-edx-ial-phys1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPH12": ("subj-edx-ial-phys2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPH13": ("subj-edx-ial-phys3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPH14": ("subj-edx-ial-phys4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPH15": ("subj-edx-ial-phys5", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPH16": ("subj-edx-ial-phys6", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCH11": ("subj-edx-ial-chem1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCH12": ("subj-edx-ial-chem2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCH13": ("subj-edx-ial-chem3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCH14": ("subj-edx-ial-chem4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCH15": ("subj-edx-ial-chem5", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCH16": ("subj-edx-ial-chem6", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBI11": ("subj-edx-ial-bio1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBI12": ("subj-edx-ial-bio2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBI13": ("subj-edx-ial-bio3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBI14": ("subj-edx-ial-bio4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBI15": ("subj-edx-ial-bio5", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBI16": ("subj-edx-ial-bio6", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEC11": ("subj-edx-ial-econ1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEC12": ("subj-edx-ial-econ2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEC13": ("subj-edx-ial-econ3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEC14": ("subj-edx-ial-econ4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBS11": ("subj-edx-ial-biz1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBS12": ("subj-edx-ial-biz2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBS13": ("subj-edx-ial-biz3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WBS14": ("subj-edx-ial-biz4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WAC11": ("subj-edx-ial-acc1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WAC12": ("subj-edx-ial-acc2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WIT11": ("subj-edx-ial-it1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WIT12": ("subj-edx-ial-it2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WIT13": ("subj-edx-ial-it3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WIT14": ("subj-edx-ial-it4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCP01": ("subj-edx-ial-cs1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCP02": ("subj-edx-ial-cs2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCP03": ("subj-edx-ial-cs3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WCP04": ("subj-edx-ial-cs4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEN01": ("subj-edx-ial-eng1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEN02": ("subj-edx-ial-eng2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEN03": ("subj-edx-ial-eng3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WEN04": ("subj-edx-ial-eng4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WET01": ("subj-edx-ial-lit1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WET02": ("subj-edx-ial-lit2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WET03": ("subj-edx-ial-lit3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WET04": ("subj-edx-ial-lit4", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPS01": ("subj-edx-ial-psych1", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPS02": ("subj-edx-ial-psych2", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPS03": ("subj-edx-ial-psych3", "curr-edexcel-ial", "Edexcel", "IAL"),
    "WPS04": ("subj-edx-ial-psych4", "curr-edexcel-ial", "Edexcel", "IAL"),
}

# Pearson renamed linear ESL 4ES1 -> modular 4WES1/2/3.
ESL_MAP = {
    ("4WES1", "01R"): ("4ES1", "01R"),
    ("4WES2", "01R"): ("4ES1", "02R"),
    ("4WES3", "01R"): ("4ES1", "03"),
    ("4WES1", "01"): ("4ES1", "01"),
    ("4WES2", "01"): ("4ES1", "02"),
    ("4WES3", "01"): ("4ES1", "03"),
}

CAIE_SPEAKING = {("0510", "04"), ("0510", "32"), ("0500", "04")}

TITLE_FIX = {
    ("0510", "12"): "English as a Second Language (Speaking Endorsement) P12",
    ("0510", "22"): "English as a Second Language (Listening) P22",
}


def esc(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def parse_duration(text: str) -> int | None:
    compact = text.strip().lower().replace(".", "")
    m = re.fullmatch(r"(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?", compact)
    if not m or (m.group(1) is None and m.group(2) is None):
        return None
    hours = int(m.group(1) or 0)
    mins = int(m.group(2) or 0)
    total = hours * 60 + mins
    return total if total > 0 else None


def session_clock(session: str) -> tuple[int, int]:
    key = session.strip().lower()
    if key in {"am", "morning", "window"}:
        return 9, 0
    if key in {"ev", "evening"}:
        return 16, 0
    return 13, 30


def to_ms(year: int, month: int, day: int, session: str) -> int:
    hour, minute = session_clock(session)
    dt = datetime(year, month, day, hour, minute, tzinfo=MMT)
    return int(dt.timestamp() * 1000)


def caie_keep_paper(paper: str) -> bool:
    if paper in {"02", "03", "04", "33", "34"}:
        return True
    return len(paper) == 2 and paper[1] == "2"


def exam_id(code: str, series: str, paper: str) -> str:
    return f"exam-{code.lower()}-{series}-p{paper.lower()}"


def load_marks() -> dict[tuple[str, str, str], int]:
    marks: dict[tuple[str, str, str], int] = {}
    pattern = re.compile(
        r"'(exam-[^']+)'.*?'((?:CAIE|Edexcel))'.*?'([^']+)'.*?'([^']+)'.*?'([^']+)'.*?'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+|NULL)",
    )
    for name in ("0006_exams_w26_countdown.sql", "0010_exams_jan27_countdown.sql"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            m = pattern.search(line)
            if not m:
                continue
            syllabus, series, paper, mark = m.group(3), m.group(5), m.group(6), m.group(9)
            if mark != "NULL":
                marks[(syllabus, series, paper)] = int(mark)
    return marks


class Row:
    __slots__ = ("code", "paper", "title", "season", "series", "date_ms", "duration", "session")

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


def nonempty(lines: list[str]) -> list[str]:
    return [ln.strip() for ln in lines if ln.strip()]


def parse_cie_syllabus_view(text: str) -> list[Row]:
    lines = nonempty(text.splitlines())
    rows: list[Row] = []
    i = 0
    while i < len(lines):
        m = CODE_CAIE.match(lines[i])
        if not m:
            i += 1
            continue
        code, paper = m.group(1), m.group(2)
        title = lines[i - 1] if i else code
        dur = parse_duration(lines[i + 1]) if i + 1 < len(lines) else None
        date_s = ""
        session = ""
        j = i + 2
        chunks: list[str] = []
        while j < len(lines) and len(chunks) < 4:
            piece = lines[j]
            if SESSION.match(piece) and date_s:
                session = piece
                break
            chunks.append(piece)
            joined = " ".join(chunks)
            dm = DATE_LINE.match(joined)
            if dm and dm.group(4):
                date_s = joined
            j += 1
        dm = DATE_LINE.match(date_s)
        if code in SUBJECTS and caie_keep_paper(paper) and (code, paper) not in CAIE_SPEAKING and dm and session and dur:
            rows.append(
                Row(
                    code=code,
                    paper=paper,
                    title=f"{title} P{paper}",
                    season="Oct/Nov",
                    series="w26",
                    date_ms=to_ms(int(dm.group(4)), MONTHS[dm.group(3).lower()], int(dm.group(2)), session),
                    duration=dur,
                    session=session,
                )
            )
        i += 1
    return rows


def parse_cie_windows(text: str) -> list[Row]:
    rows: list[Row] = []
    window = re.compile(r"^(\d{4})/(\d{2})$")
    date_span = re.compile(r"^(\d{2})/(\d{2})/(\d{4})[–-](\d{2})/(\d{2})/(\d{4})$")
    lines = nonempty(text.splitlines())
    for i, line in enumerate(lines):
        m = window.match(line)
        if not m:
            continue
        code, paper = m.group(1), m.group(2)
        title = lines[i - 1] if i else code
        span = date_span.match(lines[i + 1]) if i + 1 < len(lines) else None
        if not span:
            continue
        if span.group(1, 2, 3) != span.group(4, 5, 6):
            continue
        if code in SUBJECTS and caie_keep_paper(paper) and (code, paper) not in CAIE_SPEAKING:
            day, month, year = int(span.group(1)), int(span.group(2)), int(span.group(3))
            rows.append(
                Row(
                    code=code,
                    paper=paper,
                    title=f"{title} P{paper}",
                    season="Oct/Nov",
                    series="w26",
                    date_ms=to_ms(year, month, day, "AM"),
                    duration=None,
                    session="AM",
                )
            )
    return rows


def map_edx_code(code: str, paper: str) -> tuple[str, str] | None:
    mapped = ESL_MAP.get((code, paper))
    if mapped:
        return mapped
    if code in SUBJECTS:
        return code, paper
    return None


def parse_pearson(text: str, year: int, season: str, series: str) -> list[Row]:
    # Week view only — subject index duplicates sittings.
    cut = re.split(r"Subject Index", text, maxsplit=1, flags=re.I)[0]
    lines = nonempty(cut.splitlines())
    rows: list[Row] = []
    current: tuple[int, int, int] | None = None
    i = 0
    while i < len(lines):
        dm = DATE_LINE.match(lines[i])
        if dm:
            y = int(dm.group(4) or year)
            current = (y, MONTHS[dm.group(3).lower()], int(dm.group(2)))
            i += 1
            continue
        cm = CODE_EDX.match(lines[i])
        if not cm or current is None:
            i += 1
            continue
        raw_code, raw_paper = cm.group(1), cm.group(2)
        mapped = map_edx_code(raw_code, raw_paper)
        title_parts: list[str] = []
        session = ""
        duration = None
        j = i + 1
        while j < len(lines) and j < i + 8:
            if SESSION.match(lines[j]):
                session = lines[j]
                if j + 1 < len(lines):
                    duration = parse_duration(lines[j + 1])
                break
            if DATE_LINE.match(lines[j]) or CODE_EDX.match(lines[j]):
                break
            title_parts.append(lines[j])
            j += 1
        if mapped and session:
            code, paper = mapped
            title = " ".join(title_parts).replace("  ", " ").strip() or f"{code} {paper}"
            rows.append(
                Row(
                    code=code,
                    paper=paper,
                    title=title,
                    season=season,
                    series=series,
                    date_ms=to_ms(current[0], current[1], current[2], session),
                    duration=duration,
                    session=session,
                )
            )
        i += 1
    return rows


def merge_rows(groups: list[list[Row]]) -> list[Row]:
    best: dict[tuple[str, str, str], Row] = {}
    for group in groups:
        for row in group:
            key = (row.code, row.series, row.paper)
            prev = best.get(key)
            if prev is None or row.date_ms < prev.date_ms:
                best[key] = row
    return sorted(best.values(), key=lambda r: (r.series, r.code, r.date_ms, r.paper))


def emit_sql(rows: list[Row], marks: dict[tuple[str, str, str], int]) -> str:
    header = """-- 0035_exams_countdown_official.sql
-- Official sitting dates from Cambridge Zone 4 Nov 2026 and Pearson IGCSE/IAL PDFs.
-- exam_date is Asia/Yangon 09:00 (AM/Window), 13:30 (PM), or 16:00 (evening).
-- Regenerated by packages/db/seeds/_gen_exams_countdown.py

"""
    lines = [header]
    chunk: list[str] = []
    cols = "(id, subject_id, curriculum_id, title, exam_board, qualification_type, syllabus_code, season, series, paper_number, exam_date, duration_minutes, total_marks, created_at)"

    def flush():
        nonlocal chunk
        if not chunk:
            return
        lines.append(f"INSERT INTO exams {cols} VALUES")
        lines.append(",\n".join(chunk))
        lines.append(
            """
ON CONFLICT(id) DO UPDATE SET
  subject_id=excluded.subject_id,
  curriculum_id=excluded.curriculum_id,
  title=excluded.title,
  exam_board=excluded.exam_board,
  qualification_type=excluded.qualification_type,
  syllabus_code=excluded.syllabus_code,
  season=excluded.season,
  series=excluded.series,
  paper_number=excluded.paper_number,
  exam_date=excluded.exam_date,
  duration_minutes=COALESCE(excluded.duration_minutes, exams.duration_minutes),
  total_marks=COALESCE(excluded.total_marks, exams.total_marks);
"""
        )
        chunk = []

    for row in rows:
        meta = SUBJECTS.get(row.code)
        if not meta:
            continue
        subject_id, curriculum_id, board, qual = meta
        mark = marks.get((row.code, row.series, row.paper))
        duration = "NULL" if row.duration is None else str(row.duration)
        mark_sql = "NULL" if mark is None else str(mark)
        title = TITLE_FIX.get((row.code, row.paper), row.title)
        chunk.append(
            f"({esc(exam_id(row.code, row.series, row.paper))}, {esc(subject_id)}, {esc(curriculum_id)}, {esc(title)}, {esc(board)}, {esc(qual)}, {esc(row.code)}, {esc(row.season)}, {esc(row.series)}, {esc(row.paper)}, {row.date_ms}, {duration}, {mark_sql}, {CREATED})"
        )
        if len(chunk) >= 18:
            flush()
    flush()
    return "".join(lines) if lines[-1].endswith("\n") else "\n".join(lines) + "\n"


def main() -> None:
    extract = ROOT / "_pdf_extract"
    cie = (extract / "cie_w26.txt").read_text(encoding="utf-8")
    rows = merge_rows(
        [
            parse_cie_windows(cie),
            parse_cie_syllabus_view(cie),
            parse_pearson((extract / "edx_igcse_n26.txt").read_text(encoding="utf-8"), 2026, "Oct/Nov", "w26"),
            parse_pearson((extract / "edx_igcse_r_s27.txt").read_text(encoding="utf-8"), 2027, "May/June", "s27"),
            parse_pearson((extract / "edx_igcse_s27.txt").read_text(encoding="utf-8"), 2027, "May/June", "s27"),
            parse_pearson((extract / "edx_ial_o26.txt").read_text(encoding="utf-8"), 2026, "Oct/Nov", "w26"),
            parse_pearson((extract / "edx_ial_j27.txt").read_text(encoding="utf-8"), 2027, "Jan", "j27"),
            parse_pearson((extract / "edx_ial_s27.txt").read_text(encoding="utf-8"), 2027, "May/June", "s27"),
        ]
    )

    def is_edx_igcse(row: Row) -> bool:
        meta = SUBJECTS.get(row.code)
        return bool(meta and meta[2] == "Edexcel" and meta[3] == "IGCSE")

    r_s27 = {(row.code, row.paper) for row in rows if row.series == "s27" and is_edx_igcse(row) and row.paper.endswith("R")}
    filtered: list[Row] = []
    for row in rows:
        if row.series == "s27" and is_edx_igcse(row) and not row.paper.endswith("R") and row.paper != "03":
            if (row.code, f"{row.paper}R") in r_s27:
                continue
            if row.code != "4CP0":
                row.paper = f"{row.paper}R"
        filtered.append(row)
    rows = merge_rows([filtered])
    for row in rows:
        if row.duration is None:
            row.duration = {
                ("0417", "02"): 150,
                ("0417", "03"): 150,
                ("9626", "02"): 150,
                ("9626", "04"): 150,
                ("9618", "42"): 150,
            }.get((row.code, row.paper))
    marks = load_marks()
    OUT.write_text(emit_sql(rows, marks), encoding="utf-8")
    print(f"wrote {OUT.name} rows={len(rows)}")
    by_series: dict[str, int] = {}
    for row in rows:
        by_series[row.series] = by_series.get(row.series, 0) + 1
    print(by_series)
    missing = [row.code for row in rows if row.code not in SUBJECTS]
    if missing:
        print("unmapped", sorted(set(missing)))


if __name__ == "__main__":
    main()
