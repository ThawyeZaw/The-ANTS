import sqlite3
import json
import re
from pathlib import Path

ROOT = Path(r"packages/db")
DRIZZLE = ROOT / "drizzle-d1"
SEEDS = ROOT / "seeds"

con = sqlite3.connect(":memory:")
con.execute("PRAGMA foreign_keys = OFF;")

def split_sql(text: str):
    text = text.replace("--> statement-breakpoint", "\n")
    parts = []
    buf = []
    in_single = False
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "'" and not in_single:
            in_single = True
            buf.append(ch)
        elif ch == "'" and in_single:
            if i + 1 < len(text) and text[i + 1] == "'":
                buf.append("''")
                i += 1
            else:
                in_single = False
                buf.append(ch)
        elif ch == ";" and not in_single:
            stmt = "".join(buf).strip()
            if stmt and not all(line.strip().startswith("--") or not line.strip() for line in stmt.splitlines()):
                cleaned = "\n".join(ln for ln in stmt.splitlines() if not ln.strip().startswith("--")).strip()
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

for mig in sorted(DRIZZLE.glob("*.sql")):
    for stmt in split_sql(mig.read_text(encoding="utf-8")):
        try:
            con.execute(stmt)
        except:
            pass

seeds = sorted(
    SEEDS.glob("*.sql"),
    key=lambda p: int(re.match(r"^(\d+)", p.name).group(1)) if re.match(r"^(\d+)", p.name) else 999
)
for s in seeds:
    if s.name.startswith("_"):
        continue
    for stmt in split_sql(s.read_text(encoding="utf-8")):
        try:
            con.execute(stmt)
        except:
            pass

cur = con.cursor()
subjects = cur.execute("SELECT id, curriculum_id, code, name FROM subjects ORDER BY curriculum_id, code").fetchall()

for curr in ['curr-caie-igcse', 'curr-caie-alevel', 'curr-edexcel-igcse', 'curr-edexcel-ial']:
    print(f"\n=================== {curr} ===================")
    subjs = [s for s in subjects if s[1] == curr]
    for s_id, curr_id, code, name in subjs:
        topics = cur.execute("SELECT id, name, subtopics FROM topics WHERE subject_id = ? ORDER BY order_index", (s_id,)).fetchall()
        total_topics = len(topics)
        valid_subtopics = 0
        placeholder_subtopics = 0
        total_st_count = 0
        for tid, tname, st_json in topics:
            if st_json:
                try:
                    st = json.loads(st_json)
                    if isinstance(st, list) and len(st) > 0:
                        if len(st) == 1 and st[0].get('title') == 'Coming soon':
                            placeholder_subtopics += 1
                        else:
                            valid_subtopics += 1
                            total_st_count += len(st)
                except:
                    pass
        status = "EMPTY" if total_topics == 0 else (
            "COMPLETE" if valid_subtopics == total_topics else (
                "NO_SUBTOPICS" if valid_subtopics == 0 else f"PARTIAL ({valid_subtopics}/{total_topics})"
            )
        )
        print(f"[{status:15}] {code:8} {name:35} | Topics: {total_topics:2} | Valid: {valid_subtopics:2} | CS: {placeholder_subtopics:2} | Subtopics: {total_st_count:3}")
