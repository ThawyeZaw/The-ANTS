import pymupdf
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

for name, path in [
    ("Physics", "packages/db/seeds/pdfs/Edexcel/9781446957783_IAL_Physics_Iss3.pdf"),
    ("Chemistry", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Chemistry-Spec.pdf"),
    ("Biology", "packages/db/seeds/pdfs/Edexcel/International-A-Level-Biology-Spec.pdf")
]:
    doc = pymupdf.open(path)
    print(f"\n================ {name} ================")
    # Look for Unit 1 pages
    for p in range(10, 25):
        txt = doc[p-1].get_text()
        for line in txt.splitlines():
            line_s = line.strip()
            # Match subtopics like "1.1", "1.2", or numbered points "1", "2", "3"
            if re.match(r"^Topic\s+\d+", line_s, re.I) or re.match(r"^\d+\.\s+[A-Z]", line_s):
                print(f"  P{p}: {line_s}")
