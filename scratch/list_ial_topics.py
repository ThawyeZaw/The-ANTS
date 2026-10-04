import sys
sys.path.append('.')
from scratch.audit_all_subjects import con
sys.stdout.reconfigure(encoding='utf-8')

cur = con.cursor()
subjects = cur.execute("SELECT id, code, name FROM subjects WHERE curriculum_id = 'curr-edexcel-ial' ORDER BY code").fetchall()

for s_id, code, name in subjects:
    topics = cur.execute("SELECT id, name, order_index, subtopics FROM topics WHERE subject_id = ? ORDER BY order_index", (s_id,)).fetchall()
    print(f"\n=== {code}: {name} ({s_id}) [{len(topics)} topics] ===")
    for tid, tname, oidx, st in topics:
        is_cs = "Coming soon" in (st or "")
        print(f"  {oidx}: {tid} | {tname} | {'[COMING SOON]' if is_cs else '[VALID]'}")
