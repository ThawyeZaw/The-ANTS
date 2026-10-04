import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open("packages/db/seeds/pdfs/Edexcel/international-a-level-maths-spec.pdf")

# Let's inspect page ranges for Unit M1 (PDF page 50-52), Unit S1 (59-62), Unit D1 (69-72)
for unit_name, start_p, end_p in [
    ("M1", 50, 52),
    ("M2", 53, 55),
    ("S1", 59, 62),
    ("S2", 63, 65),
    ("D1", 69, 73),
    ("FP1", 36, 41),
    ("FP2", 42, 45),
    ("FP3", 46, 49)
]:
    print(f"\n================ Unit {unit_name} (PDF pages {start_p}-{end_p}) ================")
    for p in range(start_p, end_p + 1):
        txt = doc[p-1].get_text()
        for line in txt.splitlines():
            line_str = line.strip()
            # Match lines that look like main numbered headings e.g. "1. Mathematical models", "1.1 Vectors", "2. Kinematics"
            if re.match(r"^(\d+)\.\s+[A-Z]", line_str) or re.match(r"^(\d+\.\d+)\s+[A-Z]", line_str):
                print(f"  P{p}: {line_str}")
