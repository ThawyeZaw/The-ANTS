import sys
sys.path.append('.')
from scratch.audit_all_subjects import con

cur = con.cursor()

print("=== WBI12 topics ===")
for t in cur.execute("SELECT id, name, subtopics FROM topics WHERE subject_id = 'subj-edx-ial-bio2' ORDER BY order_index").fetchall():
    is_cs = "Coming soon" in (t[2] or "")
    print(" ", t[0], "|", t[1], "|", "[CS]" if is_cs else "[OK]")

print("\n=== WFM01 topics ===")
for t in cur.execute("SELECT id, name, subtopics FROM topics WHERE subject_id = 'subj-edx-ial-fmath1' ORDER BY order_index").fetchall():
    is_cs = "Coming soon" in (t[2] or "")
    print(" ", t[0], "|", t[1], "|", "[CS]" if is_cs else "[OK]")
